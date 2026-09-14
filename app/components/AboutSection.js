export function AboutSection() {
  return <section id="about" className="about-section" aria-labelledby="about-title">
    <div className="wrap about-grid">
      <div className="about-title">
        <p className="kicker">Independent community project</p>
        <h2 id="about-title">About ForeverVote</h2>
      </div>
      <div className="about-panel">
        <p>ForeverVote is an independent, community-run fan project built to collect structured opinions about World of Warcraft and WoW Forever.</p>
        <p>When voting launches, the plan is to use Blizzard’s Battle.net sign-in flow and verify a WoW profile before allowing votes or poll creation. Each eligible Battle.net identity will get one vote per poll, and changing your mind will update that vote rather than create another.</p>
        <p>Results are community feedback only. They are not scientific polling, they do not represent every WoW player, and they have no official decision-making authority.</p>
        <div className="legal-callout">
          <strong>Blizzard disclaimer</strong>
          <span>ForeverVote is not affiliated with, authorized by, maintained by, sponsored by, or endorsed by Blizzard Entertainment, Inc. World of Warcraft, Warcraft, Battle.net, Blizzard and related names and marks are the property of their respective owners.</span>
        </div>
      </div>
    </div>
  </section>;
}
