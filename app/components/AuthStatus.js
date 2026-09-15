"use client";

import { useEffect, useState } from "react";

export function AuthStatus() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, admin: false });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setAuth({ loading: false, ...data });
        }
      })
      .catch(() => {
        if (active) {
          setAuth({ loading: false, authenticated: false, admin: false });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!auth.admin) {
      setPendingCount(0);
      return undefined;
    }

    let active = true;

    async function refreshPendingCount() {
      try {
        const response = await fetch("/api/admin/pending-count", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (active && response.ok && data.ok) {
          setPendingCount(Number(data.pendingCount || 0));
        }
      } catch {
        // Keep the last known count if the lightweight notification check fails.
      }
    }

    refreshPendingCount();
    const intervalId = window.setInterval(refreshPendingCount, 60_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refreshPendingCount();
      }
    }

    window.addEventListener("focus", refreshPendingCount);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshPendingCount);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [auth.admin]);

  if (auth.loading) {
    return <span className="login-placeholder auth-loading">Checking login…</span>;
  }

  if (!auth.authenticated) {
    return <a className="login-placeholder auth-login" href="/api/auth/login/battlenet">Battle.net login</a>;
  }

  const hasClassicProfile = Boolean(auth.wowProfile?.hasClassicProfile);
  const verifiedLabel = hasClassicProfile ? "Classic profile found" : "Profile check pending";

  return <div className="auth-status" aria-label="Battle.net account status">
    {auth.admin && <>
      <a className="auth-admin" href="/admin">Admin</a>
      <a
        className={pendingCount > 0 ? "admin-notification has-pending" : "admin-notification"}
        href="/admin#pending-submissions"
        aria-label={pendingCount > 0
          ? `${pendingCount} pending poll proposal${pendingCount === 1 ? "" : "s"} awaiting review`
          : "No pending poll proposals"}
        title={pendingCount > 0
          ? `${pendingCount} proposal${pendingCount === 1 ? "" : "s"} awaiting review`
          : "No proposals awaiting review"}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {pendingCount > 0 && <span className="admin-notification-count" aria-hidden="true">
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>}
      </a>
    </>}
    <a className="auth-user" href="/profile" aria-label="Open your ForeverVote profile">
      <strong>{auth.user?.battletag || "Battle.net user"}</strong>
      <small>{verifiedLabel}</small>
    </a>
    <a className="auth-logout" href="/api/auth/logout">Logout</a>
  </div>;
}
