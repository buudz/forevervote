# Auth test checklist

After deployment:

- [ ] Click Battle.net login.
- [ ] Confirm Blizzard consent screen opens.
- [ ] Confirm callback returns to ForeverVote.
- [ ] Confirm header shows BattleTag.
- [ ] Open `/api/auth/me`.
- [ ] Record which namespaces return character counts.
- [ ] Decide the Classic-only eligibility rule before enabling voting.

Do not paste OAuth secrets, access tokens, or raw private character data into issues or chat.
