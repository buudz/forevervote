-- Finalize multi-answer voting after the matching application release is live.
-- Existing vote rows are already compatible: legacy polls have one row per user/poll.

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
  selected_neutral boolean;
begin
  -- Serialize mutations for a user/poll pair so concurrent requests cannot
  -- bypass single-answer or neutral-answer rules.
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

  select is_neutral
  into selected_neutral
  from public.poll_options
  where poll_id = new.poll_id
    and id = new.option_id;

  if selected_neutral is null then
    raise exception 'Invalid poll option' using errcode = '23514';
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

  if multiple_answers is true and selected_neutral is true and exists (
    select 1
    from public.votes v
    where v.poll_id = new.poll_id
      and v.user_id = new.user_id
      and v.id is distinct from new.id
  ) then
    raise exception 'A neutral option cannot be combined with other answers' using errcode = '23514';
  end if;

  if multiple_answers is true and selected_neutral is false and exists (
    select 1
    from public.votes v
    join public.poll_options po
      on po.poll_id = v.poll_id
     and po.id = v.option_id
    where v.poll_id = new.poll_id
      and v.user_id = new.user_id
      and v.id is distinct from new.id
      and po.is_neutral is true
  ) then
    raise exception 'A neutral option cannot be combined with other answers' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

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
  selected_neutral boolean;
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

  select is_neutral
  into selected_neutral
  from public.poll_options
  where poll_id = p_poll_id
    and id = p_option_id;

  if selected_neutral is null then
    raise exception 'Invalid poll option' using errcode = '23514';
  end if;

  if multiple_answers is not true then
    delete from public.votes
    where poll_id = p_poll_id
      and user_id = p_user_id
      and option_id <> p_option_id;
  elsif selected_neutral is true then
    delete from public.votes
    where poll_id = p_poll_id
      and user_id = p_user_id
      and option_id <> p_option_id;
  else
    delete from public.votes v
    using public.poll_options po
    where v.poll_id = p_poll_id
      and v.user_id = p_user_id
      and po.poll_id = v.poll_id
      and po.id = v.option_id
      and po.is_neutral is true;
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

revoke all on function public.cast_poll_vote(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.cast_poll_vote(uuid,uuid,uuid) to service_role;

comment on table public.votes is
  'One row per selected option. Single-answer polls are enforced by guard_vote; multi-answer polls allow one row per option per Battle.net-backed voter.';

comment on function public.cast_poll_vote(uuid,uuid,uuid) is
  'Atomically replaces a single-answer selection or adds a selection on a multi-answer poll. Neutral answers are exclusive.';
