"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 25;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "most-votes", label: "Most votes" },
  { value: "least-votes", label: "Least votes" },
  { value: "category", label: "Category" }
];

function formatRetention(expiresAt) {
  if (!expiresAt) return "";

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Expiring now";

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0 && hours > 0) return `${days}d ${hours}h left`;
  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function matchesSearch(poll, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    poll.title,
    poll.rationale,
    poll.category,
    poll.creatorBattleTag,
    ...(poll.options || []).map((option) => option.text)
  ].filter(Boolean).join(" ").toLowerCase();

  return haystack.includes(normalized);
}

function sortPolls(polls, sort) {
  const sorted = [...polls];

  if (sort === "oldest") {
    return sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }

  if (sort === "title-asc") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sort === "title-desc") {
    return sorted.sort((a, b) => b.title.localeCompare(a.title));
  }

  if (sort === "most-votes") {
    return sorted.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0) || a.title.localeCompare(b.title));
  }

  if (sort === "least-votes") {
    return sorted.sort((a, b) => (a.totalVotes || 0) - (b.totalVotes || 0) || a.title.localeCompare(b.title));
  }

  if (sort === "category") {
    return sorted.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  }

  if (sort === "expiring") {
    return sorted.sort((a, b) => new Date(a.trashExpiresAt || 0) - new Date(b.trashExpiresAt || 0));
  }

  return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function PollAdminCard({ poll, actions, busy, onAction, trashLabel = "" }) {
  const meta = [
    poll.creatorBattleTag,
    formatDate(poll.createdAt),
    `${poll.totalVotes || 0} vote${poll.totalVotes === 1 ? "" : "s"}`
  ].filter(Boolean).join(" · ");

  return <article className="moderation-card">
    <div className="card-top">
      <span className="category">{poll.category}</span>
      <span className="draft">{meta}</span>
    </div>
    <h3>{poll.title}</h3>
    {poll.rationale && <p className="context">{poll.rationale}</p>}
    <div className="moderation-options">
      {poll.options.map((option) => <span key={option.id}>{option.text}</span>)}
    </div>
    {trashLabel && <p className="trash-retention">
      <strong>{trashLabel}</strong>
      <span>{formatRetention(poll.trashExpiresAt)}</span>
    </p>}
    <div className="moderation-actions">
      {actions.map((action) => <button
        key={action.value}
        className={action.className || "button secondary"}
        type="button"
        disabled={Boolean(busy)}
        onClick={() => onAction(poll.id, action.value)}
      >
        {busy === `${poll.id}:${action.value}` ? action.busyLabel : action.label}
      </button>)}
    </div>
  </article>;
}

function AdminSection({
  kicker,
  title,
  polls,
  emptyTitle,
  emptyText,
  actions,
  busy,
  onAction,
  trashLabel = "",
  defaultOpen = false,
  expirySort = false
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sort, setSort] = useState(expirySort ? "expiring" : "newest");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredPolls = useMemo(() => {
    const matching = polls.filter((poll) => matchesSearch(poll, query));
    return sortPolls(matching, sort);
  }, [polls, query, sort]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, sort, polls.length]);

  const visiblePolls = filteredPolls.slice(0, visibleCount);
  const sortOptions = expirySort
    ? [{ value: "expiring", label: "Expiring soon" }, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  return <section className={open ? "admin-section-block open" : "admin-section-block collapsed"}>
    <button
      className="admin-section-toggle"
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
    >
      <span>
        <small className="kicker">{kicker}</small>
        <strong>{title}</strong>
      </span>
      <span className="admin-section-toggle-meta">
        <span className="count-badge">{polls.length}</span>
        <span className="collapse-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </span>
    </button>

    {open && <div className="admin-section-content">
      {polls.length === 0
        ? <div className="admin-empty">
            <strong>{emptyTitle}</strong>
            <span>{emptyText}</span>
          </div>
        : <>
            <div className="admin-list-tools">
              <label className="admin-search">
                <span className="sr-only">Search {title}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, category, player or option…"
                />
              </label>
              <label className="admin-sort">
                <span>Sort</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="admin-results-meta">
              {query
                ? `${filteredPolls.length} match${filteredPolls.length === 1 ? "" : "es"} of ${polls.length}`
                : `${polls.length} poll${polls.length === 1 ? "" : "s"}`}
            </div>

            {filteredPolls.length === 0
              ? <div className="admin-empty compact">
                  <strong>No matching polls.</strong>
                  <span>Try a different search.</span>
                </div>
              : <div className="moderation-list">
                  {visiblePolls.map((poll) => <PollAdminCard
                    key={poll.id}
                    poll={poll}
                    actions={actions}
                    busy={busy}
                    onAction={onAction}
                    trashLabel={trashLabel}
                  />)}
                </div>}

            {visibleCount < filteredPolls.length && <button
              className="button secondary admin-show-more"
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            >
              Show 25 more
            </button>}
          </>}
    </div>}
  </section>;
}

