import { encodeFilterValue, isSupabaseConfigured, supabaseRequest } from "./rest";
import { getUserByBattleNetAccountId } from "./users";

export const POLL_SORTS = ["explore", "newest", "oldest", "popular"];

export function normalizePollSort(value) {
  return POLL_SORTS.includes(value) ? value : "explore";
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
    options,
    totalVotes,
    userVoteOptionId: userVotesByPollId.get(row.id) || null
  };
}

export async function getOpenPollsForSession(session, options = {}) {
  const sort = normalizePollSort(options.sort);

  if (!isSupabaseConfigured()) {
    return {
      databaseReady: false,
      sort,
      availableSorts: POLL_SORTS,
      polls: []
    };
  }

  const rows = await supabaseRequest(
    "/polls?select=id,slug,title,description,category,status,display_order,created_at,poll_options(id,text,position),votes(option_id)&status=eq.open&order=created_at.asc"
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

  return {
    databaseReady: true,
    sort,
    availableSorts: POLL_SORTS,
    polls: sortPolls(polls, sort)
  };
}

export async function getOpenPollBySlug(slug) {
  const rows = await supabaseRequest(
    `/polls?select=id,slug,status&slug=eq.${encodeFilterValue(slug)}&status=eq.open&limit=1`
  );

  return rows?.[0] || null;
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
