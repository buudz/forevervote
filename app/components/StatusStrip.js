const statusItems = [
  { number: "01", title: "Battle.net login", detail: "Ready for live OAuth testing" },
  { number: "02", title: "Profile checks", detail: "WoW namespaces inspected after login" },
  { number: "03", title: "Voting locked", detail: "Supabase voting connects after verification" }
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