export function AdminPollsPanel() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, admin: false });
  const [queues, setQueues] = useState({
    loading: true,
    submissions: [],
    live: [],
    rejected: [],
    unpublished: []
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const authData = await authResponse.json().catch(() => ({}));
    setAuth({ loading: false, ...authData });

    if (!authData.admin) {
      setQueues((current) => ({ ...current, loading: false }));
      return;
    }

    const response = await fetch("/api/admin/polls", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error("Could not load the admin poll lists.");
    }

    setQueues({
      loading: false,
      submissions: data.submissions || [],
      live: data.live || [],
      rejected: data.rejected || [],
      unpublished: data.unpublished || []
    });
  }

  useEffect(() => {
    load().catch((error) => {
      setQueues((current) => ({ ...current, loading: false }));
      setMessage(error.message);
    });
  }, []);

  async function act(pollId, action) {
    if (action === "reject" && !window.confirm("Reject this submission? It will stay in the recycle bin for 2 days.")) {
      return;
    }

    if (action === "unpublish" && !window.confirm("Unpublish this live poll? Voting will stop immediately. You can restore it for 7 days.")) {
      return;
    }

    setBusy(`${pollId}:${action}`);
    setMessage("");

    try {
      const response = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, action })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error === "trash_expired"
            ? "That recycle-bin item has already expired."
            : "Could not update that poll."
        );
      }

      setMessage(
        action === "publish"
          ? "Poll approved and published."
          : action === "reject"
            ? "Submission moved to the recycle bin for 2 days."
            : action === "unpublish"
              ? "Poll unpublished. It can be restored for 7 days."
              : "Poll restored."
      );

      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  if (auth.loading || queues.loading) {
    return <div className="admin-panel"><p className="poll-status">Checking admin access…</p></div>;
  }

  if (!auth.authenticated) {
    return <div className="admin-panel admin-gate">
      <h2>Admin login required</h2>
      <p>Login with the Battle.net account that has ForeverVote admin access.</p>
      <a className="button primary" href="/api/auth/login/battlenet">Login with Battle.net</a>
    </div>;
  }

  if (!auth.admin) {
    return <div className="admin-panel admin-gate">
      <h2>This account is not an admin yet</h2>
      <p>Your current Battle.net account ID is <code>{auth.user?.battlenetAccountId || "unknown"}</code>.</p>
      <p>Admin access can be granted through the ForeverVote admin allowlist.</p>
    </div>;
  }

  return <div className="admin-stack">
    {message && <p className="poll-status" role="status">{message}</p>}

    <AdminSection
      kicker="Admin moderation"
      title="Pending submissions"
      polls={queues.submissions}
      defaultOpen
      emptyTitle="Queue clear."
      emptyText="There are no poll submissions waiting for review."
      busy={busy}
      onAction={act}
      actions={[
        { value: "publish", label: "Approve & publish", busyLabel: "Publishing…", className: "button primary" },
        { value: "reject", label: "Reject", busyLabel: "Rejecting…", className: "button secondary danger-action" }
      ]}
    />

    <AdminSection
      kicker="Live management"
      title="Published polls"
      polls={queues.live}
      emptyTitle="No live polls."
      emptyText="Published polls will appear here."
      busy={busy}
      onAction={act}
      actions={[
        { value: "unpublish", label: "Unpublish", busyLabel: "Unpublishing…", className: "button secondary danger-action" }
      ]}
    />

    <AdminSection
      kicker="Recycle bin"
      title="Rejected submissions"
      polls={queues.rejected}
      emptyTitle="No rejected submissions."
      emptyText="Rejected submissions stay restorable here for 2 days."
      busy={busy}
      onAction={act}
      trashLabel="Rejected · kept for 2 days"
      expirySort
      actions={[
        { value: "restore", label: "Restore to pending", busyLabel: "Restoring…", className: "button secondary" }
      ]}
    />

    <AdminSection
      kicker="Recycle bin"
      title="Unpublished polls"
      polls={queues.unpublished}
      emptyTitle="No unpublished polls."
      emptyText="Unpublished polls stay restorable here for 7 days."
      busy={busy}
      onAction={act}
      trashLabel="Unpublished · kept for 7 days"
      expirySort
      actions={[
        { value: "restore", label: "Restore & republish", busyLabel: "Restoring…", className: "button primary" }
      ]}
    />
  </div>;
}
