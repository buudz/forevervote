import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getOpenPollForSession } from "../../../lib/supabase/polls";

export async function GET(request, context) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ ok: false, error: "poll_not_found" }, {
      status: 404,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const poll = await getOpenPollForSession(session, slug);

    if (!poll) {
      return NextResponse.json({ ok: false, error: "poll_not_found" }, {
        status: 404,
        headers: { "Cache-Control": "no-store" }
      });
    }

    return NextResponse.json({ ok: true, poll }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Failed to load poll", error.message);
    return NextResponse.json({ ok: false, error: "poll_unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
