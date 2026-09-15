"use client";

import { useEffect, useMemo, useState } from "react";
import { pollCategories, polls as staticPolls, withFallbackOptions } from "../data/polls";
import { PollCard } from "./PollCard";

const fallbackPolls = staticPolls.map(withFallbackOptions);
const sortOptions = [
  { value: "explore", label: "Explore" },
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" }
];
const voteFilterOptions = [
  { value: "all", label: "All" },
  { value: "unvoted", label: "Unvoted" },
  { value: "voted", label: "Voted" }
];

export function PollsSection() {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("explore");
  const [voteFilter, setVoteFilter] = useState("all");
  const [shareMessage, setShareMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [pollState, setPollState] = useState({ loading: true, databaseReady: false, polls: fallbackPolls });
  const [votingOptionId, setVotingOptionId] = useState(null);

  const authReady = !auth.loading;
  const canVote = Boolean(auth.authenticated && auth.wowProfile?.hasClassicProfile && pollState.databaseReady);

  async function loadAuthAndPolls(nextSort = sort, nextVoteFilter = voteFilter, active = true) {
    const params = new URLSearchParams({ sort: nextSort, filter: nextVoteFilter });
    const [authResponse, pollsResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch(`/api/polls?${params.toString()}`, { cache: "no-store" })
    ]);

    if (!active) {
      return;
    }

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

    setPollState((current) => ({ ...current, loading: true }));
    loadAuthAndPolls(sort, voteFilter, active).catch(() => {
      if (active) {
        setAuth({ loading: false, authenticated: false });
        setPollState({ loading: false, databaseReady: false, polls: fallbackPolls });
        setStatusMessage("Could not load live polls. Try refreshing in a moment.");
      }
    });

    return () => {
      active = false;
    };
  }, [sort, voteFilter]);

  const visiblePolls = useMemo(() => {
    return pollState.polls.filter((poll) => category === "All" || poll.category === category);
  }, [category, pollState.polls]);

  async function sharePoll(poll) {
    const slug = poll.slug || poll.id;
    const pollUrl = new URL(`/polls/${slug}`, window.location.origin).toString();
    const imageUrl = new URL(`/api/share/poll/${slug}`, window.location.origin).toString();
    const text = `${poll.title}\n${poll.rationale || poll.context || "Vote on ForeverVote."}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: poll.title, text, url: pollUrl });
        setShareMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n\nVote here: ${pollUrl}\nShare image: ${imageUrl}`);
      setShareMessage("Poll share link copied. The link includes a preview image for social posts.");
    } catch {
      setShareMessage("Copy this link: " + pollUrl);
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

      await loadAuthAndPolls(sort, voteFilter);
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

      <div
        className="poll-controls"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px 28px",
          flexWrap: "wrap",
          marginBottom: 24
        }}
      >
        <div className="filters" style={{ marginBottom: 0 }} role="group" aria-label="Filter polls by category">
          {pollCategories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "filter active" : "filter"}>{item}</button>)}
        </div>

        <div
          className="poll-control-side"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            gap: "12px 18px",
            flexWrap: "wrap"
          }}
        >
          <div className="filters" style={{ marginBottom: 0, justifyContent: "flex-end" }} role="group" aria-label="Sort polls">
            {sortOptions.map((item) => <button key={item.value} onClick={() => setSort(item.value)} aria-pressed={sort === item.value} className={sort === item.value ? "filter active" : "filter"}>{item.label}</button>)}
          </div>

          <div className="filters" style={{ marginBottom: 0, justifyContent: "flex-end" }} role="group" aria-label="Show voted or unvoted polls">
            {voteFilterOptions.map((item) => <button key={item.value} onClick={() => setVoteFilter(item.value)} aria-pressed={voteFilter === item.value} className={voteFilter === item.value ? "filter active" : "filter"}>{item.label}</button>)}
          </div>
        </div>
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
