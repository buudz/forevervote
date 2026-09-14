const statusItems = [
  { number: "01", title: "Login with Battle.net", detail: "Verify a real WoW account before voting" },
  { number: "02", title: "One vote per poll", detail: "One vote per eligible WoW player" },
  { number: "03", title: "Change your mind", detail: "Pick another option to update your vote" }
];

export function StatusStrip() {
  return <section className="status-strip" aria-label="Voting guide">
    <div className="wrap status-grid">
      {statusItems.map((item) => <div key={item.number}>
        <strong>{item.number}</strong>
        <span>{item.title}</span>
        <small>{item.detail}</small>
      </div>)}
    </div>
  </section>;
}
