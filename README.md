# ForeverVote

ForeverVote is an independent World of Warcraft: Forever community voting hub. The production application is available at https://www.forevervote.com.

This repository is published so the community can inspect how authentication, voting, moderation, and vote-integrity protections work.

## Trust model

ForeverVote uses Battle.net OAuth to establish a stable Battle.net account identity. The browser never chooses its own ForeverVote user ID. Authentication is handled by the Next.js server, and production secrets stay in deployment environment variables.

Votes and polls are stored in Supabase. Browser roles do not receive direct table access; server routes use the server-only service-role credential after validating the signed ForeverVote session. Database constraints and triggers provide a second layer of integrity checks.

The live site exposes its Vercel Git commit in the footer and at `/api/version`, allowing visitors to compare the deployed build with the public source.

For the detailed boundary and limitations, see [docs/public-security-model.md](docs/public-security-model.md).

## What the system can and cannot prove

ForeverVote is designed to make automated or casual duplicate voting harder by tying participation to a Battle.net identity and enforcing vote constraints server-side and in the database.

It does **not** claim that one Battle.net account always equals one human, that every World of Warcraft player is represented, or that poll results are scientifically representative of the entire player base.

## Current features

- Battle.net OAuth sign-in.
- Battle.net-backed participant identities.
- Supabase-backed polls, votes, profiles, and reputation.
- Single- and multi-answer polls.
- Server-side input validation and database vote-integrity checks.
- Community poll submissions and admin moderation.
- Public edit history for moderated poll changes.
- Creator context updates with vote snapshots.
- Honor/reputation progression.
- Public share cards and profile pages.

## Data stored

The MVP stores only data needed to operate the community voting system, including:

- stable Battle.net account ID;
- BattleTag;
- verification timestamp/status;
- poll submissions and creator updates;
- votes;
- reputation events;
- basic database timestamps;
- account display/filter preferences.

OAuth access tokens are used server-side during login and are not stored in the browser session.

See [docs/compliance-baseline.md](docs/compliance-baseline.md) for the current privacy baseline.

## Development

Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```

Copy `.env.example` and provide the required Battle.net OAuth and Supabase environment variables. Never commit real credentials.

## Deployment

Production is deployed through Vercel from this repository. The production branch is `main`. The site reports the Vercel-provided commit SHA so the deployed build can be traced back to GitHub.

## Security

Please do not open a public issue for an exploitable vulnerability or exposed credential. See [SECURITY.md](SECURITY.md) for responsible disclosure.

The database is intentionally configured with RLS enabled and no browser policies/direct grants for application tables. Server-side access uses the service role after application-level authorization. Supabase security-advisor findings are reviewed as part of public-readiness work.

## Source visibility and reuse

The source is published for transparency and community review. No software reuse license is currently granted by this repository. Unless a license is added later, normal copyright rules apply.

## Disclaimer

ForeverVote is an independent community fan project. It is not affiliated with, authorized by, maintained by, sponsored by, or endorsed by Blizzard Entertainment, Inc. World of Warcraft, Warcraft, Battle.net, Blizzard, and related names and marks are the property of their respective owners.
