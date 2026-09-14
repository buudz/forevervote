# Environment variables

## Required for Battle.net login

| Name | Where | Notes |
| --- | --- | --- |
| `BATTLENET_CLIENT_ID` | Vercel Production | Battle.net OAuth app client id |
| `BATTLENET_CLIENT_SECRET` | Vercel Production | Battle.net OAuth app secret; never commit or paste publicly |
| `SESSION_SECRET` | Vercel Production | Random high-entropy string used to sign session cookies |

## Optional

| Name | Default | Notes |
| --- | --- | --- |
| `BATTLENET_REGION` | `eu` | OAuth/API region |
| `BATTLENET_LOCALE` | `en_GB` | Locale passed to WoW profile checks |
| `BATTLENET_REDIRECT_URI` | request origin + `/api/auth/callback/battlenet` | Use only if production needs a fixed callback override |
