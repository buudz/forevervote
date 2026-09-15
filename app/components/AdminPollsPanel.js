"use client";

import { useEffect, useState } from "react";

export function AdminPollsPanel() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, admin: false });
  const [queue, setQueue] = useState({ loading: true, submissions: [] });
  const [message, setMessage] = useState("");
  const [moderating, setModerating] = useState("");

  async function load() {
    const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const authData = await authResponse.json().catch(() => ({}));
    setAuth({ loading: false, ...authData });

    if (!authData.admin) {
      setQueue({ loading: false, submissions: [] });
      return;
    }

    const response = await fetch("/api/admin/polls", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      throw new Error("Could not load the moderation queue.");
    }

    setQueue({ loading: false, submissions: data.submissions || [] });
  }

  useEffect(() => {
    load().catch((error) => {
      setQueue({ loading: false, submissions: [] });
      setMessage(error.message);
    });
  }, []);

  async function moderate(pollId, action) {
    if (action === "reject" && !window.confirm("Reject this submission? It will be hidden and will not go live.")) {
      return;
    }

    setModerating(`${pollId}:${action}`);
    setMessage("");

    try {
      const response = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, action })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error("Could not update that submission.");
      }

      setQueue((current) => ({
        ...current,
        submissions: current.submissions.filter((poll) => poll.id !== pollId)
      }));
      setMessage(action === "publish" ? "Poll approved and published." : "Submission rejected.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setModerating("");
    }
  }

  if (auth.loading || queue.loading) {
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
      <p>If you just changed the Vercel admin environment variable, a new production deployment is required before that value is available to the app.</p>
    </div>;
  }

  return <div className="admin-panel">
    <div className="form-heading">
      <div>
        <p className="kicker">Admin moderation</p>
        <h2>Pending submissions</h2>
      </div>
      <span className="count-badge">{queue.submissions.length} pending</span>
    </div>

    {message && <p className="poll-status" role="status">{message}</p>}

    {queue.submissions.length === 0
      ? <div className="admin-empty">
          <strong>Queue clear.</strong>
          <span>There are no poll submissions waiting for review.</span>
        </div>
      : <div className="moderation-list">
          {queue.submissions.map((poll) => <article className="moderation-card" key={poll.id}>
            <div className="card-top">
              <span className="category">{poll.category}</span>
              <span className="draft">{poll.creatorBattleTag} · {new Date(poll.createdAt).toLocaleDateString()}</span>
            </div>
            <h3>{poll.title}</h3>
            {poll.rationale && <p className="context">{poll.rationale}</p>}
            <div className="moderation-options">
              {poll.options.map((option) => <span key={option.id}>{option.text}</span>)}
            </div>
            <div className="moderation-actions">
              <button
                className="button primary"
                type="button"
                disabled={Boolean(moderating)}
                onClick={() => moderate(poll.id, "publish")}
              >
                {moderating === `${poll.id}:publish` ? "Publishing…" : "Approve & publish"}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={Boolean(moderating)}
                onClick={() => moderate(poll.id, "reject")}
              >
                {moderating === `${poll.id}:reject` ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </article>)}
        </div>}
  </div>;
}
