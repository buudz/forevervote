import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getPendingPollSubmissions, moderatePollSubmission } from "../../../lib/supabase/polls";

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function getAdmin(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  return authorizeAdminRequest(request, session);
}

export async function GET(request) {
  const admin = getAdmin(request);

  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  try {
    const submissions = await getPendingPollSubmissions();
    return json({ ok: true, submissions });
  } catch (error) {
    console.error("Failed to load poll submissions", error.message);
    return json({ ok: false, error: "submissions_unavailable" }, 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const admin = getAdmin(request);
  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  const body = await request.json().catch(() => null);
  const pollId = typeof body?.pollId === "string" ? body.pollId : "";
  const action = body?.action;

  if (!pollId || !["publish", "reject"].includes(action)) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  try {
    const poll = await moderatePollSubmission({ pollId, action });
    return json({ ok: true, poll });
  } catch (error) {
    console.error("Poll moderation failed", error.message);
    return json({
      ok: false,
      error: error.status === 404 ? "submission_not_found" : "moderation_failed"
    }, error.status || 500);
  }
}
