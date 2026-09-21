# Battle.net production smoke test

Re-run this checklist after any production credential, callback, or authentication change.

- [ ] Confirm the production Battle.net client secret is current and stored only in Vercel.
- [ ] Click Battle.net login on `https://www.forevervote.com`.
- [ ] Confirm the Blizzard consent screen opens for the expected application.
- [ ] Confirm the callback returns to ForeverVote.
- [ ] Confirm the header shows the BattleTag.
- [ ] Open `/api/auth/me` and confirm `authenticated: true`.
- [ ] Confirm the response contains the expected Battle.net-backed user and informational WoW profile checks.
- [ ] Confirm logout clears the session and `/api/auth/me` returns `authenticated: false`.

Participation eligibility is based on a valid Battle.net OAuth identity. WoW/Classic profile namespace checks are informational and are not the voting gate.

Do not paste OAuth secrets, access tokens, session cookies, or raw private character data into issues or chat.
