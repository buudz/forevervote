-- Efficient admin catalog for large poll libraries.
-- Returns poll options and vote counts without transferring every vote row.

create or replace function public.admin_poll_catalog()
returns table (
  id uuid,
  creator_id uuid,
  creator_battletag text,
  slug text,
  title text,
  description text,
  category text,
  status text,
  created_at timestamptz,
  published_at timestamptz,
  trash_reason text,
  trashed_at timestamptz,
  trash_expires_at timestamptz,
  total_votes bigint,
  options jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    p.id,
    p.creator_id,
    u.battletag as creator_battletag,
    p.slug,
    p.title,
    p.description,
    p.category,
    p.status,
    p.created_at,
    p.published_at,
    p.trash_reason,
    p.trashed_at,
    p.trash_expires_at,
    (select count(*) from public.votes v where v.poll_id = p.id) as total_votes,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', po.id,
            'text', po.text,
            'position', po.position,
            'is_neutral', po.is_neutral
          )
          order by po.position
        )
        from public.poll_options po
        where po.poll_id = p.id
      ),
      '[]'::jsonb
    ) as options
  from public.polls p
  join public.users u on u.id = p.creator_id
  where p.status in ('draft', 'open', 'hidden')
  order by p.created_at desc;
$$;

revoke all on function public.admin_poll_catalog() from public, anon, authenticated;
grant execute on function public.admin_poll_catalog() to service_role;

comment on function public.admin_poll_catalog() is
  'Server-only admin poll catalog with aggregated vote counts and options for scalable moderation.';
