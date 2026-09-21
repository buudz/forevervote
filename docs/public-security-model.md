# ForeverVote public security model

This document explains what community members can verify from the public source and where the system's trust boundaries remain.

## Request path

1. A visitor signs in through Battle.net OAuth.
2. ForeverVote validates OAuth state and exchanges the authorization code server-side.
3. Blizzard userinfo supplies the stable Battle.net account identity used by ForeverVote.
4. ForeverVote creates a signed HttpOnly session cookie. OAuth access tokens are not stored in that browser session.
5. Poll, profile, and admin requests are handled by Next.js server routes.
6. Those routes derive the ForeverVote user from the signed Battle.net-backed session.
7. Server-side database requests use a Supabase service-role credential that is never sent to the browser.
8. PostgreSQL constraints, triggers, and RPC validation provide database-level integrity checks.

## Database access boundary

ForeverVote intentionally does not expose application tables directly to browser database roles.

Application tables use RLS, and `anon` / `authenticated` do not receive direct application-table privileges. The Next.js server is the application authorization boundary; it uses the service role only after validating the request/session.

Privileged PostgreSQL functions are explicitly denied to `PUBLIC`, `anon`, and `authenticated` unless a function is intentionally part of the server-only RPC surface.

## Vote integrity

The application does not accept a user ID supplied by the browser. A vote is associated with the ForeverVote user resolved from the signed Battle.net session.

The database additionally checks relationships such as:

- the voter exists;
- the poll exists and is in a votable state;
- selected options belong to the target poll;
- vote uniqueness rules for the poll mode.

Changing an opinion updates/replaces the authenticated user's stored choice according to the poll mode rather than incrementing a client-controlled counter.

## Admin integrity

Admin access is based on explicitly authorized Battle.net identities and/or a server-only admin bearer token.

Moderation actions are performed through protected server routes. Poll copy and answer edits are recorded in edit history so community members can see that a live poll was changed.

## Deployment traceability

The production site is deployed from this repository through Vercel.

When Vercel provides `VERCEL_GIT_COMMIT_SHA`, ForeverVote displays the short commit in the site footer and exposes the full SHA at `/api/version`. Visitors can open that GitHub commit and compare it with the source running in production.

This improves transparency, but it is not a cryptographic remote-attestation system. It relies on the deployment platform's supplied build metadata and the repository/deployment configuration controlled by the project owner.

## Secrets

The repository contains variable names and example configuration only. Production values for the Battle.net client secret, ForeverVote session secret, Supabase service role, and optional admin token belong in deployment secret storage and must never be committed.

Any credential known to have been pasted into chat, an issue, a log, or another unintended location should be rotated before the repository is made public.

## Privacy and representation limitations

ForeverVote can enforce rules around a stable Battle.net-backed account identity. It cannot prove that each Battle.net account maps to a unique human.

Poll participants are self-selected ForeverVote users. Results should be described as ForeverVote community sentiment, not as a statistically representative measurement of every World of Warcraft player.

## Review date

This document reflects the public-readiness review performed on 22 September 2026.
