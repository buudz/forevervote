import { timingSafeEqual } from "crypto";
import { encodeFilterValue, isSupabaseConfigured, supabaseRequest } from "../supabase/rest";

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getAllowedBattleNetAccountIds() {
  return (process.env.ADMIN_BATTLENET_ACCOUNT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function isDatabaseAdmin(accountId) {
  if (!accountId || !isSupabaseConfigured()) {
    return false;
  }

  try {
    const rows = await supabaseRequest(
      `/admin_accounts?select=battlenet_account_id&battlenet_account_id=eq.${encodeFilterValue(accountId)}&limit=1`
    );
    return Boolean(rows?.[0]?.battlenet_account_id);
  } catch {
    return false;
  }
}

export async function isAdminSession(session) {
  const accountId = session?.user?.battlenetAccountId;

  if (!accountId) {
    return false;
  }

  if (getAllowedBattleNetAccountIds().includes(accountId)) {
    return true;
  }

  return isDatabaseAdmin(accountId);
}

export async function authorizeAdminRequest(request, session) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : null;

  if (configuredToken && bearerToken && safeEqual(bearerToken, configuredToken)) {
    return { ok: true, method: "bearer" };
  }

  if (await isAdminSession(session)) {
    return { ok: true, method: "session" };
  }

  return {
    ok: false,
    configured: Boolean(configuredToken || getAllowedBattleNetAccountIds().length || isSupabaseConfigured()),
    reason: "forbidden"
  };
}
