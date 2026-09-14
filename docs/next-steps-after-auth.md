# Next steps after auth test

1. Confirm login works on production domain.
2. Inspect `/api/auth/me` after logging in.
3. Decide whether `hasClassicProfile` is reliable enough for launch.
4. Add Supabase server client using service-role key in server-only code.
5. Upsert Battle.net user after callback.
6. Seed launch polls from `app/data/polls.js` into Supabase.
7. Replace static poll cards with database-backed poll cards.
8. Enable vote submission only for authenticated and eligible users.
9. Add public results from counted vote rows, not cached counters.
