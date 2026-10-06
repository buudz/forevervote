import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { isTrustedMutationRequest, readJsonBody, RequestBodyError } from "../../../../lib/http/request";
import { castVote, retractVote } from "../../../../lib/supabase/polls";
import { ensureUserFromSession } from "../../../../lib/supabase/users";

function jsonError(code, status) {
  return NextResponse.json({ ok: false, error: code }, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request, context) {
  if (!isTrustedMutationRequest(request)) {
    return jsonError("invalid_origin", 403);
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user?.battlenetAccountId) {
    return jsonError("login_required", 401);
  }

  const { slug } = await context.params;
  let body;

  try {
    body = await readJsonBody(request, { maxBytes: 2_048 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

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

      return NextResponse.json({ ok: true, vote: null, retracted: true, retractedVote }, {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      });
    }

    const vote = await castVote({
      pollSlug: slug,
      optionId,
      userId: user.id
    });

    return NextResponse.json({ ok: true, vote }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Failed to update vote", error.message);
    return jsonError(error.status === 404 ? "poll_not_found" : "vote_failed", error.status || 500);
  }
}
