"use client";

import { useState } from "react";
import { pollCategories, polls } from "../data/polls";
import { PollCard } from "./PollCard";

export function PollsSection() {
  const [category, setCategory] = useState("All");
  const [shareMessage, setShareMessage] = useState("");
  const visiblePolls = polls.filter((poll) => category === "All" || poll.category === category);

  async function sharePoll(id) {
    const url = new URL(window.location.href);
    url.hash = id;

    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage("Poll link copied.");
    } catch {
      setShareMessage("Copy this link: " + url.toString());
    }
  }

  return <section id="polls" className="polls-section" aria-labelledby="polls-title">
    <div className="wrap">
      <div className="section-heading">
        <div>
          <p className="kicker">The tavern board</p>
          <h2 id="polls-title">Polls to vote on</h2>
          <p>Community questions about WoW Forever. Voting opens once Battle.net verification is ready.</p>
        </div>
        <span className="count-badge">{polls.length} polls</span>
      </div>

      <div className="filters" role="group" aria-label="Filter polls by category">
        {pollCategories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}
      </div>

      <p className="sr-only" aria-live="polite">{visiblePolls.length} polls shown.</p>

      <div className="poll-grid">
        {visiblePolls.map((poll) => <PollCard key={poll.id} poll={poll} onShare={sharePoll} />)}
      </div>

      <p className="share-status" role="status">{shareMessage}</p>
    </div>
  </section>;
}
