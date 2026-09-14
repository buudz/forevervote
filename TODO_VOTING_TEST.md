# ForeverVote voting rollout checklist

Before testing live voting in production:

1. Add Vercel Production env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Run `supabase/migrations/20260914000200_seed_current_polls.sql` in Supabase after the original foundation migration.
3. Redeploy the current production commit if env vars were added after deployment.
4. Log in with Battle.net.
5. Visit `/api/polls` and confirm it returns `databaseReady: true` and six open polls.
6. Click a poll option on the homepage.
7. Refresh and confirm the selected vote is still marked.
8. Click the other option and confirm the vote changes instead of creating a duplicate.

Voting remains limited to logged-in sessions with `hasClassicProfile: true`.
