import { isSupabaseConfigured, supabaseRequest } from "./rest";

function groupVoteDuplicates(votes) {
  const groups = new Map();

  votes.forEach((vote) => {
    const key = `${vote.poll_id}:${vote.user_id}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });

  return [...groups.values()].filter((count) => count > 1).length;
}

function buildOptionCounts(poll, votes) {
  const votesByOptionId = new Map();
  votes
    .filter((vote) => vote.poll_id === poll.id)
    .forEach((vote) => votesByOptionId.set(vote.option_id, (votesByOptionId.get(vote.option_id) || 0) + 1));

  return (poll.poll_options || [])
    .sort((left, right) => Number(left.position || 0) - Number(right.position || 0))
    .map((option) => ({
      text: option.text,
      position: option.position,
      voteCount: votesByOptionId.get(option.id) || 0
    }));
}

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      databaseReady: false,
      error: "supabase_not_configured"
    };
  }

  const [users, polls, votes] = await Promise.all([
    supabaseRequest("/users?select=id,wow_verified,created_at"),
    supabaseRequest("/polls?select=id,slug,title,status,category,display_order,created_at,published_at,poll_options(id,text,position)&order=created_at.asc"),
    supabaseRequest("/votes?select=id,poll_id,user_id,option_id,created_at,updated_at")
  ]);

  const pollsWithCounts = polls
    .map((poll) => {
      const optionCounts = buildOptionCounts(poll, votes);
      const totalVotes = optionCounts.reduce((sum, option) => sum + option.voteCount, 0);

      return {
        slug: poll.slug,
        title: poll.title,
        status: poll.status,
        category: poll.category,
        displayOrder: poll.display_order,
        createdAt: poll.created_at,
        publishedAt: poll.published_at,
        totalVotes,
        options: optionCounts
      };
    })
    .sort((left, right) => {
      const leftOrder = Number.isFinite(Number(left.displayOrder)) ? Number(left.displayOrder) : Number.MAX_SAFE_INTEGER;
      const rightOrder = Number.isFinite(Number(right.displayOrder)) ? Number(right.displayOrder) : Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
    });

  return {
    ok: true,
    databaseReady: true,
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      verifiedUsers: users.filter((user) => user.wow_verified).length,
      polls: polls.length,
      openPolls: polls.filter((poll) => poll.status === "open").length,
      votes: votes.length,
      votingUsers: new Set(votes.map((vote) => vote.user_id)).size,
      duplicateVoteGroups: groupVoteDuplicates(votes)
    },
    polls: pollsWithCounts
  };
}
