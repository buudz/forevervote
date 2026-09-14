# Battle.net OAuth test plan

This is the first safe pass for Battle.net login. It does not connect voting yet.

## Environment variables required in Vercel Production

- `BATTLENET_CLIENT_ID`
- `BATTLENET_CLIENT_SECRET`
- `SESSION_SECRET`

Optional later:

- `BATTLENET_REGION` defaults to `eu`
- `BATTLENET_LOCALE` defaults to `en_GB`
- `BATTLENET_REDIRECT_URI` defaults to the request origin plus `/api/auth/callback/battlenet`

## Routes added

- `/api/auth/login/battlenet` redirects to Battle.net OAuth.
- `/api/auth/callback/battlenet` validates OAuth state, exchanges the code server-side, fetches userinfo, checks WoW profile namespaces, and sets a signed HttpOnly cookie.
- `/api/auth/logout` clears the session cookie.
- `/api/auth/me` returns sanitized auth state for the frontend.

## What `/api/auth/me` may return

Authenticated response contains:

- `user.battlenetAccountId`
- `user.battletag`
- `wowProfile.region`
- `wowProfile.locale`
- `wowProfile.hasAnyWowProfile`
- `wowProfile.hasClassicProfile`
- `wowProfile.checks[]` with namespace, status, account count, character count, and non-sensitive error fields

It intentionally does not expose OAuth access tokens or refresh tokens.

## Manual test

1. Deploy the PR to production or merge after CI passes.
2. Open `https://www.forevervote.com`.
3. Click `Battle.net login`.
4. Approve the requested scopes.
5. Confirm you land back on ForeverVote.
6. Confirm the header shows your BattleTag.
7. Open `https://www.forevervote.com/api/auth/me` and inspect the sanitized namespace checks.

## Next decision

After testing, decide whether Classic-only eligibility can rely on Blizzard profile namespaces. Do not connect real voting until that is confirmed.
