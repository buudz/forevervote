-- Database foundation only. Browser roles intentionally have no access yet.
-- Next.js must derive user_id from a validated server session, never request data.
-- Only the trusted OAuth callback may set battlenet_account_id or wow_verified.
create table public.users (
  id uuid primary key default gen_random_uuid(),
  battlenet_account_id text not null unique check (length(btrim(battlenet_account_id)) between 1 and 128),
  battletag text not null check (length(btrim(battletag)) between 1 and 100),
  wow_verified boolean not null default false,
  wow_verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint verification_timestamp_required check (not wow_verified or wow_verified_at is not null)
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  title text not null check (length(btrim(title)) between 10 and 180 and title !~ '[<>]'),
  description text not null default '' check (length(description) <= 1500 and description !~ '[<>]'),
  category text not null check (category in ('WoW Forever','Classes','PvP','Raids','Dungeons','World','Professions','QoL','Items','General')),
  status text not null default 'draft' check (status in ('draft','open','closed','hidden')),
  created_at timestamptz not null default now()
);
create index polls_creator_created_idx on public.polls(creator_id, created_at desc);
create index polls_status_created_idx on public.polls(status, created_at desc);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null check (length(btrim(text)) between 1 and 100 and text !~ '[<>]'),
  position smallint not null check (position between 1 and 5),
  unique (poll_id, id),
  unique (poll_id, position)
);
create unique index poll_options_distinct_text_idx on public.poll_options(poll_id, lower(btrim(text)));

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.users(id),
  option_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_vote_per_user_per_poll unique (poll_id, user_id),
  constraint vote_option_belongs_to_poll foreign key (poll_id, option_id)
    references public.poll_options(poll_id, id)
);
create index votes_user_idx on public.votes(user_id);
create index votes_poll_option_idx on public.votes(poll_id, option_id);

-- Invoker functions do not provide an RLS bypass.
create function public.guard_vote() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare eligible boolean; poll_status text;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id
       or new.poll_id is distinct from old.poll_id then
      raise exception 'Vote identity cannot be changed' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  select wow_verified into eligible from public.users where id = new.user_id for share;
  if eligible is distinct from true then
    raise exception 'Verified WoW profile required' using errcode = '23514';
  end if;
  select status into poll_status from public.polls where id = new.poll_id for share;
  if poll_status is distinct from 'open' then
    raise exception 'Poll is not open' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_vote before insert or update on public.votes
for each row execute function public.guard_vote();

create function public.guard_poll() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare eligible boolean; option_count integer;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id then
      raise exception 'Poll identity cannot be changed' using errcode = '23514';
    end if;
  end if;
  if TG_OP = 'INSERT' or (new.status = 'open' and old.status is distinct from 'open') then
    select wow_verified into eligible from public.users where id = new.creator_id for share;
    if eligible is distinct from true then
      raise exception 'Verified WoW profile required to create or publish polls' using errcode = '23514';
    end if;
  end if;
  if new.status = 'open' then
    select count(*) into option_count from public.poll_options where poll_id = new.id;
    if option_count not between 2 and 5 then
      raise exception 'Open polls need 2 to 5 options' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_poll before insert or update on public.polls
for each row execute function public.guard_poll();

-- Finalize options while draft; never change the meaning of votes after publication.
create function public.guard_poll_options() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare target_poll uuid; poll_status text;
begin
  if TG_OP = 'UPDATE' and (new.id is distinct from old.id or new.poll_id is distinct from old.poll_id) then
    raise exception 'Option identity cannot be changed' using errcode = '23514';
  end if;
  if TG_OP = 'DELETE' then target_poll := old.poll_id; else target_poll := new.poll_id; end if;
  select status into poll_status from public.polls where id = target_poll for update;
  -- Parent may be absent during a cascading delete.
  if poll_status is not null and poll_status <> 'draft' then
    raise exception 'Only draft poll options may change' using errcode = '23514';
  end if;
  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;
create trigger guard_poll_options before insert or update or delete on public.poll_options
for each row execute function public.guard_poll_options();

alter table public.users enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
revoke all on public.users, public.polls, public.poll_options, public.votes from public, anon, authenticated;
grant select, insert, update, delete on public.users, public.polls, public.poll_options, public.votes to service_role;
revoke all on function public.guard_vote(), public.guard_poll(), public.guard_poll_options() from public, anon, authenticated;
grant execute on function public.guard_vote(), public.guard_poll(), public.guard_poll_options() to service_role;

comment on table public.votes is 'Count actual rows for results. One row per Battle.net-backed user per poll. No editable vote totals.';
comment on table public.users is 'Private identity table. WoW eligibility must be established by a trusted Blizzard OAuth/profile verification flow.';
