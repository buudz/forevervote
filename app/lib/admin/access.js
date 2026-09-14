import { timingSafeEqual } from "crypto";

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

export function authorizeAdminRequest(request, session) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : null;

  if (configuredToken && bearerToken && safeEqual(bearerToken, configuredToken)) {
    return { ok: true, method: "bearer" };
  }

  const accountId = session?.user?.battlenetAccountId;
  const allowedAccountIds = getAllowedBattleNetAccountIds();

  if (accountId && allowedAccountIds.includes(accountId)) {
    return { ok: true, method: "session" };
  }

  return {
    ok: false,
    configured: Boolean(configuredToken || allowedAccountIds.length),
    reason: configuredToken || allowedAccountIds.length ? "forbidden" : "admin_not_configured"
  };
}
