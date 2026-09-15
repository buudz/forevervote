import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getAdminPollQueues, updatePollAdminState } from "../../../lib/supabase/polls";

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

async function getAdmin(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  return authorizeAdminRequest(request, session);
}

export async function GET(request) {
  const admin = await getAdmin(request);

  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  try {
    const queues = await getAdminPollQueues();
    return json({ ok: true, ...queues });
  } catch (error) {
    console.error("Failed to load admin poll queues", error.message);
    return json({ ok: false, error: "admin_polls_unavailable" }, 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const admin = await getAdmin(request);
  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  const body = await request.json().catch(() => null);
  const pollId = typeof body?.pollId === "string" ? body.pollId : "";
  const action = body?.action;
  const allowedActions = ["publish", "reject", "unpublish", "restore"];

  if (!pollId || !allowedActions.includes(action)) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  try {
    const poll = await updatePollAdminState({ pollId, action });
    return json({ ok: true, poll });
  } catch (error) {
    console.error("Poll admin action failed", error.message);
    return json({
      ok: false,
      error: error.status === 404
        ? "poll_not_found"
        : error.status === 410
          ? "trash_expired"
          : error.status === 409
            ? "poll_state_conflict"
            : "admin_action_failed"
    }, error.status || 500);
  }
}
