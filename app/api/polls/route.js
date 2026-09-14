import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../lib/auth/session";
import { getOpenPollsForSession, normalizePollSort } from "../../lib/supabase/polls";

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const sort = normalizePollSort(request.nextUrl.searchParams.get("sort"));

  try {
    const result = await getOpenPollsForSession(session, { sort });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Failed to load polls", error.message);
    return NextResponse.json({
      databaseReady: false,
      sort,
      polls: [],
      error: "polls_unavailable"
    }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
