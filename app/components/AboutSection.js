export function AboutSection() {
  return <section id="about" className="about-section" aria-labelledby="about-title">
    <div className="wrap about-grid">
      <div className="about-title">
        <p className="kicker">Independent community project</p>
        <h2 id="about-title">About ForeverVote</h2>
      </div>
      <div className="about-panel">
        <p>ForeverVote is an independent, community-run fan project built to collect structured opinions about World of Warcraft and World of Warcraft: Forever.</p>
        <p>Voting uses Battle.net sign-in and a verified Classic WoW profile. Poll creators choose whether a poll accepts one answer or multiple answers. Each eligible Battle.net identity can only select each option once, and selections can be changed while the poll is open.</p>
        <p>Results are community feedback only. They are not scientific polling, they do not represent every WoW player, and they have no official decision-making authority.</p>
        <div className="legal-callout">
          <strong>Blizzard disclaimer</strong>
          <span>ForeverVote is not affiliated with, authorized by, maintained by, sponsored by, or endorsed by Blizzard Entertainment, Inc. World of Warcraft, Warcraft, Battle.net, Blizzard and related names and marks are the property of their respective owners.</span>
        </div>
      </div>
    </div>
  </section>;
}
