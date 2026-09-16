const statusItems = [
  { number: "01", title: "Login with Battle.net", detail: "Use your Battle.net identity before voting" },
  { number: "02", title: "Account-backed voting", detail: "One verified account; some polls allow multiple answers" },
  { number: "03", title: "Change your mind", detail: "Add, remove, or switch selections whenever the poll allows it" }
];

export function StatusStrip() {
  return <section id="how-it-works" className="how-it-works-section" aria-labelledby="how-it-works-title">
    <div className="wrap">
      <div className="section-heading how-it-works-heading">
        <div>
          <p className="kicker">Voting guide</p>
          <h2 id="how-it-works-title">How it works</h2>
          <p>ForeverVote keeps voting simple, account-backed, and easy to change later.</p>
        </div>
      </div>
      <div className="status-strip" aria-label="Voting guide">
        <div className="status-grid">
          {statusItems.map((item) => <div key={item.number}>
            <strong>{item.number}</strong>
            <span>{item.title}</span>
            <small>{item.detail}</small>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
