import { encodeFilterValue, supabaseRequest } from "./rest";

function isClassicVerified(session) {
  return Boolean(session?.wowProfile?.hasClassicProfile);
}

export async function getUserByBattleNetAccountId(battlenetAccountId) {
  if (!battlenetAccountId) {
    return null;
  }

  const rows = await supabaseRequest(
    `/users?select=id,battlenet_account_id,battletag,wow_verified,wow_verified_at,poll_sort_preference,poll_vote_filter_preference&battlenet_account_id=eq.${encodeFilterValue(battlenetAccountId)}&limit=1`
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


export function userPollPreferences(user) {
  return {
    sort: user?.poll_sort_preference || "explore",
    voteFilter: user?.poll_vote_filter_preference || "unvoted"
  };
}

export async function updateUserPollPreferences(userId, { sort, voteFilter }) {
  const allowedSorts = ["explore", "popular", "newest", "oldest"];
  const allowedVoteFilters = ["all", "unvoted", "voted"];
  const patch = {};

  if (sort !== undefined) {
    if (!allowedSorts.includes(sort)) {
      const error = new Error("Invalid poll sort preference");
      error.status = 400;
      throw error;
    }
    patch.poll_sort_preference = sort;
  }

  if (voteFilter !== undefined) {
    if (!allowedVoteFilters.includes(voteFilter)) {
      const error = new Error("Invalid poll vote filter preference");
      error.status = 400;
      throw error;
    }
    patch.poll_vote_filter_preference = voteFilter;
  }

  if (!Object.keys(patch).length) {
    return getUserByBattleNetAccountId(null);
  }

  const rows = await supabaseRequest(
    `/users?id=eq.${encodeFilterValue(userId)}&select=id,poll_sort_preference,poll_vote_filter_preference`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch)
    }
  );

  return rows?.[0] || null;
}
