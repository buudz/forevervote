"use client";

import { useState } from "react";

const polls = [
  {
    id: "first-class",
    category: "General",
    title: "What class are you playing first in WoW Forever?",
    context: "Pick the first class you plan to level when Forever launches.",
    options: ["Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Shaman", "Mage", "Warlock", "Druid"],
    featured: true
  },
  { id: "arena", category: "PvP", title: "Should WoW Forever eventually add Arena?", context: "A place for small-team competition, or a step away from the Classic experience?", options: ["Yes", "No"] },
  { id: "raid-size", category: "PvE", title: "Should old 40-player raids stay 40-player?", context: "Preserve the scale of the originals, or make room for smaller groups?", options: ["Yes", "No"] },
  { id: "new-class", category: "General", title: "Should Blizzard add a new class to Forever?", context: "New ways to play, new class fantasies, and a different balance to strike.", options: ["Yes", "No"] },
  { id: "hardcore", category: "General", title: "Should Hardcore characters be able to transfer after death?", context: "A final end to the adventure, or a new beginning on a regular realm?", options: ["Yes", "No"] },
  { id: "flying", category: "World", title: "Should Forever ever add flying?", context: "Take to the skies, or keep exploration firmly on the ground?", options: ["Yes", "No"] },
  { id: "level-cap", category: "General", title: "Should Forever stay level 60 permanently?", context: "Expand the adventure without raising the level cap?", options: ["Yes", "No"] }
];

const categories = ["All", "PvE", "PvP", "World", "General"];
const pollCategories = ["PvE", "PvP", "World", "General"];
const MAX_OPTIONS = 12;

