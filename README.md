# VoteForever

Independent World of Warcraft community polling project.

## Current milestone
Next.js landing page with proposed launch polls. Authentication, database, poll creation and voting are not implemented yet. No votes are collected or simulated.

## Development
Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

Production build: `npm run build`.

## Deploy
Import this repository at https://vercel.com/new, select the Next.js preset and deploy. No environment variables are needed for this landing page.

## Next milestone
Verify current Blizzard OAuth and WoW profile documentation before implementing authentication. Enforce one stable Battle.net identity per user, verified WoW profile eligibility, and UNIQUE(poll_id, user_id) in PostgreSQL. Vote changes must update the existing row. Enforce option/poll consistency, authorization and rate limits server-side. Keep all credentials server-side.

Independent community project. Not affiliated with or endorsed by Blizzard Entertainment.
