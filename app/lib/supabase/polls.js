import { encodeFilterValue, isSupabaseConfigured, supabaseRequest } from "./rest";
import { getUserByBattleNetAccountId } from "./users";

export const POLL_SORTS = ["explore", "newest", "oldest", "popular"];
export const POLL_VOTE_FILTERS = ["all", "unvoted", "voted"];

export function normalizePollSort(value) {
  return POLL_SORTS.includes(value) ? value : "explore";
}

export function normalizePollVoteFilter(value) {
  return POLL_VOTE_FILTERS.includes(value) ? value : "all";
}

function sortByPosition(left, right) {
  return Number(left.position || 0) - Number(right.position || 0);
}

function sortByDisplayOrder(left, right) {
  const leftOrder = Number.isFinite(Number(left.displayOrder)) ? Number(left.displayOrder) : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(Number(right.displayOrder)) ? Number(right.displayOrder) : Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
}

function sortPolls(polls, sort) {
  const sorted = [...polls];

  if (sort === "popular") {
    return sorted.sort((left, right) => {
      if (right.totalVotes !== left.totalVotes) {
        return right.totalVotes - left.totalVotes;
      }
      return sortByDisplayOrder(left, right);
    });
  }

  if (sort === "newest") {
    return sorted.sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  }

  if (sort === "oldest") {
    return sorted.sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());
  }

  return sorted.sort(sortByDisplayOrder);
}

function hasUserVote(poll) {
  return Array.isArray(poll.userVoteOptionIds)
    ? poll.userVoteOptionIds.length > 0
    : Boolean(poll.userVoteOptionId);
}

function filterPollsByVoteState(polls, voteFilter) {
  if (voteFilter === "voted") {
    return polls.filter(hasUserVote);
  }

  if (voteFilter === "unvoted") {
    return polls.filter((poll) => !hasUserVote(poll));
  }

  return polls;
}

function buildPoll(row, userVotesByPollId = new Map(), editCountsByPollId = new Map()) {
  const votes = Array.isArray(row.votes) ? row.votes : [];
  const options = (Array.isArray(row.poll_options) ? row.poll_options : [])
    .sort(sortByPosition)
    .map((option) => {
      const voteCount = votes.filter((vote) => vote.option_id === option.id).length;
      return {
        id: option.id,
        text: option.text,
        position: option.position,
        isNeutral: Boolean(option.is_neutral),
        voteCount
      };
    });
  const voterIds = new Set(votes.map((vote) => vote.user_id).filter(Boolean));
  const totalSelections = options.reduce((total, option) => total + option.voteCount, 0);
  const totalVoters = voterIds.size || totalSelections;
  const userVoteOptionIds = userVotesByPollId.get(row.id) || [];

  return {
    id: row.slug,
    slug: row.slug,
    databaseId: row.id,
    displayOrder: row.display_order,
    category: row.category,
    title: row.title,
    rationale: row.description,
    context: row.description,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    allowCustomAnswers: Boolean(row.allow_custom_answers),
    allowMultipleAnswers: Boolean(row.allow_multiple_answers),
    options,
    totalVotes: totalVoters,
    totalVoters,
    totalSelections,
    editCount: editCountsByPollId.get(row.id) || 0,
    userVoteOptionIds,
    userVoteOptionId: userVoteOptionIds[0] || null
  };
}

async function getOpenPollEditCounts() {
  const counts = new Map();
  const rows = await supabaseRequest("/rpc/open_poll_edit_counts", {
    method: "POST",
    body: JSON.stringify({})
  });

  for (const row of rows || []) {
    counts.set(row.poll_id, Number(row.edit_count || 0));
  }

  return counts;
}

