# ForeverVote

ForeverVote is an independent World of Warcraft: Forever community voting hub.

## Current state

The app includes:

- Battle.net OAuth sign-in.
- WoW profile checks, including Classic profile eligibility.
- Supabase-backed polls and vote storage.
- One stable Battle.net identity per voter.
- One vote per poll; changing a choice updates the existing vote.
- Server-side poll/option validation and vote-integrity protections.
- Six launch polls with category filtering and share links.
- A restrained fantasy visual system built around the ForeverVote brand.

## Development

Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

The approved ForeverVote logo is reconstructed from the checked-in optimized asset chunks before development and production builds.

Production build:

```sh
npm run build
```

## Configuration

Copy `.env.example` and provide the required Battle.net OAuth and Supabase environment variables. Keep client secrets and service-role credentials server-side.

## Deployment

The production site is deployed from this repository through Vercel. Pushes to the production branch trigger a new deployment.

## Project status

Battle.net authentication, Classic profile checks, the poll database, and the voting path are implemented. Continue testing the complete production flow, rate limits, failure states, and eligibility behavior before promoting the site broadly.

## Disclaimer

ForeverVote is an independent community fan project. It is not affiliated with, authorized by, maintained by, sponsored by, or endorsed by Blizzard Entertainment, Inc. World of Warcraft, Warcraft, Battle.net, Blizzard, and related names and marks are the property of their respective owners.
