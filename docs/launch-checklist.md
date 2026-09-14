# ForeverVote launch checklist

## Code and build

- [x] ForeverVote branding and approved logo are committed.
- [x] Responsive homepage and poll UI are implemented.
- [x] Battle.net OAuth routes are implemented.
- [x] Classic profile eligibility check is implemented.
- [x] Supabase-backed poll loading and voting are implemented.
- [x] Database vote-integrity constraints and tests are checked in.
- [x] Protected admin stats endpoint is implemented.
- [x] GitHub Actions builds `main` on push.
- [x] Basic security response headers are configured.

## Production configuration

- [ ] Confirm `BATTLENET_CLIENT_ID`, `BATTLENET_CLIENT_SECRET`, and `SESSION_SECRET` in Vercel Production.
- [ ] Confirm the Battle.net client secret has been rotated if it was ever exposed outside the intended secret store.
- [ ] Confirm `BATTLENET_REDIRECT_URI=https://www.forevervote.com/api/auth/callback/battlenet`.
- [ ] Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production.
- [ ] Confirm all Supabase migrations in `supabase/migrations` are applied.
- [ ] Confirm the custom domain resolves to the intended production deployment.

## Production smoke test

- [ ] Complete `TODO_AUTH_TEST.md`.
- [ ] Complete `TODO_VOTING_TEST.md`.
- [ ] Check the homepage on desktop and mobile widths.
- [ ] Verify the approved logo loads without fallback/broken-image state.
- [ ] Verify share links copy the production URL.
- [ ] Verify the Blizzard disclaimer is visible in About and the footer.

## Before broad promotion

- [ ] Configure a real privacy/support contact.
- [ ] Decide and document the account/vote deletion process.
- [ ] Keep analytics and non-essential cookies off until the privacy setup is intentionally expanded.

This checklist separates what is already ready in GitHub from what can only be verified against the production Vercel/Blizzard/Supabase configuration.