export async function getOpenPollsForSession(session, options = {}) {
  const sort = normalizePollSort(options.sort);
  const voteFilter = normalizePollVoteFilter(options.voteFilter);

  if (!isSupabaseConfigured()) {
    return {
      databaseReady: false,
      sort,
      voteFilter,
      availableSorts: POLL_SORTS,
      availableVoteFilters: POLL_VOTE_FILTERS,
      polls: []
    };
  }

  const rows = await supabaseRequest(
    "/polls?select=id,slug,title,description,category,status,display_order,created_at,published_at,updated_at,allow_custom_answers,allow_multiple_answers,poll_options(id,text,position,is_neutral),votes(user_id,option_id)&status=eq.open&order=created_at.asc"
  );

  const pollIds = rows.map((row) => row.id).filter(Boolean);
  const editCountsByPollId = await getOpenPollEditCounts();
  const userVotesByPollId = new Map();
  const battlenetAccountId = session?.user?.battlenetAccountId;

  if (battlenetAccountId && pollIds.length > 0) {
    const user = await getUserByBattleNetAccountId(battlenetAccountId);

    if (user?.id) {
      const idList = pollIds.join(",");
      const votes = await supabaseRequest(
        `/votes?select=poll_id,option_id&user_id=eq.${encodeFilterValue(user.id)}&poll_id=in.(${idList})`
      );
      votes.forEach((vote) => {
        const current = userVotesByPollId.get(vote.poll_id) || [];
        current.push(vote.option_id);
        userVotesByPollId.set(vote.poll_id, current);
      });
    }
  }

  const polls = rows.map((row) => buildPoll(row, userVotesByPollId, editCountsByPollId));
  const sortedPolls = sortPolls(polls, sort);

  return {
    databaseReady: true,
    sort,
    voteFilter,
    availableSorts: POLL_SORTS,
    availableVoteFilters: POLL_VOTE_FILTERS,
    polls: filterPollsByVoteState(sortedPolls, voteFilter)
  };
}

export async function getOpenPollForSession(session, slug) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const rows = await supabaseRequest(
    `/polls?select=id,slug,title,description,category,status,display_order,created_at,published_at,updated_at,allow_custom_answers,allow_multiple_answers,poll_options(id,text,position,is_neutral),votes(user_id,option_id)&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );
  const row = rows?.[0];

  if (!row) {
    return null;
  }

  const userVotesByPollId = new Map();
  const battlenetAccountId = session?.user?.battlenetAccountId;

  if (battlenetAccountId) {
    const user = await getUserByBattleNetAccountId(battlenetAccountId);

    if (user?.id) {
      const votes = await supabaseRequest(
        `/votes?select=option_id&user_id=eq.${encodeFilterValue(user.id)}&poll_id=eq.${encodeFilterValue(row.id)}`
      );
      userVotesByPollId.set(row.id, (votes || []).map((vote) => vote.option_id));
    }
  }

  return buildPoll(row, userVotesByPollId, new Map());
}

export async function getOpenPollBySlug(slug) {
  const rows = await supabaseRequest(
    `/polls?select=id,slug,status&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );

  return rows?.[0] || null;
}



export async function getOpenPollSeoData() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const rows = await supabaseRequest(
    "/polls?select=slug,title,description,category,created_at,published_at,updated_at&status=eq.open&order=updated_at.desc"
  );

  return (rows || []).map((row) => ({
    slug: row.slug,
    title: row.title,
    rationale: row.description,
    category: row.category,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at
  }));
}

