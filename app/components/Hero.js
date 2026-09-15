import { EmblemImage } from "./EmblemImage";

export function Hero() {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid">
      <div className="hero-copy">
        <p className="kicker">World of Warcraft: Forever · Community Voting Hub</p>
        <h1 id="hero-title">A place for WoW Forever<br /><span>players to be heard.</span></h1>
        <p className="intro">ForeverVote is an independent community polling hub for the biggest questions surrounding World of Warcraft: Forever. Verified players, one vote per poll, to better understand what the community really wants.</p>
        <div className="hero-actions">
          <a className="button primary" href="#polls">Browse polls</a>
          <a className="button secondary" href="#how-it-works">How ForeverVote works</a>
        </div>
        <div className="disclaimer-banner">
          <strong>Independent fan project.</strong>
          <span>ForeverVote is not affiliated with, sponsored by, or endorsed by Blizzard Entertainment.</span>
        </div>
      </div>
      <div className="hero-emblem">
        <EmblemImage className="hero-logo" priority alt="ForeverVote — WoW Community Voting Hub" />
      </div>
    </div>
  </section>;
}
