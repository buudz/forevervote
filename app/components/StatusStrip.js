const statusItems = [
  { number: "01", title: "Verified identity", detail: "Sign in securely with Battle.net" },
  { number: "02", title: "Classic profile", detail: "Eligibility is checked before voting" },
  { number: "03", title: "One vote per poll", detail: "Changing your choice updates your vote" }
];

export function StatusStrip() {
  return <section className="status-strip" aria-label="Voting principles">
    <div className="wrap status-grid">
      {statusItems.map((item) => <div key={item.number}>
        <strong>{item.number}</strong>
        <span>{item.title}</span>
        <small>{item.detail}</small>
      </div>)}
    </div>
  </section>;
}
