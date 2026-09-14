import { EmblemImage } from "./EmblemImage";

export function Hero() {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-glow" aria-hidden="true" />
    <div className="wrap hero-grid">
      <div className="hero-copy">
        <p className="kicker">Unofficial World of Warcraft community project</p>
        <h1 id="hero-title">Let the players<br /><span>shape the conversation.</span></h1>
        <p className="intro">Vote on the biggest questions surrounding WoW Forever. Community polls, verified players, and public results built for discussion.</p>
        <div className="hero-actions">
          <a className="button primary" href="#polls">Browse polls</a>
          <a className="button secondary" href="#about">How ForeverVote works</a>
        </div>
        <div className="disclaimer-banner">
          <strong>Independent fan project.</strong>
          <span>ForeverVote is not affiliated with, sponsored by, or endorsed by Blizzard Entertainment.</span>
        </div>
      </div>
      <div className="hero-emblem">
        <EmblemImage className="hero-logo" priority alt="ForeverVote — Voice of the Community" />
      </div>
    </div>
  </section>;
}
