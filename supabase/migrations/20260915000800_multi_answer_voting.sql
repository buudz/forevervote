-- Add creator-selectable multi-answer polls while preserving strong vote integrity.
-- Existing polls remain single-answer. Voting mode is immutable after publication.

alter table public.polls
  add column if not exists allow_multiple_answers boolean not null default false;

-- A user may have at most one row for each option. Single-answer polls are
-- additionally enforced by guard_vote() below.
alter table public.votes
  drop constraint if exists one_vote_per_user_per_poll;

alter table public.votes
  drop constraint if exists one_selection_per_option_per_user;

alter table public.votes
  add constraint one_selection_per_option_per_user
  unique (poll_id, user_id, option_id);

create or replace function public.guard_vote() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  eligible boolean;
  poll_status text;
  multiple_answers boolean;
begin
  -- Serialize all vote mutations for one user/poll pair. This prevents two
  -- concurrent requests from bypassing the single-answer rule.
  perform pg_advisory_xact_lock(
    hashtextextended(new.poll_id::text || ':' || new.user_id::text, 0)
  );

  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.poll_id is distinct from old.poll_id then
      raise exception 'Vote identity cannot be changed' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;

  select wow_verified
  into eligible
  from public.users
  where id = new.user_id
  for share;

  if eligible is distinct from true then
    raise exception 'Verified WoW profile required' using errcode = '23514';
  end if;

  select status, allow_multiple_answers
  into poll_status, multiple_answers
  from public.polls
  where id = new.poll_id
  for share;

  if poll_status is distinct from 'open' then
    raise exception 'Poll is not open' using errcode = '23514';
  end if;

  if multiple_answers is not true and exists (
    select 1
    from public.votes v
    where v.poll_id = new.poll_id
      and v.user_id = new.user_id
      and v.id is distinct from new.id
  ) then
    raise exception 'This poll allows one answer per voter' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Preserve the existing audited-copy rules and lock the voting mode once a
-- poll leaves draft. Changing voting semantics after votes exist would be
-- misleading, so this setting cannot change on a published/hidden poll.
create or replace function public.guard_poll() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  eligible boolean;
  option_count integer;
  audited_edit boolean;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id then
      raise exception 'Poll identity cannot be changed' using errcode = '23514';
    end if;

    if old.status <> 'draft' and new.slug is distinct from old.slug then
      raise exception 'Posted poll slug cannot be changed' using errcode = '23514';
    end if;

    if old.status <> 'draft'
       and new.allow_multiple_answers is distinct from old.allow_multiple_answers then
      raise exception 'Voting mode cannot change after a poll leaves draft' using errcode = '23514';
    end if;

    if new.title is distinct from old.title or new.description is distinct from old.description then
      audited_edit := coalesce(current_setting('forevervote.admin_poll_edit', true), '') = '1';

      if audited_edit is not true then
        raise exception 'Poll title and rationale changes must use the audited admin edit function'
          using errcode = '23514';
      end if;
    end if;

    new.created_at := old.created_at;
    new.published_at := old.published_at;
  end if;

  if new.status <> 'draft' then
    if length(btrim(new.title)) not between 10 and 180 or new.title ~ '[<>]' then
      raise exception 'Posted polls need a title between 10 and 180 characters without angle brackets'
        using errcode = '23514';
    end if;

    if length(coalesce(new.description, '')) > 1500 or coalesce(new.description, '') ~ '[<>]' then
      raise exception 'Poll context must be at most 1500 characters and cannot contain angle brackets'
        using errcode = '23514';
    end if;

    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;

  if TG_OP = 'INSERT'
     or (new.status = 'open' and (TG_OP = 'INSERT' or old.status is distinct from 'open')) then
    select wow_verified
    into eligible
    from public.users
    where id = new.creator_id
    for share;

    if eligible is distinct from true then
      raise exception 'Verified WoW profile required to create or publish polls'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'open' then
    select count(*)
    into option_count
    from public.poll_options
    where poll_id = new.id;

    if option_count not between 2 and 20 then
      raise exception 'Open polls need 2 to 20 options' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- New submission signature with an explicit voting-mode choice.
