# Security Policy

ForeverVote welcomes responsible security reports.

## Reporting a vulnerability

Please email **WowForeverVote@gmail.com** with the subject **ForeverVote security report**.

Do not open a public GitHub issue for:

- an exploitable vulnerability;
- an exposed credential or token;
- a method for bypassing authentication, admin authorization, or vote-integrity controls;
- a privacy issue involving another user's data.

Please include the affected URL or component, clear reproduction steps, the impact you observed, and any suggested mitigation. Screenshots or minimal proof-of-concept details are helpful when they do not expose other users' data.

## Testing boundaries

Please avoid destructive testing, denial-of-service traffic, automated spam, accessing data that is not yours, or changing another user's votes/content. Use your own account and the minimum requests needed to demonstrate the issue.

## Scope

The primary production service is:

- https://www.forevervote.com

The public source repository is:

- https://github.com/buudz/forevervote

Third-party services such as Battle.net, Vercel, GitHub, and Supabase are governed by their own security programs. Reports about ForeverVote's configuration or use of those services are still welcome.

## Disclosure

Please give the project a reasonable opportunity to investigate and fix a reported issue before publishing exploit details.

ForeverVote does not currently operate a paid bug-bounty program.
