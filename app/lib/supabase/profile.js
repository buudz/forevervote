import { encodeFilterValue, supabaseRequest } from "./rest";
import { ensureUserFromSession, getUserByBattleNetAccountId } from "./users";

function sortByPosition(left, right) {
  return Number(left.position || 0) - Number(right.position || 0);
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
      voted: []
    };
  }

  const ownRows = await supabaseRequest(
    `/polls?select=id,slug,title,description,category,status,created_at,published_at,updated_at,trash_reason,allow_multiple_answers,poll_options(id,text,position,is_neutral),votes(user_id)&creator_id=eq.${encodeFilterValue(user.id)}&order=created_at.desc`
  );

  const ownPolls = (ownRows || []).map((row) => buildProfilePoll(row));
  const submitted = ownPolls.filter((poll) => poll.status !== "open");
  const approved = ownPolls.filter((poll) => poll.status === "open");

  const voteRows = await supabaseRequest(
    `/votes?select=poll_id,option_id&user_id=eq.${encodeFilterValue(user.id)}`
  );
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
      `/polls?select=id,slug,title,description,category,status,created_at,published_at,updated_at,trash_reason,allow_multiple_answers,poll_options(id,text,position,is_neutral),votes(user_id)&id=in.(${votedPollIds.join(",")})&order=updated_at.desc`
    );

    voted = (pollRows || []).map((row) => buildProfilePoll(row, selectedByPoll.get(row.id) || []));
  }

  return { submitted, approved, voted };
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
