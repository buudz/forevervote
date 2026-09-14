const statusItems = [
  { number: "01", title: "Battle.net identity", detail: "OAuth integration in progress" },
  { number: "02", title: "One vote per poll", detail: "Database integrity already enforced" },
  { number: "03", title: "Public results", detail: "No synthetic votes or fake activity" }
];

export function StatusStrip() {
  return <section className="status-strip" aria-label="Project status">
    <div className="wrap status-grid">
      {statusItems.map((item) => <div key={item.number}>
        <strong>{item.number}</strong>
        <span>{item.title}</span>
        <small>{item.detail}</small>
      </div>)}
    </div>
  </section>;
}
