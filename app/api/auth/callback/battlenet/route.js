import { NextResponse } from "next/server";
import {
  clearStateCookieOptions,
  createSignedSession,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions
} from "../../../../lib/auth/session";
import {
  exchangeBattleNetCode,
  fetchBattleNetUserInfo,
  fetchWowProfileChecks
} from "../../../../lib/battlenet";

function redirectWithError(request, code) {
  return NextResponse.redirect(new URL(`/?auth_error=${code}`, request.url));
}

export async function GET(request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (error) {
    const response = redirectWithError(request, "battlenet_denied");
    response.cookies.set(OAUTH_STATE_COOKIE, "", clearStateCookieOptions());
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = redirectWithError(request, "invalid_oauth_state");
    response.cookies.set(OAUTH_STATE_COOKIE, "", clearStateCookieOptions());
    return response;
  }

  try {
    const token = await exchangeBattleNetCode({ request, code });
    const userInfo = await fetchBattleNetUserInfo(token.access_token);
    const wowProfile = await fetchWowProfileChecks(token.access_token);

    if (!userInfo.id) {
      throw new Error("Battle.net userinfo did not include an account id");
    }

    const session = createSignedSession({
      user: {
        battlenetAccountId: userInfo.id,
        battletag: userInfo.battletag
      },
      wowProfile
    });

    const response = NextResponse.redirect(new URL("/?login=success", request.url));
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    response.cookies.set(OAUTH_STATE_COOKIE, "", clearStateCookieOptions());
    return response;
  } catch (error) {
    console.error("Battle.net callback failed", error.message);
    const response = redirectWithError(request, "battlenet_callback_failed");
    response.cookies.set(OAUTH_STATE_COOKIE, "", clearStateCookieOptions());
    return response;
  }
}
