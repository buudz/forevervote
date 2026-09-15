"use client";

import { useEffect, useState } from "react";
import { PollCard } from "./PollCard";

export function StandalonePollCard({ initialPoll }) {
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [poll, setPoll] = useState(initialPoll);
  const [databaseReady, setDatabaseReady] = useState(true);
  const [votingOptionId, setVotingOptionId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const authReady = !auth.loading;
  const canVote = Boolean(auth.authenticated && auth.wowProfile?.hasClassicProfile && databaseReady);

  async function loadPoll(isActive = () => true) {
    const response = await fetch(`/api/polls/${encodeURIComponent(initialPoll.slug)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!isActive()) {
      return;
    }

    if (!response.ok || !data.ok || !data.poll) {
      setDatabaseReady(false);
      setStatusMessage("Live voting is temporarily unavailable. Try refreshing in a moment.");
      return;
    }

    setPoll(data.poll);
    setDatabaseReady(true);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.json()),
      loadPoll(() => active)
    ])
      .then(([authData]) => {
        if (active) {
          setAuth({ loading: false, ...authData });
        }
      })
      .catch(() => {
        if (active) {
          setAuth({ loading: false, authenticated: false });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitVote(pollSlug, optionId) {
    if (!canVote) {
      setStatusMessage(auth.authenticated
        ? "A Classic WoW profile is required to vote."
        : "Login with Battle.net to vote.");
      return;
    }

    const selectedIds = Array.isArray(poll.userVoteOptionIds)
      ? poll.userVoteOptionIds
      : (poll.userVoteOptionId ? [poll.userVoteOptionId] : []);
    const isRetracting = selectedIds.includes(optionId);

    setVotingOptionId(optionId);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/polls/${encodeURIComponent(pollSlug)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, action: isRetracting ? "retract" : "vote" })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "vote_failed");
      }

      await loadPoll(() => true);
      setStatusMessage(isRetracting
        ? "Selection removed."
        : (poll.allowMultipleAnswers ? "Selection saved." : "Vote saved."));
    } catch (error) {
      setStatusMessage(error.message === "classic_profile_required"
        ? "A Classic WoW profile is required to vote."
        : "Vote failed. Try again in a moment.");
    } finally {
      setVotingOptionId(null);
    }
  }

  async function sharePoll(currentPoll) {
    const pollUrl = window.location.href;
    setShareMessage("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentPoll.title,
          text: `Vote on ForeverVote: ${currentPoll.title}`,
          url: pollUrl
        });
        return;
      }

      await navigator.clipboard.writeText(pollUrl);
      setShareMessage("Poll link copied.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        setShareMessage("Copy the poll URL from your browser.");
      }
    }
  }

  return <div className="standalone-poll-voting">
    <PollCard
      poll={poll}
      canVote={canVote}
      authReady={authReady}
      databaseReady={databaseReady}
      onShare={sharePoll}
      onVote={submitVote}
      votingOptionId={votingOptionId}
      standalone
    />

    {!auth.loading && !auth.authenticated && <div className="standalone-login-callout">
      <span>Want to vote?</span>
      <a className="button primary" href="/api/auth/login/battlenet">Login with Battle.net</a>
    </div>}

    {statusMessage && <p className="poll-status" role="status">{statusMessage}</p>}
    {shareMessage && <p className="share-status" role="status">{shareMessage}</p>}
  </div>;
}
