# Login button behavior

Logged out users see `Battle.net login` in the header.

Logged in users see:

- BattleTag
- Classic/profile check label
- Logout link

The label is based on the sanitized `/api/auth/me` response, not client-side trust.
