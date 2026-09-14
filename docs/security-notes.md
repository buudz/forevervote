# Security notes

## Battle.net OAuth

- Client secret lives only in server-side environment variables.
- OAuth token exchange happens server-side only.
- OAuth access tokens are not stored in the browser session.
- The browser session cookie is HttpOnly, SameSite=Lax, Secure in production, signed with `SESSION_SECRET`, and expires after seven days.
- OAuth `state` is generated per login attempt and stored in a short-lived HttpOnly cookie.
- The callback derives the stable Battle.net account ID and WoW profile eligibility from Blizzard responses.
- Retail and Classic profile namespaces are derived from the configured Battle.net region.

## Voting

- The browser never supplies its own ForeverVote user ID.
- A signed session must contain a Battle.net account ID and Classic eligibility before the vote route proceeds.
- The server upserts the Battle.net-backed user using the service-role credential.
- The database enforces one vote per user per poll.
- The database foreign key enforces that the selected option belongs to the poll.
- Database triggers reject votes by unverified users and reject voting on non-open polls.
- Browser database roles have RLS enabled and no direct table privileges.
- The Supabase service-role key is used only from server code.

## Admin access

- Admin stats require either a configured bearer token or an explicitly allow-listed Battle.net account ID.
- The admin endpoint is no-store and returns no raw Battle.net account identifiers.

## Launch hygiene

Before a broad public launch:

- confirm the Battle.net client secret and `SESSION_SECRET` are current and private;
- confirm all production environment variables are scoped correctly;
- re-run the OAuth and voting smoke-test checklists;
- verify the latest GitHub build is green;
- configure a privacy/support contact and a deletion-request process;
- avoid adding analytics, trackers, comments, or other data collection without updating the privacy/compliance baseline.
