import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { ensureUserFromSession, updateUserPollPreferences, userPollPreferences } from "../../../lib/supabase/users";

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

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
