function optionPercent(option, totalVoters) {
  if (!totalVoters) {
    return 0;
  }

  return Math.round((Number(option.voteCount || 0) / totalVoters) * 100);
}

function selectedOptionIds(poll) {
  if (Array.isArray(poll.userVoteOptionIds)) {
    return poll.userVoteOptionIds;
  }

  return poll.userVoteOptionId ? [poll.userVoteOptionId] : [];
}

function formatUpdateDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function CreatorContextUpdates({ updates = [] }) {
  if (!updates.length) {
    return null;
  }

  return <details className="poll-context-updates">
    <summary>
      <span>
        <strong>Creator update{updates.length === 1 ? "" : "s"}</strong>
        <small>{updates.length} context note{updates.length === 1 ? "" : "s"}</small>
      </span>
      <span className="poll-context-toggle">Context + vote snapshots</span>
    </summary>

    <div className="poll-context-update-list">
      {updates.map((update) => {
        const snapshot = update.snapshot || {};
        const totalVoters = Number(snapshot.totalVoters || 0);
        const snapshotOptions = Array.isArray(snapshot.options) ? snapshot.options : [];

        return <article className="poll-context-update" key={update.id}>
          <div className="poll-context-update-meta">
            <time dateTime={update.createdAt}>{formatUpdateDate(update.createdAt)}</time>
          </div>

          <p>{update.body}</p>

          <div className="poll-context-snapshot">
            <div className="poll-context-snapshot-heading">
              <span>Vote snapshot when this was added</span>
              <small>{totalVoters} voter{totalVoters === 1 ? "" : "s"}</small>
            </div>

            <div className="poll-context-snapshot-options">
              {snapshotOptions.map((option, index) => <span key={option.optionId || index}>
                <strong>{option.text}</strong>
                <small>{optionPercent(option, totalVoters)}%</small>
              </span>)}
            </div>

            {snapshot.allowMultipleAnswers && <small className="poll-context-snapshot-note">
              Multiple answers were enabled, so percentages may add up to more than 100%.
            </small>}
          </div>
        </article>;
      })}
    </div>
  </details>;
}

export function PollCard({
  poll,
  canVote,
  authReady,
  databaseReady,
  onShare,
  onVote,
  votingOptionId,
  standalone = false
}) {
  const context = poll.rationale || poll.context;
  const selectedIds = selectedOptionIds(poll);
  const hasVote = selectedIds.length > 0;
  const totalVoters = Number(poll.totalVoters ?? poll.totalVotes ?? 0);
  const sortedOptions = (poll.options || [])
    .map((option, index) => ({ option, index }))
    .sort((a, b) => {
      const voteDifference = Number(b.option.voteCount || 0) - Number(a.option.voteCount || 0);
      return voteDifference || a.index - b.index;
    })
    .map(({ option }) => option);
  const disabledReason = !authReady
    ? "Checking login…"
    : !databaseReady
      ? "Database not connected"
      : !canVote
        ? "Login with Battle.net to vote"
        : "";

  const voteHelp = poll.allowMultipleAnswers
    ? (hasVote
        ? "Your selections are saved. Choose more answers or click a selected answer to remove it."
        : "Select one or more answers.")
    : (hasVote
        ? "Your vote is saved. Click it again to remove it, or choose another option."
        : "Choose one option to vote.");

  return <article className="poll-card" id={poll.slug || poll.id}>
    <div className="card-ornament" aria-hidden="true">◆</div>
    <div className="card-top">
      <span className="category">{poll.category}</span>
      <span className="draft">
        {databaseReady
          ? `${poll.allowMultipleAnswers ? "Multiple answers · " : ""}${totalVoters} voter${totalVoters === 1 ? "" : "s"}`
          : "Voting soon"}
      </span>
    </div>
    {!standalone && <h3>
      <a className="poll-title-link" href={`/polls/${poll.slug || poll.id}`}>{poll.title}</a>
    </h3>}
    {!standalone && context && <p className="context">{context}</p>}
    <CreatorContextUpdates updates={poll.contextUpdates || []} />
    {poll.allowMultipleAnswers && <p className="multi-answer-note">Multiple answers allowed — percentages can add up to more than 100%.</p>}
    <div className="option-preview" aria-label="Poll options">
      {sortedOptions.map((option) => {
        const selected = selectedIds.includes(option.id);
        const percent = optionPercent(option, totalVoters);
        const isVoting = votingOptionId === option.id;

        return <button
          key={option.id}
          type="button"
          className={selected ? "vote-option selected" : "vote-option"}
          disabled={!canVote || isVoting || !databaseReady}
          onClick={() => onVote(poll.slug, option.id)}
          aria-pressed={selected}
        >
          <span>{isVoting ? (selected ? "Removing…" : "Saving…") : option.text}</span>
          <small>{option.voteCount} · {percent}%</small>
        </button>;
      })}
    </div>
    <div className="card-footer">
      <span>{disabledReason || voteHelp}</span>
      <div className="card-footer-actions">
        {poll.editCount > 0 && <a href={`/polls/${poll.slug}#edit-history`}>
          Edited · History ({poll.editCount})
        </a>}
        {onShare && <button onClick={() => onShare(poll)} aria-label={"Share poll: " + poll.title}>Share ↗</button>}
      </div>
    </div>
  </article>;
}
