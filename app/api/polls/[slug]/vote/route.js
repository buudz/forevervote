import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { castVote } from "../../../../lib/supabase/polls";
import { ensureUserFromSession } from "../../../../lib/supabase/users";

function jsonError(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

export async function POST(request, { params }) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user?.battlenetAccountId) {
    return jsonError("login_required", 401);
  }

  if (!session?.wowProfile?.hasClassicProfile) {
    return jsonError("classic_profile_required", 403);
  }

  const body = await request.json().catch(() => null);
  const optionId = body?.optionId;

  if (!optionId || typeof optionId !== "string") {
    return jsonError("invalid_option", 400);
  }

  try {
    const user = await ensureUserFromSession(session);
    const vote = await castVote({
      pollSlug: params.slug,
      optionId,
      userId: user.id
    });

    return NextResponse.json({ ok: true, vote }, { status: 200 });
  } catch (error) {
    console.error("Failed to cast vote", error.message);
    return jsonError(error.status === 404 ? "poll_not_found" : "vote_failed", error.status || 500);
  }
}
