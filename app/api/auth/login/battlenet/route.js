import { NextResponse } from "next/server";
import { createRandomToken, OAUTH_STATE_COOKIE, stateCookieOptions } from "../../../../lib/auth/session";
import { getBattleNetAuthorizeUrl } from "../../../../lib/battlenet";

export async function GET(request) {
  try {
    const state = createRandomToken();
    const authorizeUrl = getBattleNetAuthorizeUrl({ request, state });
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions());
    return response;
  } catch (error) {
    console.error("Battle.net login setup failed", error.message);
    return NextResponse.redirect(new URL("/?auth_error=login_not_configured", request.url));
  }
}
