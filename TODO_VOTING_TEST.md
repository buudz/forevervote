# ForeverVote production voting smoke test

The database schema, vote-integrity constraints, API routes, and UI voting path are implemented. Re-run this checklist after database, environment, auth, or voting changes.

- [ ] Confirm Vercel Production has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Confirm all checked-in Supabase migrations have been applied.
- [ ] Visit `/api/polls` and confirm the database is ready and expected open polls load.
- [ ] Log in with a Battle.net account.
- [ ] Cast one vote and refresh; confirm the selected option remains marked.
- [ ] Change the vote; confirm it updates according to the poll's voting mode rather than creating an invalid duplicate.
- [ ] Confirm a logged-out request to the vote endpoint is rejected.
- [ ] Confirm a cross-origin vote mutation is rejected.
- [ ] Confirm `/api/admin/stats` is inaccessible without configured admin authorization.
- [ ] Confirm admin stats show zero duplicate vote groups where uniqueness rules require that.
- [ ] Confirm `/api/version` exposes the production commit metadata when Vercel provides it.

Voting is limited to signed-in Battle.net-backed ForeverVote users. Database constraints also enforce option/poll consistency, valid users, and poll-state rules.