export async function getPollShareData(slug) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const rows = await supabaseRequest(
    `/polls?select=id,slug,title,description,category,status,created_at,published_at,updated_at,allow_multiple_answers,poll_options(id,text,position,is_neutral),votes(user_id,option_id)&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );

  const row = rows?.[0];
  if (!row) {
    return null;
  }

  const votes = Array.isArray(row.votes) ? row.votes : [];
  const totalVoters = new Set(votes.map((vote) => vote.user_id).filter(Boolean)).size;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    rationale: row.description,
    category: row.category,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    allowMultipleAnswers: Boolean(row.allow_multiple_answers),
    totalVoters,
    totalVotes: totalVoters,
    totalSelections: votes.length,
    userVoteOptionIds: [],
    userVoteOptionId: null,
    options: (row.poll_options || [])
      .sort(sortByPosition)
      .map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
        isNeutral: Boolean(option.is_neutral),
        voteCount: votes.filter((vote) => vote.option_id === option.id).length
      }))
  };
}

function buildHistoryEntry(row, includeEditor = false) {
  const entry = {
    id: row.id,
    editedAt: row.edited_at,
    changedFields: row.changed_fields || [],
    oldTitle: row.old_title,
    newTitle: row.new_title,
    oldRationale: row.old_description || "",
    newRationale: row.new_description || "",
    pollStatus: row.poll_status,
    oldAllowMultipleAnswers: typeof row.old_allow_multiple_answers === "boolean" ? row.old_allow_multiple_answers : null,
    newAllowMultipleAnswers: typeof row.new_allow_multiple_answers === "boolean" ? row.new_allow_multiple_answers : null
  };

  if (includeEditor) {
    entry.editorBattleTag = row.editor_battletag || "Admin";
    entry.editorBattleNetAccountId = row.editor_battlenet_account_id || null;
  }

  return entry;
}

export async function getPublicPollEditHistory(slug) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const poll = await getOpenPollBySlug(slug);
  if (!poll?.id) {
    return [];
  }

  const rows = await supabaseRequest(
    `/poll_edit_history?select=id,edited_at,changed_fields,old_title,new_title,old_description,new_description,old_allow_multiple_answers,new_allow_multiple_answers,poll_status&poll_id=eq.${encodeFilterValue(poll.id)}&order=edited_at.desc`
  );

  return (rows || []).map((row) => buildHistoryEntry(row, false));
}

export async function getAdminPollEditHistory(pollId) {
  const rows = await supabaseRequest(
    `/poll_edit_history?select=id,edited_at,changed_fields,old_title,new_title,old_description,new_description,old_allow_multiple_answers,new_allow_multiple_answers,poll_status,editor_battlenet_account_id,editor_battletag&poll_id=eq.${encodeFilterValue(pollId)}&order=edited_at.desc`
  );

  return (rows || []).map((row) => buildHistoryEntry(row, true));
}

export async function editPollAdmin({
  pollId,
  title,
  rationale,
  allowMultipleAnswers,
  editorBattleNetAccountId,
  editorBattleTag
}) {
  const rows = await supabaseRequest("/rpc/admin_edit_poll", {
    method: "POST",
    body: JSON.stringify({
      p_poll_id: pollId,
      p_title: title,
      p_description: rationale,
      p_allow_multiple_answers: Boolean(allowMultipleAnswers),
      p_editor_battlenet_account_id: editorBattleNetAccountId || null,
      p_editor_battletag: editorBattleTag || "Admin"
    })
  });

  return rows?.[0] || null;
}

export async function castVote({ pollSlug, optionId, userId }) {
  const poll = await getOpenPollBySlug(pollSlug);

  if (!poll?.id) {
    const error = new Error("Poll not found or not open");
    error.status = 404;
    throw error;
  }

  const rows = await supabaseRequest("/rpc/cast_poll_vote", {
    method: "POST",
    body: JSON.stringify({
      p_poll_id: poll.id,
      p_user_id: userId,
      p_option_id: optionId
    })
  });

  return rows?.[0] || null;
}

export async function retractVote({ pollSlug, optionId, userId }) {
  const poll = await getOpenPollBySlug(pollSlug);

  if (!poll?.id) {
    const error = new Error("Poll not found or not open");
    error.status = 404;
    throw error;
  }

  const removed = await supabaseRequest("/rpc/retract_poll_vote", {
    method: "POST",
    body: JSON.stringify({
      p_poll_id: poll.id,
      p_user_id: userId,
      p_option_id: optionId
    })
  });

  return Boolean(removed);
}

export async function submitPollDraft({ creatorId, slug, title, description, category, options, allowMultipleAnswers = false }) {
  const now = Date.now();
  const tenMinutesAgo = new Date(now - (10 * 60 * 1000)).toISOString();
  const dayAgo = new Date(now - (24 * 60 * 60 * 1000)).toISOString();

  const [recentPolls, dailyPolls] = await Promise.all([
    supabaseRequest(
      `/polls?select=id&creator_id=eq.${encodeFilterValue(creatorId)}&created_at=gt.${encodeFilterValue(tenMinutesAgo)}`
    ),
    supabaseRequest(
      `/polls?select=id&creator_id=eq.${encodeFilterValue(creatorId)}&created_at=gt.${encodeFilterValue(dayAgo)}`
    )
  ]);

  if ((recentPolls || []).length >= 3 || (dailyPolls || []).length >= 10) {
    const error = new Error("Too many poll submissions recently");
    error.code = "RATE_LIMITED";
    throw error;
  }

  const rows = await supabaseRequest("/polls?select=id,slug,status,created_at", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      creator_id: creatorId,
      slug,
      title,
      description,
      category,
      status: "draft",
      allow_custom_answers: false,
      allow_multiple_answers: Boolean(allowMultipleAnswers)
    })
  });

  const poll = rows?.[0];

  if (!poll?.id) {
    throw new Error("Supabase did not return a poll id");
  }

  const optionRows = options.map((option, index) => ({
    poll_id: poll.id,
    text: option,
    position: index + 1,
    is_neutral: ["don't care", "no preference", "undecided", "no strong opinion"]
      .includes(String(option).trim().toLowerCase())
  }));

  try {
    await supabaseRequest("/poll_options", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify(optionRows)
    });
  } catch (error) {
    await supabaseRequest(
      `/polls?id=eq.${encodeFilterValue(poll.id)}&status=eq.draft`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      }
    ).catch(() => null);

    throw error;
  }

  return {
    poll_id: poll.id,
    poll_slug: poll.slug,
    poll_status: poll.status || "draft",
    submitted_at: poll.created_at
  };
}

function buildAdminPoll(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    rationale: row.description,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    creatorBattleTag: row.creator_battletag || "Unknown BattleTag",
    trashReason: row.trash_reason || null,
    trashedAt: row.trashed_at || null,
    trashExpiresAt: row.trash_expires_at || null,
    allowMultipleAnswers: Boolean(row.allow_multiple_answers),
    totalVotes: Number(row.total_votes || 0),
    options: (row.options || [])
      .sort(sortByPosition)
      .map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
        isNeutral: Boolean(option.is_neutral)
      }))
  };
}

export async function purgeExpiredPollTrash() {
  const now = new Date().toISOString();

  await supabaseRequest(
    `/polls?status=eq.hidden&trash_expires_at=lt.${encodeFilterValue(now)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    }
  );
}

