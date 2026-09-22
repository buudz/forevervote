import { EmblemImage } from "./EmblemImage";

export function LandingHero() {
  return <section className="hero launch-hero" aria-labelledby="landing-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid hero-grid-single">
      <div className="hero-copy">
        <p className="kicker">World of Warcraft: Forever · Community Voting Hub</p>
        <h1 id="landing-title">What should WoW: Forever become?</h1>
        <p className="intro">Vote on community-created polls, see where players stand, and submit the questions you think the community should answer.</p>
        <p className="intro">Battle.net sign-in helps keep participation tied to real player accounts.</p>
        <div className="hero-actions">
          <a className="button primary" href="#polls">Browse polls</a>
          <a className="button secondary" href="/submit">Submit a poll</a>
          <a className="button secondary" href="/profile">Check honor level</a>
        </div>
      </div>
    </div>
  </section>;
}

export function Hero() {
  return <section className="hero mission-hero" aria-labelledby="mission-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid">
      <div className="hero-copy">
        <p className="kicker">World of Warcraft: Forever · Community Voting Hub</p>
        <h1 id="mission-title">A place for WoW Forever<br /><span>players to be heard.</span></h1>
        <p className="intro">ForeverVote is an independent community polling hub for the biggest questions surrounding World of Warcraft: Forever. Verified players, one vote per poll, to better understand what the community really wants.</p>
        <div className="disclaimer-banner">
          <strong>Battle.net login required.</strong>
          <span>This helps keep votes authentic player votes instead of botted or spammed results.</span>
        </div>
      </div>
      <div className="hero-emblem">
        <EmblemImage className="hero-logo" alt="ForeverVote — WoW Community Voting Hub" />
      </div>
    </div>
  </section>;
}
