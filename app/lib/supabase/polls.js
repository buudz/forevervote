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

function filterPollsByVoteState(polls, voteFilter) {
  if (voteFilter === "voted") {
    return polls.filter((poll) => Boolean(poll.userVoteOptionId));
  }

  if (voteFilter === "unvoted") {
    return polls.filter((poll) => !poll.userVoteOptionId);
  }

  return polls;
}

function buildPoll(row, userVotesByPollId = new Map()) {
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
  const totalVotes = options.reduce((total, option) => total + option.voteCount, 0);

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
    allowCustomAnswers: Boolean(row.allow_custom_answers),
    options,
    totalVotes,
    userVoteOptionId: userVotesByPollId.get(row.id) || null
  };
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
    "/polls?select=id,slug,title,description,category,status,display_order,created_at,published_at,allow_custom_answers,poll_options(id,text,position,is_neutral),votes(option_id)&status=eq.open&order=created_at.asc"
  );

  const pollIds = rows.map((row) => row.id).filter(Boolean);
  const userVotesByPollId = new Map();
  const battlenetAccountId = session?.user?.battlenetAccountId;

  if (battlenetAccountId && pollIds.length > 0) {
    const user = await getUserByBattleNetAccountId(battlenetAccountId);

    if (user?.id) {
      const idList = pollIds.join(",");
      const votes = await supabaseRequest(
        `/votes?select=poll_id,option_id&user_id=eq.${encodeFilterValue(user.id)}&poll_id=in.(${idList})`
      );
      votes.forEach((vote) => userVotesByPollId.set(vote.poll_id, vote.option_id));
    }
  }

  const polls = rows.map((row) => buildPoll(row, userVotesByPollId));
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

export async function getOpenPollBySlug(slug) {
  const rows = await supabaseRequest(
    `/polls?select=id,slug,status&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );

  return rows?.[0] || null;
}

export async function getPollShareData(slug) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const rows = await supabaseRequest(
    `/polls?select=id,slug,title,description,category,status,poll_options(text,position,is_neutral)&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );

  const row = rows?.[0];
  if (!row) {
    return null;
  }

  return {
    slug: row.slug,
    title: row.title,
    rationale: row.description,
    category: row.category,
    options: (row.poll_options || [])
      .sort(sortByPosition)
      .map((option) => ({
        text: option.text,
        position: option.position,
        isNeutral: Boolean(option.is_neutral)
      }))
  };
}

export async function castVote({ pollSlug, optionId, userId }) {
  const poll = await getOpenPollBySlug(pollSlug);

  if (!poll?.id) {
    const error = new Error("Poll not found or not open");
    error.status = 404;
    throw error;
  }

  const rows = await supabaseRequest("/votes?on_conflict=poll_id,user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      poll_id: poll.id,
      user_id: userId,
      option_id: optionId
    })
  });

  return rows?.[0] || null;
}
