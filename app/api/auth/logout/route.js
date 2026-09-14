import { NextResponse } from "next/server";
import { clearSessionCookieOptions, SESSION_COOKIE } from "../../../lib/auth/session";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, "", clearSessionCookieOptions());
  return response;
}
