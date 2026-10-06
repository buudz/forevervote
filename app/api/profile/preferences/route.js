import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { isTrustedMutationRequest, readJsonBody, RequestBodyError } from "../../../lib/http/request";
import { ensureUserFromSession, updateUserPollPreferences, userPollPreferences } from "../../../lib/supabase/users";

export async function POST(request) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.user?.battlenetAccountId) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  let body;

  try {
    body = await readJsonBody(request, { maxBytes: 2_048, fallback: {} });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
    }
    throw error;
  }

  try {
    const user = await ensureUserFromSession(session);
    const updated = await updateUserPollPreferences(user.id, {
      sort: body.sort,
      voteFilter: body.voteFilter
    });

    return NextResponse.json({
      ok: true,
      preferences: userPollPreferences(updated || user)
    }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error.status === 400 ? "invalid_preferences" : "preferences_failed"
    }, {
      status: error.status || 500,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
