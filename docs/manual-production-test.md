# Manual production test

Use this after the PR is merged and Vercel reports success.

## Login

- Visit `https://www.forevervote.com`.
- Click `Battle.net login`.
- Approve on Battle.net.
- Confirm you return to ForeverVote.
- Confirm the header shows your BattleTag.

## Debug endpoint

- Visit `https://www.forevervote.com/api/auth/me`.
- Confirm `authenticated` is `true`.
- Confirm `user.battletag` is present.
- Confirm `wowProfile.checks` includes retail and Classic namespace checks.

## Logout

- Click `Logout`.
- Confirm the header returns to `Battle.net login`.
- Confirm `/api/auth/me` says `authenticated: false`.
