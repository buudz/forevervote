import { EmblemImage } from "./EmblemImage";

export function LaunchHero() {
  return <section className="hero launch-hero" aria-labelledby="launch-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid">
      <div className="hero-copy">
        <p className="kicker">World of Warcraft: Forever · Community Voting Hub</p>
        <h1 id="launch-title">Happy Launch Day!</h1>
        <p className="intro">We are so happy to be releasing this website to you all. Hope you find many great polls to submit and vote on.</p>
        <p className="intro">Discord server is coming soon!</p>
        <div className="hero-actions">
          <a className="button primary" href="/submit">Submit</a>
          <a className="button secondary" href="#polls">Browse polls</a>
        </div>
      </div>
      <div className="hero-emblem">
        <EmblemImage className="hero-logo" priority alt="ForeverVote — WoW Community Voting Hub" />
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
        <div className="hero-actions">
          <a className="button primary" href="#polls">Browse polls</a>
          <a className="button secondary" href="#how-it-works">How ForeverVote works</a>
        </div>
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
