# Classic eligibility notes

The current auth branch checks these namespaces after Battle.net login:

- `profile-eu`
- `profile-classic-eu`
- `profile-classic1x-eu`

The result is intentionally summarized instead of storing raw character data in the cookie.

## What we need to verify

- Whether `profile-classic-eu` returns Classic progression / seasonal characters for a logged-in account.
- Whether `profile-classic1x-eu` returns Classic Era or Hardcore characters.
- Whether accounts with only retail WoW return no Classic namespace characters.
- Whether new or inactive characters are hidden from account profile responses.

## Temporary rule

Do not enforce Classic-only voting yet. The current UI only reports whether a Classic profile was found.
