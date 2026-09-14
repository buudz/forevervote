# Auth architecture

Current flow:

1. Browser clicks `/api/auth/login/battlenet`.
2. Server creates a random OAuth state and redirects to Battle.net.
3. Battle.net redirects to `/api/auth/callback/battlenet` with a code.
4. Server validates state.
5. Server exchanges the code for a token using the client secret.
6. Server fetches Battle.net userinfo.
7. Server checks WoW account-profile namespaces.
8. Server sets a signed HttpOnly cookie with sanitized account/profile-check data.
9. Header reads `/api/auth/me` and displays login state.

Current non-goals:

- No Supabase user persistence yet.
- No voting writes yet.
- No raw OAuth tokens exposed to the browser.
- No final Classic-only eligibility enforcement yet.
