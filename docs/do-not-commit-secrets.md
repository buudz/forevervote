# Do not commit secrets

Never commit or paste:

- Battle.net client secret
- Supabase service role key
- OAuth access tokens
- Session secret
- Raw OAuth callback URLs containing authorization codes

Secrets belong in Vercel environment variables only.
