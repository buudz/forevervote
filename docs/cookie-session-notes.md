# Cookie session notes

Current session behavior:

- Cookie name: `fv_session`
- Signed with `SESSION_SECRET`
- HttpOnly
- SameSite=Lax
- Secure in production
- Seven day max age

The cookie stores sanitized account/profile-check data only. OAuth access tokens are not stored in the cookie.

When Supabase user persistence is added, the cookie should store only the minimum session identity needed to look up the server-side user.
