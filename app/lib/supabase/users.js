import { encodeFilterValue, supabaseRequest } from "./rest";

function isClassicVerified(session) {
  return Boolean(session?.wowProfile?.hasClassicProfile);
}

export async function getUserByBattleNetAccountId(battlenetAccountId) {
  if (!battlenetAccountId) {
    return null;
  }

  const rows = await supabaseRequest(
    `/users?select=id,battlenet_account_id,battletag,wow_verified,wow_verified_at&battlenet_account_id=eq.${encodeFilterValue(battlenetAccountId)}&limit=1`
  );

  return rows?.[0] || null;
}

export async function ensureUserFromSession(session) {
  const battlenetAccountId = session?.user?.battlenetAccountId;
  const battletag = session?.user?.battletag || "Unknown BattleTag";
  const wowVerified = isClassicVerified(session);

  if (!battlenetAccountId) {
    throw new Error("No Battle.net account id in session");
  }

  const payload = {
    battlenet_account_id: battlenetAccountId,
    battletag,
    wow_verified: wowVerified,
    wow_verified_at: wowVerified ? new Date().toISOString() : null
  };

  const rows = await supabaseRequest("/users?on_conflict=battlenet_account_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });

  const user = rows?.[0];

  if (!user?.id) {
    throw new Error("Supabase did not return a user id");
  }

  return user;
}
