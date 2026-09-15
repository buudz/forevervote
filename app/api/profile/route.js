import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../lib/auth/session";
import { getUserProfileDashboard } from "../../lib/supabase/profile";
import { getUserByBattleNetAccountId, userPollPreferences } from "../../lib/supabase/users";

function retailStatus(wowProfile) {
  const region = wowProfile?.region || "eu";
  const retailNamespace = `profile-${region}`;
  const check = (wowProfile?.checks || []).find((item) => item.namespace === retailNamespace);
  return Boolean(check?.ok && (check.wowAccountCount > 0 || check.characterCount > 0));
}

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ ok: false, error: "login_required" }, {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const [dashboard, user] = await Promise.all([
      getUserProfileDashboard(session),
      getUserByBattleNetAccountId(session.user?.battlenetAccountId)
    ]);

    return NextResponse.json({
      ok: true,
      profile: {
        battletag: session.user?.battletag || "Battle.net user",
        battlenetAccountId: session.user?.battlenetAccountId || null,
        hasRetailProfile: retailStatus(session.wowProfile),
        hasClassicProfile: Boolean(session.wowProfile?.hasClassicProfile),
        region: session.wowProfile?.region || null
      },
      preferences: userPollPreferences(user),
      dashboard
    }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Profile dashboard failed", error.message);
    return NextResponse.json({ ok: false, error: "profile_unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
