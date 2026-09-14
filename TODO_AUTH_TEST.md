# Battle.net production smoke test

The OAuth/profile implementation is wired and has been exercised against Battle.net. Re-run this checklist after any production credential, callback, or auth change.

- [ ] Confirm the production Battle.net client secret is current and stored only in Vercel.
- [ ] Click Battle.net login on `https://www.forevervote.com`.
- [ ] Confirm the Blizzard consent screen opens for the expected application.
- [ ] Confirm the callback returns to ForeverVote.
- [ ] Confirm the header shows the BattleTag.
- [ ] Open `/api/auth/me` and confirm `authenticated: true`.
- [ ] Confirm at least one Classic namespace returns characters for an eligible test account.
- [ ] Confirm logout clears the session and `/api/auth/me` returns `authenticated: false`.

Do not paste OAuth secrets, access tokens, session cookies, or raw private character data into issues or chat.
