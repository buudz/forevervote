import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { castVote, retractVote } from "../../../../lib/supabase/polls";
import { ensureUserFromSession } from "../../../../lib/supabase/users";

function jsonError(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request, context) {
  if (!sameOrigin(request)) {
    return jsonError("invalid_origin", 403);
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user?.battlenetAccountId) {
    return jsonError("login_required", 401);
  }

  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const optionId = body?.optionId;
  const action = body?.action === "retract" ? "retract" : "vote";

  if (!slug || !optionId || typeof optionId !== "string") {
    return jsonError("invalid_option", 400);
  }

  try {
    const user = await ensureUserFromSession(session);

    if (action === "retract") {
      const retractedVote = await retractVote({
        pollSlug: slug,
        optionId,
        userId: user.id
      });

      return NextResponse.json({ ok: true, vote: null, retracted: true, retractedVote }, { status: 200 });
    }

    const vote = await castVote({
      pollSlug: slug,
      optionId,
      userId: user.id
    });

    return NextResponse.json({ ok: true, vote }, { status: 200 });
  } catch (error) {
    console.error("Failed to update vote", error.message);
    return jsonError(error.status === 404 ? "poll_not_found" : "vote_failed", error.status || 500);
  }
}
