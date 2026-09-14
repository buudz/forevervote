function optionPercent(option, totalVotes) {
  if (!totalVotes) {
    return 0;
  }

  return Math.round((option.voteCount / totalVotes) * 100);
}

export function PollCard({ poll, canVote, authReady, databaseReady, onShare, onVote, votingOptionId }) {
  const disabledReason = !authReady
    ? "Checking login…"
    : !databaseReady
      ? "Database not connected"
      : !canVote
        ? "Login with Battle.net to vote"
        : "";

  return <article className="poll-card" id={poll.slug || poll.id}>
    <div className="card-ornament" aria-hidden="true">◆</div>
    <div className="card-top">
      <span className="category">{poll.category}</span>
      <span className="draft">{databaseReady ? `${poll.totalVotes || 0} votes` : "Voting soon"}</span>
    </div>
    <h3>{poll.title}</h3>
    <p className="context">{poll.rationale || poll.context}</p>
    <div className="option-preview" aria-label="Poll options">
      {poll.options.map((option) => {
        const selected = poll.userVoteOptionId === option.id;
        const percent = optionPercent(option, poll.totalVotes);
        const isVoting = votingOptionId === option.id;

        return <button
          key={option.id}
          type="button"
          className={selected ? "vote-option selected" : "vote-option"}
          disabled={!canVote || isVoting || !databaseReady}
          onClick={() => onVote(poll.slug, option.id)}
          aria-pressed={selected}
        >
          <span>{isVoting ? "Saving…" : option.text}</span>
          <small>{option.voteCount} · {percent}%</small>
        </button>;
      })}
    </div>
    <div className="card-footer">
      <span>{poll.userVoteOptionId ? "Your vote is saved. Click another option to change it." : disabledReason || "Choose one option to vote."}</span>
      <button onClick={() => onShare(poll)} aria-label={"Share poll: " + poll.title}>Share ↗</button>
    </div>
  </article>;
}
