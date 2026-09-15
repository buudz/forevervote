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

const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(0,0,0,.72)",
  backdropFilter: "blur(7px)"
};

const modalStyle = {
  width: "min(760px, 100%)",
  border: "1px solid rgba(188,152,84,.55)",
  borderRadius: 14,
  background: "linear-gradient(180deg,#08243B,#061522)",
  color: "var(--text)",
  boxShadow: "0 24px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(228,201,142,.08)",
  padding: 24
};

const modalTopStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 16
};

const sharePreviewStyle = {
  display: "block",
  width: "100%",
  aspectRatio: "1200 / 630",
  marginBottom: 18,
  border: "1px solid rgba(188,152,84,.42)",
  borderRadius: 12,
  background: "#04101C",
  objectFit: "cover",
  boxShadow: "inset 0 1px 0 rgba(228,201,142,.06)"
};

const shareActionsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
  margin: "16px 0"
};

const shareActionStyle = {
  minHeight: 44,
  border: "1px solid rgba(135,103,51,.62)",
  borderRadius: 9,
  background: "#071B2C",
  color: "var(--ivory)",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".8px"
};

function buildSharePayload(poll) {
  const slug = poll.slug || poll.id;
  const pollUrl = new URL(`/polls/${slug}`, window.location.origin).toString();
  const imageUrl = new URL(`/api/share/poll/${slug}?v=3`, window.location.origin).toString();
  const text = `${poll.title}\n\nVote on ForeverVote:\n${pollUrl}`;

  return { title: poll.title, pollUrl, imageUrl, text };
}

function openShareWindow(url) {
  window.open(url, "_blank", "noopener,noreferrer,width=760,height=620");
}

export function PollsSection({ initialPolls = fallbackPolls, initialDatabaseReady = false }) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("explore");
  const [voteFilter, setVoteFilter] = useState("all");
  const [shareMessage, setShareMessage] = useState("");
  const [sharePayload, setSharePayload] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [pollState, setPollState] = useState({
    loading: false,
    databaseReady: initialDatabaseReady,
    polls: initialPolls.length ? initialPolls : fallbackPolls
  });
  const [votingOptionId, setVotingOptionId] = useState(null);

  const authReady = !auth.loading;
  const canVote = Boolean(auth.authenticated && auth.wowProfile?.hasClassicProfile && pollState.databaseReady);

  async function loadPolls(nextSort = sort, nextVoteFilter = voteFilter, active = true) {
    const params = new URLSearchParams({ sort: nextSort, filter: nextVoteFilter || "all" });
    const pollsResponse = await fetch(`/api/polls?${params.toString()}`, { cache: "no-store" });

    if (!active) {
      return;
    }

    const pollsData = await pollsResponse.json();

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

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) {
          return;
        }

        setAuth({ loading: false, ...data });
        setVoteFilter("all");
      })
      .catch(() => {
        if (active) {
          setAuth({ loading: false, authenticated: false });
          setVoteFilter("all");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setPollState((current) => ({ ...current, loading: true }));

    loadPolls(sort, voteFilter, active).catch(() => {
      if (active) {
        setPollState({ loading: false, databaseReady: false, polls: fallbackPolls });
        setStatusMessage("Could not load live polls. Try refreshing in a moment.");
      }
    });

    return () => {
      active = false;
    };
  }, [sort, voteFilter]);

  useEffect(() => {
    if (!sharePayload) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setSharePayload(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sharePayload]);

  const visiblePolls = useMemo(() => {
    return pollState.polls.filter((poll) => category === "All" || poll.category === category);
  }, [category, pollState.polls]);

  function sharePoll(poll) {
    setShareMessage("");
    setSharePayload(buildSharePayload(poll));
  }

  async function copyShareLink() {
    if (!sharePayload) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sharePayload.pollUrl);
      setShareMessage("Poll link copied.");
    } catch {
      setShareMessage("Copy the poll URL from your browser.");
    }
  }

  function shareToX() {
    if (!sharePayload) {
      return;
    }

    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePayload.text)}`);
  }

  function shareToFacebook() {
    if (!sharePayload) {
      return;
    }

    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePayload.pollUrl)}`);
  }

  function shareToWhatsApp() {
    if (!sharePayload) {
      return;
    }

    openShareWindow(`https://wa.me/?text=${encodeURIComponent(sharePayload.text)}`);
  }

  function shareByEmail() {
    if (!sharePayload) {
      return;
    }

    window.location.href = `mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(sharePayload.text)}`;
  }

  async function submitVote(pollSlug, optionId) {
    if (!canVote) {
      setStatusMessage(auth.authenticated ? "A Classic WoW profile is required to vote." : "Login with Battle.net to vote.");
      return;
    }

    const currentPoll = pollState.polls.find((poll) => (poll.slug || poll.id) === pollSlug);
    const isRetracting = currentPoll?.userVoteOptionId === optionId;

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

      await loadPolls(sort, voteFilter);
      setStatusMessage(isRetracting ? "Vote removed." : "Vote saved.");
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

      {!pollState.loading && pollState.databaseReady && visiblePolls.length === 0 && <div className="poll-empty-state" role="status">
        {voteFilter === "unvoted" && auth.authenticated
          ? <>
              <strong>{category === "All" ? "You’re all caught up." : "Nothing left to vote on here."}</strong>
              <span>{category === "All" ? "You’ve voted on all available polls." : "You’ve voted on every available poll in this category."}</span>
              <button className="button secondary" type="button" onClick={() => setVoteFilter("all")}>View all polls</button>
            </>
          : voteFilter === "voted"
            ? <>
                <strong>No voted polls yet.</strong>
                <span>Your completed votes will appear here.</span>
                <button className="button secondary" type="button" onClick={() => setVoteFilter("unvoted")}>Show unvoted</button>
              </>
            : <>
                <strong>No polls found.</strong>
                <span>Try another category or check back later.</span>
              </>}
      </div>}

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

    {sharePayload && <div style={modalBackdropStyle} onMouseDown={() => setSharePayload(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        style={modalStyle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={modalTopStyle}>
          <div>
            <p className="kicker" style={{ marginBottom: 10 }}>Share poll</p>
            <h3 id="share-modal-title" style={{ fontSize: "clamp(22px,3vw,30px)", color: "var(--ivory)" }}>{sharePayload.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setSharePayload(null)}
            aria-label="Close share dialog"
            style={{ ...shareActionStyle, minHeight: 38, width: 42, padding: 0 }}
          >×</button>
        </div>

        <img src={sharePayload.imageUrl} alt="" aria-hidden="true" style={sharePreviewStyle} />

        <div style={shareActionsStyle}>
          <button type="button" style={shareActionStyle} onClick={copyShareLink}>Copy link</button>
          <button type="button" style={shareActionStyle} onClick={shareToX}>X</button>
          <button type="button" style={shareActionStyle} onClick={shareToFacebook}>Facebook</button>
          <button type="button" style={shareActionStyle} onClick={shareToWhatsApp}>WhatsApp</button>
          <button type="button" style={shareActionStyle} onClick={shareByEmail}>Email</button>
          <a style={{ ...shareActionStyle, display: "grid", placeItems: "center" }} href={sharePayload.imageUrl} target="_blank" rel="noreferrer">Preview card</a>
        </div>

        <p className="share-status" style={{ marginBottom: 0 }}>
          Copy the poll link or use a direct share button. The link carries this preview card automatically where supported.
        </p>
      </div>
    </div>}
  </section>;
}
