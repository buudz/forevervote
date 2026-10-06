import { NextResponse } from "next/server";
import { clearSessionCookieOptions, SESSION_COOKIE } from "../../../lib/auth/session";
import { isTrustedMutationRequest } from "../../../lib/http/request";

export async function POST(request) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, {
      status: 403,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", clearSessionCookieOptions());
  return response;
}
