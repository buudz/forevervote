# ForeverVote production voting smoke test

The database schema, vote integrity constraints, API routes, and UI voting path are implemented. Re-run this checklist after database, environment, or voting changes.

- [ ] Confirm Vercel Production has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Confirm all checked-in Supabase migrations have been applied.
- [ ] Visit `/api/polls` and confirm `databaseReady: true` and the expected open polls.
- [ ] Log in with an eligible Battle.net / Classic profile.
- [ ] Cast one vote and refresh; confirm the selected option remains marked.
- [ ] Change the vote; confirm it updates rather than creating a second vote.
- [ ] Confirm a logged-out request to the vote endpoint is rejected.
- [ ] Confirm a non-Classic session is rejected.
- [ ] Confirm `/api/admin/stats` is inaccessible without configured admin authorization.
- [ ] Confirm admin stats show zero duplicate vote groups.

Voting remains limited to signed-in sessions with `hasClassicProfile: true`. Database constraints also enforce one vote per user per poll, option/poll consistency, verified users, and open-poll status.
