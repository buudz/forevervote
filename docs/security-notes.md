# Security notes

## Battle.net OAuth

- Client secret must live only in Vercel environment variables.
- OAuth token exchange happens server-side only.
- OAuth access tokens are not stored in the browser cookie.
- The browser session cookie is HttpOnly, SameSite=Lax, and signed with `SESSION_SECRET`.
- OAuth `state` is generated per login attempt and stored in a short-lived HttpOnly cookie.

## Current limitation

This implementation is for login/profile inspection only. It does not yet persist users to Supabase and it does not enable voting.

## Before enabling voting

- Confirm what Blizzard returns for retail and Classic profile namespaces.
- Decide the exact eligibility rule for voting.
- Persist the validated Battle.net identity server-side.
- Use the Supabase service role only from server routes.
- Never trust a user id, BattleTag, vote count, or eligibility flag sent by the browser.
