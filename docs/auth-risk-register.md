# Auth risk register

## Known risks before voting launch

- Battle.net profile namespaces may not identify Classic-only eligibility reliably.
- New or inactive characters may not appear immediately in profile responses.
- Regional accounts may need a different `BATTLENET_REGION` than `eu`.
- Cookie sessions are currently browser-only and not persisted to Supabase.

## Mitigation

- Test with real accounts before enabling voting.
- Persist validated identities server-side before vote writes.
- Keep Supabase browser access locked down.
- Keep access tokens out of cookies and frontend responses.
