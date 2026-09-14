# Battle.net region notes

The current default is `eu`, matching the intended first tester location.

If login or profile checks fail for another region, set `BATTLENET_REGION` in Vercel Production to one of Blizzard's supported regional OAuth/API hosts and redeploy.

Profile namespace defaults are currently hardcoded for EU:

- `profile-eu`
- `profile-classic-eu`
- `profile-classic1x-eu`

If the project expands beyond EU, make namespace generation region-aware before launch.
