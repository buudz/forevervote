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
const categories = ["All", ...new Set(polls.map(poll => poll.category))];

export default function Home() {
  const [category, setCategory] = useState("All");
  const [shareMessage, setShareMessage] = useState("");
  const visible = polls.filter(poll => category === "All" || poll.category === category);

  async function share(id) {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage("Link copied.");
    } catch {
      setShareMessage("Copy this link: " + url.toString());
    }
  }

  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header wrap">
      <a className="brand" href="/" aria-label="ForeverVote home"><span className="brand-mark" aria-hidden="true">F</span>FOREVER<span className="gold">VOTE</span></a>
      <a className="header-link" href="#how-it-works">About the project <span aria-hidden="true">↗</span></a>
    </header>
    <main id="main">
      <section className="hero wrap">
        <p className="eyebrow"><span className="dot" /> INDEPENDENT COMMUNITY FEEDBACK</p>
        <h1>Your voice.<br /><span>Azeroth’s future.</span></h1>
        <p className="intro">What should change in World of Warcraft?<br />Community proposals. Player voices. Public results.</p>
        <div className="hero-actions"><a className="button primary" href="#polls">Explore proposals <span aria-hidden="true">↓</span></a><a className="button secondary" href="#how-it-works">How it will work</a></div>
        <div className="launch-note"><span className="small-diamond" aria-hidden="true">◇</span> Early preview · Battle.net login and voting are coming soon.</div>
      </section>
      <div className="wrap">
        <section className="principles" aria-label="Project principles">
          <div><span className="gold">01</span><p>Real player voices<small>Battle.net + WoW verification planned</small></p></div>
          <div><span className="gold">02</span><p>One identity. One vote.<small>Per poll, regardless of WoW licenses</small></p></div>
          <div><span className="gold">03</span><p>Open community results<small>Made to share and discuss</small></p></div>
        </section>
        <section id="polls" className="polls-section">
          <div className="section-heading"><div><p className="eyebrow">THE CONVERSATION STARTS HERE</p><h2>The community’s questions.</h2></div><span className="preview-label">{polls.length} PROPOSED LAUNCH POLLS</span></div>
          <p className="section-description">Explore the first proposals for WoW Forever. These are community questions, not confirmed game features.</p>
          <div className="filters" role="group" aria-label="Filter proposals by category">{categories.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}</div>
          <p className="sr-only" aria-live="polite">{visible.length} proposals shown.</p>
          <div className="poll-grid">{visible.map((poll) => <article className="poll-card" id={poll.id} key={poll.id}>
            <div className="card-top"><span className="category">{poll.category}</span><span className="draft">PROPOSED POLL</span></div>
            <h3>{poll.title}</h3><p className="context">{poll.context}</p>
            <div className="option-preview" aria-label="Proposed options"><span>Yes</span><span>No</span></div>
            <div className="card-footer"><span>Voting opens at launch</span><button onClick={() => share(poll.id)} aria-label={"Share proposal: " + poll.title}>Share <span aria-hidden="true">↗</span></button></div>
          </article>)}</div>
          <p className="share-status" role="status">{shareMessage}</p>
        </section>
        <section className="about" id="how-it-works"><div><p className="eyebrow">BUILT ON PLAYER IDENTITY</p><h2>A stronger signal<br />from the community.</h2></div><div className="about-copy"><p>At launch, you’ll sign in on Blizzard’s website with Battle.net. We plan to check for a WoW profile before you can create a poll or vote.</p><p>Each verified Battle.net identity will have one vote per poll. Multiple WoW licenses won’t give that identity extra votes. You’ll be able to change your choice.</p><p className="muted">Verification will establish account eligibility, not prove a unique human or a representative sample of all players. Results will be community feedback, never official Blizzard decisions.</p></div></section>
      </div>
    </main>
    <footer className="footer wrap"><span className="footer-brand">FOREVER<span className="gold">VOTE</span></span><p>Independent World of Warcraft community project.<br />Not affiliated with or endorsed by Blizzard Entertainment.</p><a href="#main">Back to top ↑</a></footer>
  </>;
}
