# Profile check output

`/api/auth/me` returns summarized namespace checks after login.

Example shape:

```json
{
  "authenticated": true,
  "user": {
    "battlenetAccountId": "123456789",
    "battletag": "Name#1234"
  },
  "wowProfile": {
    "region": "eu",
    "locale": "en_GB",
    "hasAnyWowProfile": true,
    "hasClassicProfile": true,
    "checks": [
      {
        "namespace": "profile-classic1x-eu",
        "ok": true,
        "status": 200,
        "wowAccountCount": 1,
        "characterCount": 3,
        "errorCode": null,
        "errorDetail": null
      }
    ]
  }
}
```

Do not paste raw access tokens or raw Blizzard responses publicly.
