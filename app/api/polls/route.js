import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../lib/auth/session";
import { getOpenPollsForSession } from "../../lib/supabase/polls";

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  try {
    const result = await getOpenPollsForSession(session);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to load polls", error.message);
    return NextResponse.json({
      databaseReady: false,
      polls: [],
      error: "polls_unavailable"
    }, { status: 503 });
  }
}