export default function Home() {
  const [category, setCategory] = useState("All");
  const [shareMessage, setShareMessage] = useState("");
  const [builderMessage, setBuilderMessage] = useState("");
  const [builder, setBuilder] = useState({
    question: "",
    description: "",
    category: "General",
    options: ["", ""]
  });

  const visible = polls.filter((poll) => category === "All" || poll.category === category);

  async function share(id) {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage("Poll link copied.");
    } catch {
      setShareMessage("Copy this link: " + url.toString());
    }
  }

  function updateOption(index, value) {
    setBuilder((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option)
    }));
  }

  function addOption() {
    setBuilder((current) => current.options.length >= MAX_OPTIONS
      ? current
      : { ...current, options: [...current.options, ""] });
  }

  function removeOption(index) {
    setBuilder((current) => current.options.length <= 2
      ? current
      : { ...current, options: current.options.filter((_, optionIndex) => optionIndex !== index) });
  }

  function submitBuilder(event) {
    event.preventDefault();
    setBuilderMessage("Poll publishing will unlock with verified Battle.net login. Nothing has been published yet.");
  }

  const previewOptions = builder.options.map((option, index) => option.trim() || `Option ${index + 1}`);

  return <>
    <a className="skip" href="#main">Skip to content</a>

    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="/" aria-label="ForeverVote home">
          <img className="brand-crest" src="/forevervote-emblem-transparent.webp" alt="" aria-hidden="true" />
          <span className="brand-name"><span>Forever</span><strong>Vote</strong></span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#polls">Polls</a>
          <a href="#create">Create poll</a>
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
            <p className="intro">Vote on the biggest questions surrounding WoW Forever. Community polls, verified players, and public results built for discussion.</p>
            <div className="hero-actions">
              <a className="button primary" href="#polls">Browse polls</a>
              <a className="button secondary" href="#create">Create a poll</a>
            </div>
            <div className="disclaimer-banner">
              <strong>Independent fan project.</strong>
              <span>ForeverVote is not affiliated with, sponsored by, or endorsed by Blizzard Entertainment.</span>
            </div>
          </div>
          <div className="hero-emblem">
            <div className="emblem-aura" aria-hidden="true" />
            <img className="hero-logo" src="/forevervote-emblem-transparent.webp" alt="FV — Voice of the Community" />
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
              <p className="kicker">Community questions</p>
              <h2>Polls to vote on</h2>
              <p>Voting opens once Battle.net verification is ready.</p>
            </div>
            <span className="count-badge">{polls.length} polls</span>
          </div>

          <div className="filters" role="group" aria-label="Filter polls by category">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}
          </div>

          <p className="sr-only" aria-live="polite">{visible.length} polls shown.</p>

          <div className="poll-grid">
            {visible.map((poll) => <article className={poll.featured ? "poll-card featured" : "poll-card"} id={poll.id} key={poll.id}>
              <div className="card-ornament" aria-hidden="true">◆</div>
              <div className="card-top">
                <span className="category">{poll.category}</span>
                <span className="draft">{poll.featured ? "Starter poll" : "Voting soon"}</span>
              </div>
              <h3>{poll.title}</h3>
              <p className="context">{poll.context}</p>
              <div className={poll.options.length > 2 ? "option-preview multi" : "option-preview"} aria-label="Poll options">
                {poll.options.map((option) => <span key={option}>{option}</span>)}
              </div>
              <div className="card-footer">
                <span>Voting opens when account verification is ready</span>
                <button onClick={() => share(poll.id)} aria-label={"Share poll: " + poll.title}>Share ↗</button>
              </div>
            </article>)}
          </div>

          <p className="share-status" role="status">{shareMessage}</p>
        </div>
      </section>

      <section id="create" className="create-section">
        <div className="wrap">
          <div className="section-heading create-heading">
            <div>
              <p className="kicker">Build your question</p>
              <h2>Create a poll</h2>
              <p>Choose the question, category, context and your own voting options.</p>
            </div>
            <span className="count-badge">2–{MAX_OPTIONS} options</span>
          </div>

          <div className="builder-grid">
            <form className="poll-builder" onSubmit={submitBuilder}>
              <label>
                <span>Poll question</span>
                <input
                  required
                  minLength="10"
                  maxLength="180"
                  value={builder.question}
                  onChange={(event) => setBuilder({ ...builder, question: event.target.value })}
                  placeholder="What should the community vote on?"
                />
              </label>

              <div className="builder-row">
                <label>
                  <span>Category</span>
                  <select value={builder.category} onChange={(event) => setBuilder({ ...builder, category: event.target.value })}>
                    {pollCategories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Description <small>optional</small></span>
                  <input
                    maxLength="1500"
                    value={builder.description}
                    onChange={(event) => setBuilder({ ...builder, description: event.target.value })}
                    placeholder="Add context for voters"
                  />
                </label>
              </div>

              <fieldset className="option-fields">
                <legend>Voting options</legend>
                {builder.options.map((option, index) => <div className="option-field" key={index}>
                  <span className="option-number">{String(index + 1).padStart(2, "0")}</span>
                  <input
                    required
                    maxLength="100"
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    aria-label={`Poll option ${index + 1}`}
                  />
                  <button type="button" className="remove-option" onClick={() => removeOption(index)} disabled={builder.options.length <= 2} aria-label={`Remove option ${index + 1}`}>×</button>
                </div>)}
              </fieldset>

              <div className="builder-actions">
                <button type="button" className="button secondary compact" onClick={addOption} disabled={builder.options.length >= MAX_OPTIONS}>+ Add option</button>
                <button type="submit" className="button primary compact">Prepare poll</button>
              </div>
              <p className="builder-note">Publishing will require a verified Battle.net identity once login is connected.</p>
              <p className="builder-status" role="status">{builderMessage}</p>
            </form>

            <div className="builder-preview" aria-label="Poll preview">
              <p className="preview-kicker">Live preview</p>
              <article className="poll-card preview-card">
                <div className="card-ornament" aria-hidden="true">◆</div>
                <div className="card-top">
                  <span className="category">{builder.category}</span>
                  <span className="draft">Draft</span>
                </div>
                <h3>{builder.question.trim() || "Your poll question"}</h3>
                <p className="context">{builder.description.trim() || "Add a short description so voters understand the question."}</p>
                <div className={previewOptions.length > 2 ? "option-preview multi" : "option-preview"}>
                  {previewOptions.map((option, index) => <span key={index}>{option}</span>)}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="wrap about-grid">
          <div className="about-title">
            <p className="kicker">Independent fan project</p>
            <h2>About ForeverVote</h2>
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
        <div className="footer-brand">
          <img src="/forevervote-emblem-transparent.webp" alt="" aria-hidden="true" />
          <span>ForeverVote</span>
        </div>
        <p>Independent community fan project · Not affiliated with or endorsed by Blizzard Entertainment.</p>
        <a href="#main">Back to top ↑</a>
      </div>
    </footer>
  </>;
}
