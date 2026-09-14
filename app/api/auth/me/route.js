import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    wowProfile: session.wowProfile
  }, { status: 200 });
}
