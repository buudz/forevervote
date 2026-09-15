-- Server-managed admin allowlist. Browser roles cannot read or modify it.

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  battlenet_account_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_accounts enable row level security;

revoke all on table public.admin_accounts from anon, authenticated;
grant all on table public.admin_accounts to service_role;

comment on table public.admin_accounts is
  'ForeverVote admin allowlist keyed by stable Battle.net account ID. Managed server-side only.';
