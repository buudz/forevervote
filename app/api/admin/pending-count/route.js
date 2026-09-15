import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getPendingPollSubmissionCount } from "../../../lib/supabase/polls";

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const admin = await authorizeAdminRequest(request, session);

  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  try {
    const pendingCount = await getPendingPollSubmissionCount();
    return json({
      ok: true,
      pendingCount,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to load pending admin notifications", error.message);
    return json({ ok: false, error: "admin_notifications_unavailable" }, 503);
  }
}
