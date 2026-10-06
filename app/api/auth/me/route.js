import { NextResponse } from "next/server";
import { isAdminSession } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getUserByBattleNetAccountId, userPollPreferences } from "../../../lib/supabase/users";

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user?.battlenetAccountId) {
    return NextResponse.json({ authenticated: false, admin: false }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const user = await getUserByBattleNetAccountId(session.user.battlenetAccountId).catch(() => null);

  return NextResponse.json({
    authenticated: true,
    admin: await isAdminSession(session),
    user: {
      battletag: session.user?.battletag || "Battle.net user"
    },
    preferences: userPollPreferences(user)
  }, {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}
