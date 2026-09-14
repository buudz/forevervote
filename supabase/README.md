# ForeverVote database

The polling_foundation migration has been applied to the ForeverVote Supabase project. The rollback-only SQL tests passed against that project. Run tests/polling_foundation.sql in the SQL editor to repeat; all test data is rolled back.

## Access model

All four tables have RLS enabled, with no browser policies and no grants for anon or authenticated. This intentionally denies direct client access. The service_role has server-only access and bypasses RLS. Never expose its key. Supabase's informational `rls_enabled_no_policy` notices are expected for this design: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Future server actions must validate the session, derive user_id from the stable Battle.net identity, validate input and enforce rate limits. Database guards supplement these checks; they cannot establish that a service-role caller supplied the authenticated user's identity. Only a trusted OAuth callback may create or update identity and verification fields. Blizzard's current OAuth/profile behavior has NOT yet been verified. The text identity column does not assume a specific identifier format.

Create polls as drafts, add 2–5 options, then publish within one transaction. Never offer a return-to-draft action for published polls. Count vote rows for results; do not expose private users/votes to browsers. Keep published question wording and options immutable in public APIs. Changes of opinion update the existing vote row. Add rate limiting and server authorization before enabling voting.

## Remaining

- Verify current Blizzard OAuth and profile documentation and eligibility limitations.
- Configure callback, server-only secrets, sessions and WoW verification.
- Implement atomic poll creation with rate limiting and server-derived creator identity.
- Implement voting/results with server-derived voter identity and rate limits.
- Integration and concurrent-request tests before opening real voting.
- Seed the six approved launch polls with a genuine verified creator; no synthetic users or votes.
