-- ForeverVote community reputation.
-- +50 once when a verified user first participates in a poll.
-- +5 to the poll creator for each unique other voter on that poll.
-- Rewards are append-only so changing/removing/recasting a vote cannot farm reputation.

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('vote_cast','poll_vote_received')),
  points integer not null check (points > 0),
  poll_id uuid references public.polls(id) on delete set null,
  voter_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists reputation_vote_cast_once_per_poll
  on public.reputation_events (user_id, poll_id)
  where event_type = 'vote_cast';

create unique index if not exists reputation_creator_once_per_voter
  on public.reputation_events (user_id, poll_id, voter_id)
  where event_type = 'poll_vote_received';

create index if not exists reputation_events_user_created_idx
  on public.reputation_events (user_id, created_at desc);

alter table public.reputation_events enable row level security;

revoke all on table public.reputation_events from public, anon, authenticated;
grant select, insert on table public.reputation_events to service_role;

create or replace function public.award_vote_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_creator uuid;
begin
  insert into public.reputation_events (
    user_id,
    event_type,
    points,
    poll_id,
    voter_id,
    created_at
  )
  values (
    new.user_id,
    'vote_cast',
    50,
    new.poll_id,
    new.user_id,
    now()
  )
  on conflict do nothing;

  select p.creator_id
  into poll_creator
  from public.polls p
  where p.id = new.poll_id;

  if poll_creator is not null and poll_creator is distinct from new.user_id then
    insert into public.reputation_events (
      user_id,
      event_type,
      points,
      poll_id,
      voter_id,
      created_at
    )
    values (
      poll_creator,
      'poll_vote_received',
      5,
      new.poll_id,
      new.user_id,
      now()
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists award_vote_reputation on public.votes;
create trigger award_vote_reputation
after insert on public.votes
for each row execute function public.award_vote_reputation();

-- Backfill rewards for voting that happened before reputation launched.
insert into public.reputation_events (
  user_id,
  event_type,
  points,
  poll_id,
  voter_id,
  created_at
)
select
  v.user_id,
  'vote_cast',
  50,
  v.poll_id,
  v.user_id,
  min(v.created_at)
from public.votes v
group by v.user_id, v.poll_id
on conflict do nothing;

insert into public.reputation_events (
  user_id,
  event_type,
  points,
  poll_id,
  voter_id,
  created_at
)
select
  p.creator_id,
  'poll_vote_received',
  5,
  v.poll_id,
  v.user_id,
  min(v.created_at)
from public.votes v
join public.polls p on p.id = v.poll_id
where p.creator_id is distinct from v.user_id
group by p.creator_id, v.poll_id, v.user_id
on conflict do nothing;

create or replace function public.user_reputation_summary(p_user_id uuid)
returns table (
  total_points bigint,
  vote_points bigint,
  creator_points bigint,
  polls_voted bigint,
  unique_voters_received bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    coalesce(sum(re.points), 0)::bigint as total_points,
    coalesce(sum(re.points) filter (where re.event_type = 'vote_cast'), 0)::bigint as vote_points,
    coalesce(sum(re.points) filter (where re.event_type = 'poll_vote_received'), 0)::bigint as creator_points,
    coalesce(count(*) filter (where re.event_type = 'vote_cast'), 0)::bigint as polls_voted,
    coalesce(count(*) filter (where re.event_type = 'poll_vote_received'), 0)::bigint as unique_voters_received
  from public.reputation_events re
  where re.user_id = p_user_id;
$$;

revoke all on function public.user_reputation_summary(uuid) from public, anon, authenticated;
grant execute on function public.user_reputation_summary(uuid) to service_role;

comment on table public.reputation_events is
  'Append-only ForeverVote reputation ledger. Vote participation grants 50 once per poll; each unique other voter grants a poll creator 5.';

comment on function public.user_reputation_summary(uuid) is
  'Server-only summary for a user community reputation profile.';
