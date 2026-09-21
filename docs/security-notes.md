# Security notes

## Battle.net OAuth

- The Battle.net client secret lives only in server-side environment variables.
- OAuth token exchange happens server-side only.
- OAuth access tokens are not stored in the browser session.
- The browser session cookie is HttpOnly, SameSite=Lax, Secure in production, signed with `SESSION_SECRET`, and expires after seven days.
- OAuth `state` is generated per login attempt and stored in a short-lived HttpOnly cookie.
- The callback derives a stable Battle.net account ID from Blizzard userinfo.
- WoW profile namespace checks are informational; participation eligibility is based on a valid Battle.net OAuth identity.

## Voting

- The browser never supplies its own ForeverVote user ID.
- A signed session must contain a Battle.net account ID before a vote mutation proceeds.
- State-changing poll/profile/admin endpoints use same-origin checks in addition to SameSite cookies.
- The server upserts the Battle.net-backed user using the service-role credential.
- Database constraints enforce valid user/poll/option relationships and vote uniqueness rules.
- Browser database roles have RLS enabled and no direct application-table access.
- The Supabase service-role key is used only from server code.

## Admin access

- Admin API access requires an explicitly authorized Battle.net account or a configured bearer token.
- Admin endpoints are no-store.
- Poll copy/answer changes are recorded in the public edit-history system.

## Database function exposure

Application RPCs and privileged helpers are not executable by `anon`, `authenticated`, or `PUBLIC` unless intentionally granted. Internal `SECURITY DEFINER` trigger functions have explicit execute revocations, and default public function execution is revoked for future functions created in the public schema.

## Launch hygiene

Before broad public promotion:

- rotate any credential that has ever been pasted outside its intended secret store;
- confirm all production environment variables are scoped correctly;
- re-run OAuth and voting smoke tests;
- verify the latest GitHub build is green;
- review Supabase security advisors;
- keep the privacy/support contact and deletion-request process current;
- avoid adding analytics, trackers, comments, or other data collection without updating the privacy/compliance baseline.
