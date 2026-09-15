import { NextResponse } from "next/server";
import { isAdminSession } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false, admin: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: await isAdminSession(session),
    user: session.user,
    wowProfile: session.wowProfile
  }, { status: 200 });
}
