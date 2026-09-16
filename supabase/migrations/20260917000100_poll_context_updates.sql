-- Append-only creator context updates with an immutable snapshot of poll results at the moment each update is posted.

create table if not exists public.poll_context_updates (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  creator_id uuid not null references public.users(id),
  body text not null check (length(btrim(body)) between 3 and 500 and body !~ '[<>]'),
  vote_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists poll_context_updates_poll_created_idx
  on public.poll_context_updates(poll_id, created_at desc);

alter table public.poll_context_updates enable row level security;
revoke all on public.poll_context_updates from public, anon, authenticated;
grant select, insert on public.poll_context_updates to service_role;

create or replace function public.guard_poll_context_update_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Creator context updates are append-only'
    using errcode = '23514';
end;
$$;

drop trigger if exists guard_poll_context_update_immutable on public.poll_context_updates;
create trigger guard_poll_context_update_immutable
before update or delete on public.poll_context_updates
for each row execute function public.guard_poll_context_update_immutable();

revoke all on function public.guard_poll_context_update_immutable() from public, anon, authenticated;
grant execute on function public.guard_poll_context_update_immutable() to service_role;

create or replace function public.add_poll_context_update(
  p_poll_id uuid,
  p_user_id uuid,
  p_body text
)
returns table (
  update_id uuid,
  update_body text,
  update_created_at timestamptz,
  update_vote_snapshot jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_poll public.polls%rowtype;
  clean_body text;
  existing_updates integer;
  total_voters integer;
  total_selections integer;
  option_snapshot jsonb;
  snapshot jsonb;
  inserted public.poll_context_updates%rowtype;
begin
  clean_body := btrim(coalesce(p_body, ''));

  if length(clean_body) not between 3 and 500 or clean_body ~ '[<>]' then
    raise exception 'Context update must be 3 to 500 characters without angle brackets'
      using errcode = '23514';
  end if;

  select p.*
  into target_poll
  from public.polls p
  where p.id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found' using errcode = 'P0002';
  end if;

  if target_poll.creator_id is distinct from p_user_id then
    raise exception 'Only the poll creator can add context updates'
      using errcode = '42501';
  end if;

  if target_poll.status <> 'open' then
    raise exception 'Context updates can only be added to live polls'
      using errcode = '23514';
  end if;

  select count(*)
  into existing_updates
  from public.poll_context_updates cu
  where cu.poll_id = p_poll_id;

  if existing_updates >= 25 then
    raise exception 'This poll has reached the context update limit'
      using errcode = '23514';
  end if;

  select
    count(distinct v.user_id)::integer,
    count(v.id)::integer
  into total_voters, total_selections
  from public.votes v
  where v.poll_id = p_poll_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'optionId', po.id,
        'text', po.text,
        'position', po.position,
        'voteCount', coalesce(vc.vote_count, 0)
      )
      order by po.position
    ),
    '[]'::jsonb
  )
  into option_snapshot
  from public.poll_options po
  left join lateral (
    select count(*)::integer as vote_count
    from public.votes v
    where v.poll_id = p_poll_id
      and v.option_id = po.id
  ) vc on true
  where po.poll_id = p_poll_id;

  snapshot := jsonb_build_object(
    'totalVoters', coalesce(total_voters, 0),
    'totalSelections', coalesce(total_selections, 0),
    'allowMultipleAnswers', target_poll.allow_multiple_answers,
    'options', option_snapshot
  );

  insert into public.poll_context_updates (poll_id, creator_id, body, vote_snapshot)
  values (p_poll_id, p_user_id, clean_body, snapshot)
  returning * into inserted;

  return query
  select inserted.id, inserted.body, inserted.created_at, inserted.vote_snapshot;
end;
$$;

revoke all on function public.add_poll_context_update(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.add_poll_context_update(uuid,uuid,text)
  to service_role;

comment on table public.poll_context_updates is
  'Append-only creator notes that add time-stamped context without rewriting the original poll. Each row stores a frozen result snapshot from the moment it was posted.';

comment on function public.add_poll_context_update(uuid,uuid,text) is
  'Adds an append-only context update for the creator of a live poll and captures the current voter/option counts atomically.';
