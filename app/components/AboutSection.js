export function AboutSection() {
  return <section id="about" className="about-section" aria-labelledby="about-title">
    <div className="wrap about-grid">
      <div className="about-title">
        <p className="kicker">Independent community project</p>
        <h2 id="about-title">About ForeverVote</h2>
      </div>
      <div className="about-panel">
        <p>ForeverVote is an independent, community-run fan project built to collect structured opinions about World of Warcraft and World of Warcraft: Forever.</p>
        <p>Voting uses Battle.net sign-in to keep each voter tied to a real Battle.net identity. Poll creators choose whether a poll accepts one answer or multiple answers. Each eligible Battle.net identity can only select each option once, and selections can be changed while the poll is open.</p>
        <p>Results are community feedback only. They are not scientific polling, they do not represent every WoW player, and they have no official decision-making authority.</p>
        <div className="legal-callout">
          <strong>Public source &amp; transparency</strong>
          <span>ForeverVote's source code is public on <a href="https://github.com/buudz/forevervote">GitHub</a> so anyone can inspect how authentication, voting, moderation, and vote-integrity protections work. The live site also links to the Git commit used for its Vercel build, making the deployed version easy to compare with the public source.</span>
        </div>
        <div className="legal-callout">
          <strong>Blizzard disclaimer</strong>
          <span>ForeverVote is not affiliated with, authorized by, maintained by, sponsored by, or endorsed by Blizzard Entertainment, Inc. World of Warcraft, Warcraft, Battle.net, Blizzard and related names and marks are the property of their respective owners.</span>
        </div>
      </div>
    </div>
  </section>;
}
