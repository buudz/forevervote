"use client";

import { useState } from "react";

const polls = [
  { id: "arena", category: "PvP", title: "Should WoW Forever eventually add Arena?", context: "A place for small-team competition, or a step away from the Classic experience?" },
  { id: "raid-size", category: "Raids", title: "Should old 40-player raids stay 40-player?", context: "Preserve the scale of the originals, or make room for smaller groups?" },
  { id: "new-class", category: "Classes", title: "Should Blizzard add a new class to Forever?", context: "New ways to play, new class fantasies, and a different balance to strike." },
  { id: "hardcore", category: "General", title: "Should Hardcore characters be able to transfer after death?", context: "A final end to the adventure, or a new beginning on a regular realm?" },
  { id: "flying", category: "World", title: "Should Forever ever add flying?", context: "Take to the skies, or keep exploration firmly on the ground?" },
  { id: "level-cap", category: "General", title: "Should Forever stay level 60 permanently?", context: "Expand the adventure without raising the level cap?" }
];

const categories = ["All", ...new Set(polls.map((poll) => poll.category))];

export default function Home() {
  const [category, setCategory] = useState("All");
  const [shareMessage, setShareMessage] = useState("");
  const visible = polls.filter((poll) => category === "All" || poll.category === category);

  async function share(id) {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage("Proposal link copied.");
    } catch {
      setShareMessage("Copy this link: " + url.toString());
    }
  }

  return <>
    <a className="skip" href="#main">Skip to content</a>

    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="/" aria-label="ForeverVote home">
          <img className="brand-crest" src="/forevervote-fv.svg" alt="" aria-hidden="true" />
          <span className="brand-copy"><strong>ForeverVote</strong><small>Community Council</small></span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#polls">Proposals</a>
          <a href="#about">About</a>
          <span className="login-placeholder" aria-label="Battle.net login coming soon">Battle.net login soon</span>
        </nav>
      </div>
    </header>

    <main id="main">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="kicker">Unofficial World of Warcraft community project</p>
            <h1>Let the players<br /><span>shape the conversation.</span></h1>
            <p className="intro">Vote on the biggest questions surrounding WoW Forever. Public proposals, verified players, and results built for community discussion.</p>
            <div className="hero-actions">
              <a className="button primary" href="#polls">Browse proposals</a>
              <a className="button secondary" href="#about">How ForeverVote works</a>
            </div>
            <div className="disclaimer-banner">
              <strong>Independent fan project.</strong>
              <span>ForeverVote is not affiliated with, sponsored by, or endorsed by Blizzard Entertainment.</span>
            </div>
          </div>
          <div className="hero-emblem" aria-hidden="true">
            <div className="emblem-ring"><img src="/forevervote-fv.svg" alt="" /></div>
            <div className="emblem-ribbon">Voice of the Community</div>
          </div>
        </div>
      </section>

      <section className="status-strip">
        <div className="wrap status-grid">
          <div><strong>01</strong><span>Battle.net identity</span><small>OAuth integration in progress</small></div>
          <div><strong>02</strong><span>One vote per poll</span><small>Database integrity already enforced</small></div>
          <div><strong>03</strong><span>Public results</span><small>No synthetic votes or fake activity</small></div>
        </div>
      </section>

      <section id="polls" className="polls-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="kicker">The tavern board</p>
              <h2>Proposed launch polls</h2>
              <p>These are community questions, not confirmed Blizzard features.</p>
            </div>
            <span className="count-badge">{polls.length} proposals</span>
          </div>

          <div className="filters" role="group" aria-label="Filter proposals by category">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}
          </div>

          <p className="sr-only" aria-live="polite">{visible.length} proposals shown.</p>

          <div className="poll-grid">
            {visible.map((poll) => <article className="poll-card" id={poll.id} key={poll.id}>
              <div className="card-ornament" aria-hidden="true">◆</div>
              <div className="card-top">
                <span className="category">{poll.category}</span>
                <span className="draft">Proposed poll</span>
              </div>
              <h3>{poll.title}</h3>
              <p className="context">{poll.context}</p>
              <div className="option-preview" aria-label="Proposed options">
                <span>Yes</span><span>No</span>
              </div>
              <div className="card-footer">
                <span>Voting opens when account verification is ready</span>
                <button onClick={() => share(poll.id)} aria-label={"Share proposal: " + poll.title}>Share ↗</button>
              </div>
            </article>)}
          </div>

          <p className="share-status" role="status">{shareMessage}</p>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="wrap about-grid">
          <div className="about-title">
            <p className="kicker">About ForeverVote</p>
            <h2>Player feedback,<br />without pretending<br />to be official.</h2>
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
      </section>
    </main>

    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-brand"><img src="/forevervote-fv.svg" alt="" aria-hidden="true" /><span>ForeverVote</span></div>
        <p>Independent community fan project · Not affiliated with or endorsed by Blizzard Entertainment.</p>
        <a href="#main">Back to top ↑</a>
      </div>
    </footer>
  </>;
}
