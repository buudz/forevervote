# Auth routes

These routes implement the first Battle.net OAuth test flow.

They are intentionally separate from voting. Voting should only be connected after the real WoW profile response is inspected and the eligibility rule is decided.

- `login/battlenet/route.js`: creates OAuth state and redirects to Battle.net.
- `callback/battlenet/route.js`: validates state, exchanges code, reads userinfo, checks WoW profile namespaces, and creates a signed session.
- `logout/route.js`: clears the session cookie.
- `me/route.js`: returns sanitized session info for the header and manual debugging.
