# ForeverVote compliance baseline

This is a product checklist, not legal advice.

## Current MVP data

ForeverVote currently stores only what is needed to run verified community voting:

- Battle.net account ID
- BattleTag
- whether the account passed the WoW/Classic profile check
- verification timestamp
- votes on polls
- basic database timestamps
- necessary login/session cookies

No analytics, ads, tracking pixels, marketing emails, public comments, or private messages are part of the current MVP.

## Cookies

The current session/state cookies are necessary for login, CSRF/state validation, and keeping a user signed in. Do not add a cookie banner unless non-essential cookies or trackers are added later.

If analytics is added later, prefer a privacy-friendly setup first. If any non-essential analytics, advertising, remarketing, embedded social trackers, or fingerprinting are added, add cookie consent before those tools run.

## User deletion / privacy contact

Before a public launch, add one calm privacy contact in the About or Privacy section, for example:

`privacy@forevervote.com`

Users should be able to ask for access, correction, or deletion of their stored Battle.net identity and votes. Deleting a user should either remove their votes or anonymize them, depending on the final privacy policy choice.

## Blizzard disclaimer

Keep one clear disclaimer in the About section. Avoid repeating it everywhere unless legal review says otherwise.

Suggested wording:

`ForeverVote is an independent community fan project and is not affiliated with, sponsored by, or endorsed by Blizzard Entertainment.`

## Comments decision

Do not add comments to the MVP by default.

Comments may increase activity, but they also require moderation tools, abuse reporting, spam handling, deletion workflows, and a clearer privacy/content policy. A lighter alternative is to allow one short rationale when a user submits a poll proposal, while keeping voting pages clean.