create or replace function public.submit_poll(
  p_creator_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_category text,
  p_options text[],
  p_allow_multiple_answers boolean
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_status text,
  submitted_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  eligible boolean;
  recent_count integer;
  daily_count integer;
  new_poll_id uuid;
  new_created_at timestamptz;
  option_count integer;
  distinct_option_count integer;
begin
  select wow_verified
  into eligible
  from public.users
  where id = p_creator_id
  for update;

  if eligible is distinct from true then
    raise exception 'Verified WoW profile required to submit polls' using errcode = '23514';
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(p_slug) > 80 then
    raise exception 'Invalid poll slug' using errcode = '23514';
  end if;

  if length(btrim(coalesce(p_title, ''))) not between 10 and 180 or p_title ~ '[<>]' then
    raise exception 'Invalid poll title' using errcode = '23514';
  end if;

  if length(coalesce(p_description, '')) > 1500 or coalesce(p_description, '') ~ '[<>]' then
    raise exception 'Invalid poll context' using errcode = '23514';
  end if;

  if p_category not in ('PvE','PvP','World','RolePlay','Hardcore','General') then
    raise exception 'Invalid poll category' using errcode = '23514';
  end if;

  option_count := coalesce(array_length(p_options, 1), 0);

  if option_count not between 2 and 20 then
    raise exception 'Poll submissions need 2 to 20 options' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(p_options) as option_text
    where length(btrim(coalesce(option_text, ''))) not between 1 and 100
       or option_text ~ '[<>]'
  ) then
    raise exception 'Invalid poll option' using errcode = '23514';
  end if;

  select count(distinct lower(btrim(option_text)))
  into distinct_option_count
  from unnest(p_options) as option_text;

  if distinct_option_count <> option_count then
    raise exception 'Poll options must be unique' using errcode = '23514';
  end if;

  select count(*)
  into recent_count
  from public.polls
  where creator_id = p_creator_id
    and created_at > now() - interval '10 minutes';

  if recent_count >= 3 then
    raise exception 'Too many poll submissions in the last 10 minutes' using errcode = 'P0001';
  end if;

  select count(*)
  into daily_count
  from public.polls
  where creator_id = p_creator_id
    and created_at > now() - interval '24 hours';

  if daily_count >= 10 then
    raise exception 'Too many poll submissions in the last 24 hours' using errcode = 'P0001';
  end if;

  insert into public.polls (
    creator_id,
    slug,
    title,
    description,
    category,
    status,
    allow_custom_answers,
    allow_multiple_answers
  )
  values (
    p_creator_id,
    p_slug,
    btrim(p_title),
    btrim(coalesce(p_description, '')),
    p_category,
    'draft',
    false,
    coalesce(p_allow_multiple_answers, false)
  )
  returning id, created_at into new_poll_id, new_created_at;

  insert into public.poll_options (poll_id, text, position, is_neutral)
  select
    new_poll_id,
    btrim(option_text),
    ordinality::smallint,
    lower(btrim(option_text)) in ('don''t care', 'no preference', 'undecided', 'no strong opinion')
  from unnest(p_options) with ordinality as submitted(option_text, ordinality);

  return query
  select new_poll_id, p_slug, 'draft'::text, new_created_at;
end;
$$;

-- Keep the old six-argument server call valid for backwards compatibility.
create or replace function public.submit_poll(
  p_creator_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_category text,
  p_options text[]
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_status text,
  submitted_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from public.submit_poll(
    p_creator_id,
    p_slug,
    p_title,
    p_description,
    p_category,
    p_options,
    false
  );
$$;

-- Server-only vote functions make switching a single-answer vote atomic and
-- make multi-answer selections idempotent.
create or replace function public.cast_poll_vote(
  p_poll_id uuid,
  p_user_id uuid,
  p_option_id uuid
)
returns table (
  vote_id uuid,
  option_id uuid,
  allow_multiple_answers boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  eligible boolean;
  poll_status text;
  multiple_answers boolean;
  saved_vote public.votes%rowtype;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_poll_id::text || ':' || p_user_id::text, 0)
  );

  select wow_verified
  into eligible
  from public.users
  where id = p_user_id
  for share;

  if eligible is distinct from true then
    raise exception 'Verified WoW profile required' using errcode = '23514';
  end if;

  select status, allow_multiple_answers
  into poll_status, multiple_answers
  from public.polls
  where id = p_poll_id
  for share;

  if poll_status is distinct from 'open' then
    raise exception 'Poll is not open' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.poll_options
    where poll_id = p_poll_id
      and id = p_option_id
  ) then
    raise exception 'Invalid poll option' using errcode = '23514';
  end if;

  if multiple_answers is not true then
    delete from public.votes
    where poll_id = p_poll_id
      and user_id = p_user_id
      and option_id <> p_option_id;
  end if;

  insert into public.votes (poll_id, user_id, option_id)
  values (p_poll_id, p_user_id, p_option_id)
  on conflict (poll_id, user_id, option_id)
  do update set updated_at = now()
  returning * into saved_vote;

  return query
  select saved_vote.id, saved_vote.option_id, multiple_answers;
end;
$$;

create or replace function public.retract_poll_vote(
  p_poll_id uuid,
  p_user_id uuid,
  p_option_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_status text;
  removed_count integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_poll_id::text || ':' || p_user_id::text, 0)
  );

  select status
  into poll_status
  from public.polls
  where id = p_poll_id
  for share;

  if poll_status is distinct from 'open' then
    raise exception 'Poll is not open' using errcode = '23514';
  end if;

  delete from public.votes
  where poll_id = p_poll_id
    and user_id = p_user_id
    and option_id = p_option_id;

  get diagnostics removed_count = row_count;
  return removed_count > 0;
end;
$$;

revoke all on function public.submit_poll(uuid,text,text,text,text,text[],boolean) from public, anon, authenticated;
revoke all on function public.submit_poll(uuid,text,text,text,text,text[]) from public, anon, authenticated;
revoke all on function public.cast_poll_vote(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.retract_poll_vote(uuid,uuid,uuid) from public, anon, authenticated;

grant execute on function public.submit_poll(uuid,text,text,text,text,text[],boolean) to service_role;
grant execute on function public.submit_poll(uuid,text,text,text,text,text[]) to service_role;
grant execute on function public.cast_poll_vote(uuid,uuid,uuid) to service_role;
grant execute on function public.retract_poll_vote(uuid,uuid,uuid) to service_role;

comment on column public.polls.allow_multiple_answers is
  'When true, a verified voter may select more than one option. Immutable after publication.';

comment on table public.votes is
  'One row per selected option. Single-answer polls are enforced by guard_vote; multi-answer polls allow one row per option per Battle.net-backed voter.';

comment on function public.cast_poll_vote(uuid,uuid,uuid) is
  'Atomically casts a vote. Replaces the prior selection on single-answer polls and adds a selection on multi-answer polls.';

comment on function public.retract_poll_vote(uuid,uuid,uuid) is
  'Removes one selected option for a verified server-authenticated voter.';
