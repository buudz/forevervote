"use client";

import { useEffect, useMemo, useState } from "react";
import { pollCategories, polls as staticPolls, withFallbackOptions } from "../data/polls";
import { PollCard } from "./PollCard";

const fallbackPolls = staticPolls.map(withFallbackOptions);

export function PollsSection() {
  const [category, setCategory] = useState("All");
  const [shareMessage, setShareMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [pollState, setPollState] = useState({ loading: true, databaseReady: false, polls: fallbackPolls });
  const [votingOptionId, setVotingOptionId] = useState(null);

  const authReady = !auth.loading;
  const canVote = Boolean(auth.authenticated && auth.wowProfile?.hasClassicProfile && pollState.databaseReady);

  async function loadAuthAndPolls() {
    const [authResponse, pollsResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/polls", { cache: "no-store" })
    ]);

    const authData = await authResponse.json();
    const pollsData = await pollsResponse.json();

    setAuth({ loading: false, ...authData });

    if (!pollsResponse.ok || !pollsData.databaseReady) {
      setPollState({ loading: false, databaseReady: false, polls: fallbackPolls });
      setStatusMessage("Live voting is temporarily unavailable. The polls remain visible while the service reconnects.");
      return;
    }

    setPollState({ loading: false, databaseReady: true, polls: pollsData.polls });
    setStatusMessage("");
  }

  useEffect(() => {
    let active = true;

    loadAuthAndPolls().catch(() => {
      if (active) {
        setAuth({ loading: false, authenticated: false });
        setPollState({ loading: false, databaseReady: false, polls: fallbackPolls });
        setStatusMessage("Could not load live polls. Try refreshing in a moment.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const visiblePolls = useMemo(() => {
    return pollState.polls.filter((poll) => category === "All" || poll.category === category);
  }, [category, pollState.polls]);

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

  async function submitVote(pollSlug, optionId) {
    if (!canVote) {
      setStatusMessage(auth.authenticated ? "A Classic WoW profile is required to vote." : "Login with Battle.net to vote.");
      return;
    }

    setVotingOptionId(optionId);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/polls/${encodeURIComponent(pollSlug)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "vote_failed");
      }

      await loadAuthAndPolls();
      setStatusMessage("Vote saved.");
    } catch (error) {
      setStatusMessage(error.message === "classic_profile_required"
        ? "A Classic WoW profile is required to vote."
        : "Vote failed. Try again in a moment.");
    } finally {
      setVotingOptionId(null);
    }
  }

  return <section id="polls" className="polls-section" aria-labelledby="polls-title">
    <div className="wrap">
      <div className="section-heading">
        <div>
          <p className="kicker">Community polls</p>
          <h2 id="polls-title">Polls to vote on</h2>
          <p>{pollState.databaseReady ? "Vote on community questions about World of Warcraft: Forever." : "Community questions about World of Warcraft: Forever. Live voting is temporarily unavailable."}</p>
        </div>
        <span className="count-badge">{pollState.polls.length} polls</span>
      </div>

      <div className="filters" role="group" aria-label="Filter polls by category">
        {pollCategories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}
      </div>

      <p className="sr-only" aria-live="polite">{visiblePolls.length} polls shown.</p>

      {statusMessage && <p className="poll-status" role="status">{statusMessage}</p>}
      {pollState.loading && <p className="poll-status">Loading live polls…</p>}

      <div className="poll-grid">
        {visiblePolls.map((poll) => <PollCard
          key={poll.slug || poll.id}
          poll={poll}
          canVote={canVote}
          authReady={authReady}
          databaseReady={pollState.databaseReady}
          onShare={sharePoll}
          onVote={submitVote}
          votingOptionId={votingOptionId}
        />)}
      </div>

      <p className="share-status" role="status">{shareMessage}</p>
    </div>
  </section>;
}
