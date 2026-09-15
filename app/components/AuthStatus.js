"use client";

import { useEffect, useState } from "react";

export function AuthStatus() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, admin: false });

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

  if (auth.loading) {
    return <span className="login-placeholder auth-loading">Checking login…</span>;
  }

  if (!auth.authenticated) {
    return <a className="login-placeholder auth-login" href="/api/auth/login/battlenet">Battle.net login</a>;
  }

  const hasClassicProfile = Boolean(auth.wowProfile?.hasClassicProfile);
  const verifiedLabel = hasClassicProfile ? "Classic profile found" : "Profile check pending";

  return <div className="auth-status" aria-label="Battle.net account status">
    {auth.admin && <a className="auth-admin" href="/admin">Admin</a>}
    <a className="auth-user" href="/profile" aria-label="Open your ForeverVote profile">
      <strong>{auth.user?.battletag || "Battle.net user"}</strong>
      <small>{verifiedLabel}</small>
    </a>
    <a className="auth-logout" href="/api/auth/logout">Logout</a>
  </div>;
}
