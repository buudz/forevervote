import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getAdminStats } from "../../../lib/supabase/admin";

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function GET(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const admin = authorizeAdminRequest(request, session);

  if (!admin.ok) {
    return json({
      ok: false,
      error: admin.reason,
      hint: admin.configured
        ? "Use an admin Battle.net session or Authorization: Bearer ADMIN_TOKEN."
        : "Set ADMIN_TOKEN or ADMIN_BATTLENET_ACCOUNT_IDS in Vercel."
    }, admin.configured ? 403 : 503);
  }

  try {
    const stats = await getAdminStats();
    return json({ ...stats, adminAuth: admin.method });
  } catch (error) {
    console.error("Failed to load admin stats", error.message);
    return json({ ok: false, databaseReady: false, error: "admin_stats_unavailable" }, 503);
  }
}
