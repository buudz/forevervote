export function PollCard({ poll, onShare }) {
  return <article className="poll-card" id={poll.id}>
    <div className="card-ornament" aria-hidden="true">◆</div>
    <div className="card-top">
      <span className="category">{poll.category}</span>
      <span className="draft">Voting soon</span>
    </div>
    <h3>{poll.title}</h3>
    <p className="context">{poll.context}</p>
    <div className="option-preview" aria-label="Poll options">
      <span>Yes</span>
      <span>No</span>
    </div>
    <div className="card-footer">
      <span>Voting opens when account verification is ready</span>
      <button onClick={() => onShare(poll.id)} aria-label={"Share poll: " + poll.title}>Share ↗</button>
    </div>
  </article>;
}
