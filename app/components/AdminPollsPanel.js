"use client";

import { useEffect, useState } from "react";

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

function PollAdminCard({ poll, actions, busy, onAction, trashLabel = "" }) {
  return <article className="moderation-card">
    <div className="card-top">
      <span className="category">{poll.category}</span>
      <span className="draft">
        {poll.creatorBattleTag}
        {poll.totalVotes > 0 ? ` · ${poll.totalVotes} votes` : ""}
      </span>
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

function AdminSection({ kicker, title, count, emptyTitle, emptyText, children }) {
  return <section className="admin-section-block">
    <div className="form-heading">
      <div>
        <p className="kicker">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <span className="count-badge">{count}</span>
    </div>
    {count === 0
      ? <div className="admin-empty">
          <strong>{emptyTitle}</strong>
          <span>{emptyText}</span>
        </div>
      : children}
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
      count={queues.submissions.length}
      emptyTitle="Queue clear."
      emptyText="There are no poll submissions waiting for review."
    >
      <div className="moderation-list">
        {queues.submissions.map((poll) => <PollAdminCard
          key={poll.id}
          poll={poll}
          busy={busy}
          onAction={act}
          actions={[
            { value: "publish", label: "Approve & publish", busyLabel: "Publishing…", className: "button primary" },
            { value: "reject", label: "Reject", busyLabel: "Rejecting…", className: "button secondary danger-action" }
          ]}
        />)}
      </div>
    </AdminSection>

    <AdminSection
      kicker="Live management"
      title="Published polls"
      count={queues.live.length}
      emptyTitle="No live polls."
      emptyText="Published polls will appear here."
    >
      <div className="moderation-list">
        {queues.live.map((poll) => <PollAdminCard
          key={poll.id}
          poll={poll}
          busy={busy}
          onAction={act}
          actions={[
            { value: "unpublish", label: "Unpublish", busyLabel: "Unpublishing…", className: "button secondary danger-action" }
          ]}
        />)}
      </div>
    </AdminSection>

    <AdminSection
      kicker="Recycle bin"
      title="Rejected submissions"
      count={queues.rejected.length}
      emptyTitle="No rejected submissions."
      emptyText="Rejected submissions stay restorable here for 2 days."
    >
      <div className="moderation-list">
        {queues.rejected.map((poll) => <PollAdminCard
          key={poll.id}
          poll={poll}
          busy={busy}
          onAction={act}
          trashLabel="Rejected · kept for 2 days"
          actions={[
            { value: "restore", label: "Restore to pending", busyLabel: "Restoring…", className: "button secondary" }
          ]}
        />)}
      </div>
    </AdminSection>

    <AdminSection
      kicker="Recycle bin"
      title="Unpublished polls"
      count={queues.unpublished.length}
      emptyTitle="No unpublished polls."
      emptyText="Unpublished polls stay restorable here for 7 days."
    >
      <div className="moderation-list">
        {queues.unpublished.map((poll) => <PollAdminCard
          key={poll.id}
          poll={poll}
          busy={busy}
          onAction={act}
          trashLabel="Unpublished · kept for 7 days"
          actions={[
            { value: "restore", label: "Restore & republish", busyLabel: "Restoring…", className: "button primary" }
          ]}
        />)}
      </div>
    </AdminSection>
  </div>;
}