export async function getAdminPollQueues() {
  await purgeExpiredPollTrash();

  const rows = await supabaseRequest("/rpc/admin_poll_catalog", {
    method: "POST",
    body: JSON.stringify({})
  });

  const polls = (rows || []).map(buildAdminPoll);
  const activeTrash = (poll) => poll.trashExpiresAt && new Date(poll.trashExpiresAt).getTime() > Date.now();

  return {
    submissions: polls.filter((poll) => poll.status === "draft"),
    live: polls.filter((poll) => poll.status === "open"),
    rejected: polls.filter((poll) => poll.status === "hidden" && poll.trashReason === "rejected" && activeTrash(poll)),
    unpublished: polls.filter((poll) => poll.status === "hidden" && poll.trashReason === "unpublished" && activeTrash(poll))
  };
}

export async function getPendingPollSubmissions() {
  return (await getAdminPollQueues()).submissions;
}

export async function updatePollAdminState({ pollId, action }) {
  const rows = await supabaseRequest(
    `/polls?select=id,slug,status,trash_reason,trash_expires_at&id=eq.${encodeFilterValue(pollId)}&limit=1`
  );
  const poll = rows?.[0];

  if (!poll) {
    const error = new Error("Poll not found");
    error.status = 404;
    throw error;
  }

  const now = new Date();
  let expectedStatus;
  let patch;

  if (action === "publish" && poll.status === "draft") {
    expectedStatus = "draft";
    patch = {
      status: "open",
      trash_reason: null,
      trashed_at: null,
      trash_expires_at: null
    };
  } else if (action === "reject" && poll.status === "draft") {
    expectedStatus = "draft";
    patch = {
      status: "hidden",
      trash_reason: "rejected",
      trashed_at: now.toISOString(),
      trash_expires_at: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString()
    };
  } else if (action === "unpublish" && poll.status === "open") {
    expectedStatus = "open";
    patch = {
      status: "hidden",
      trash_reason: "unpublished",
      trashed_at: now.toISOString(),
      trash_expires_at: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    };
  } else if (action === "restore" && poll.status === "hidden" && ["rejected", "unpublished"].includes(poll.trash_reason)) {
    if (!poll.trash_expires_at || new Date(poll.trash_expires_at).getTime() <= now.getTime()) {
      await purgeExpiredPollTrash();
      const error = new Error("Recycle-bin retention period has expired");
      error.status = 410;
      throw error;
    }

    expectedStatus = "hidden";
    patch = {
      status: poll.trash_reason === "rejected" ? "draft" : "open",
      trash_reason: null,
      trashed_at: null,
      trash_expires_at: null
    };
  } else {
    const error = new Error("Invalid admin action for current poll state");
    error.status = 400;
    throw error;
  }

  const updated = await supabaseRequest(
    `/polls?id=eq.${encodeFilterValue(pollId)}&status=eq.${expectedStatus}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch)
    }
  );

  if (!updated?.[0]) {
    const error = new Error("Poll state changed before the action completed");
    error.status = 409;
    throw error;
  }

  return {
    id: updated[0].id,
    slug: updated[0].slug,
    status: updated[0].status,
    trashReason: updated[0].trash_reason || null,
    trashExpiresAt: updated[0].trash_expires_at || null
  };
}
