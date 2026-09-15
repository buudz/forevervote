-- Return edit counts for open polls without building very long URL filters.
create or replace function public.open_poll_edit_counts()
returns table (
  poll_id uuid,
  edit_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    h.poll_id,
    count(*)::bigint as edit_count
  from public.poll_edit_history h
  join public.polls p on p.id = h.poll_id
  where p.status = 'open'
  group by h.poll_id;
$$;

revoke all on function public.open_poll_edit_counts() from public, anon, authenticated;
grant execute on function public.open_poll_edit_counts() to service_role;

comment on function public.open_poll_edit_counts() is
  'Server-only aggregate of public edit-history counts for currently open polls.';
