import { encodeFilterValue, supabaseRequest } from "./rest";
import { ensureUserFromSession, getUserByBattleNetAccountId } from "./users";

function sortByPosition(left, right) {
  return Number(left.position || 0) - Number(right.position || 0);
}

function buildContextUpdates(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: row.id,
      body: row.body || "",
      createdAt: row.created_at,
      snapshot: row.vote_snapshot && typeof row.vote_snapshot === "object" ? row.vote_snapshot : {}
    }))
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

function buildReputationProgress(row = {}) {
  const totalPoints = Number(row.total_points || 0);
  const tiers = [
    { rank: "Neutral", floor: 0, ceiling: 3000 },
    { rank: "Friendly", floor: 3000, ceiling: 9000 },
    { rank: "Honored", floor: 9000, ceiling: 21000 },
    { rank: "Revered", floor: 21000, ceiling: 42000 },
    { rank: "Exalted", floor: 42000, ceiling: 42999 }
  ];

  const tier = [...tiers].reverse().find((item) => totalPoints >= item.floor) || tiers[0];
  const rankMax = tier.rank === "Exalted" ? 999 : tier.ceiling - tier.floor;
  const rankPoints = Math.min(Math.max(totalPoints - tier.floor, 0), rankMax);
  const progressPercent = rankMax > 0 ? Math.min(100, Math.round((rankPoints / rankMax) * 1000) / 10) : 100;
  const tierIndex = tiers.findIndex((item) => item.rank === tier.rank);

  return {
    rank: tier.rank,
    totalPoints,
    rankPoints,
    rankMax,
    progressPercent,
    nextRank: tier.rank === "Exalted" ? null : tiers[tierIndex + 1]?.rank || null,
    votePoints: Number(row.vote_points || 0),
    creatorPoints: Number(row.creator_points || 0),
    pollsVoted: Number(row.polls_voted || 0),
    uniqueVotersReceived: Number(row.unique_voters_received || 0)
  };
}

function buildProfilePoll(row, selectedOptionIds = []) {
  const votes = Array.isArray(row.votes) ? row.votes : [];
  const voterCount = new Set(votes.map((vote) => vote.user_id).filter(Boolean)).size;
  const options = (row.poll_options || []).sort(sortByPosition).map((option) => ({
    id: option.id,
    text: option.text,
    position: option.position,
    isNeutral: Boolean(option.is_neutral)
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    rationale: row.description || "",
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    trashReason: row.trash_reason || null,
    allowMultipleAnswers: Boolean(row.allow_multiple_answers),
    totalVoters: voterCount,
    totalSelections: votes.length,
    canEdit: ["draft", "open"].includes(row.status) && votes.length === 0,
    contextUpdates: buildContextUpdates(row.poll_context_updates),
    options,
    selectedOptionIds,
    selectedOptionTexts: options
      .filter((option) => selectedOptionIds.includes(option.id))
      .map((option) => option.text)
  };
}

export async function getUserProfileDashboard(session) {
  const battlenetAccountId = session?.user?.battlenetAccountId;
  if (!battlenetAccountId) {
    return null;
  }

  const user = await getUserByBattleNetAccountId(battlenetAccountId);
  if (!user?.id) {
    return {
      submitted: [],
      approved: [],
      voted: [],
      reputation: buildReputationProgress()
    };
  }

  const [ownRows, voteRows, reputationRows] = await Promise.all([
    supabaseRequest(
      `/polls?select=id,slug,title,description,category,status,created_at,published_at,updated_at,trash_reason,allow_multiple_answers,poll_options(id,text,position,is_neutral),poll_context_updates(id,body,created_at,vote_snapshot),votes(user_id)&creator_id=eq.${encodeFilterValue(user.id)}&order=created_at.desc`
    ),
    supabaseRequest(
      `/votes?select=poll_id,option_id&user_id=eq.${encodeFilterValue(user.id)}`
    ),
    supabaseRequest("/rpc/user_reputation_summary", {
      method: "POST",
      body: JSON.stringify({ p_user_id: user.id })
    })
  ]);

  const ownPolls = (ownRows || []).map((row) => buildProfilePoll(row));
  const submitted = ownPolls.filter((poll) => poll.status !== "open");
  const approved = ownPolls.filter((poll) => poll.status === "open");
  const reputation = buildReputationProgress(reputationRows?.[0] || {});

  const selectedByPoll = new Map();

  for (const vote of voteRows || []) {
    const list = selectedByPoll.get(vote.poll_id) || [];
    list.push(vote.option_id);
    selectedByPoll.set(vote.poll_id, list);
  }

  const votedPollIds = [...selectedByPoll.keys()];
  let voted = [];

  if (votedPollIds.length) {
    const pollRows = await supabaseRequest(
      `/polls?select=id,slug,title,description,category,status,created_at,published_at,updated_at,trash_reason,allow_multiple_answers,poll_options(id,text,position,is_neutral),poll_context_updates(id,body,created_at,vote_snapshot),votes(user_id)&id=in.(${votedPollIds.join(",")})&order=updated_at.desc`
    );

    voted = (pollRows || []).map((row) => buildProfilePoll(row, selectedByPoll.get(row.id) || []));
  }

  return { submitted, approved, voted, reputation };
}

export async function editOwnPoll({
  session,
  pollId,
  title,
  description,
  category,
  options,
  allowMultipleAnswers
}) {
  const user = await ensureUserFromSession(session);

  const rows = await supabaseRequest("/rpc/creator_edit_poll", {
    method: "POST",
    body: JSON.stringify({
      p_poll_id: pollId,
      p_user_id: user.id,
      p_title: title,
      p_description: description,
      p_category: category,
      p_options: options,
      p_allow_multiple_answers: Boolean(allowMultipleAnswers),
      p_editor_battlenet_account_id: session.user?.battlenetAccountId || null,
      p_editor_battletag: session.user?.battletag || "Poll creator"
    })
  });

  return rows?.[0] || null;
}


export async function addOwnPollContextUpdate({ session, pollId, body }) {
  const user = await ensureUserFromSession(session);

  const rows = await supabaseRequest("/rpc/add_poll_context_update", {
    method: "POST",
    body: JSON.stringify({
      p_poll_id: pollId,
      p_user_id: user.id,
      p_body: body
    })
  });

  const row = rows?.[0];
  if (!row) {
    return null;
  }

  return {
    id: row.update_id,
    body: row.update_body,
    createdAt: row.update_created_at,
    snapshot: row.update_vote_snapshot || {}
  };
}
