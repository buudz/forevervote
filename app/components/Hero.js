export function LandingHero() {
  return <section className="hero launch-hero" aria-labelledby="landing-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid hero-grid-single">
      <div className="hero-copy">
        <p className="kicker">World of Warcraft: Forever · Community Voting Hub</p>
        <h1 id="landing-title">What should WoW: Forever become?</h1>
        <p className="intro">Vote on community-created polls, see where players stand, and submit the questions you think the community should answer.</p>
        <p className="intro">Built around a verified community, ForeverVote turns player opinion into clear, public results.</p>
        <div className="hero-actions">
          <a className="button primary" href="#polls">Browse polls</a>
          <a className="button secondary" href="/submit">Submit a poll</a>
          <a className="button secondary" href="/profile">Check honor level</a>
        </div>
      </div>
    </div>
  </section>;
}
