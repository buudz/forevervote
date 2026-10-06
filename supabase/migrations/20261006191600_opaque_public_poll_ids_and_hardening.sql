alter table public.polls
  add column if not exists public_id text;

update public.polls
set public_id = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
where public_id is null;

alter table public.polls
  alter column public_id set default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  alter column public_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.polls'::regclass
      and conname = 'polls_public_id_format'
  ) then
    alter table public.polls
      add constraint polls_public_id_format
      check (public_id ~ '^[0-9a-f]{16}$');
  end if;
end
$$;

create unique index if not exists polls_public_id_key
  on public.polls(public_id);

alter table public.polls
  alter column public_number drop default,
  alter column public_number drop not null;

drop sequence if exists public.polls_public_number_seq;

create index if not exists poll_context_updates_creator_id_idx
  on public.poll_context_updates(creator_id);

create index if not exists reputation_events_poll_id_idx
  on public.reputation_events(poll_id);

create index if not exists reputation_events_voter_id_idx
  on public.reputation_events(voter_id);

create or replace function public.submit_poll_v3(
  p_creator_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_category text,
  p_options text[],
  p_allow_multiple_answers boolean,
  p_bypass_rate_limit boolean default false
)
returns table(
  poll_id uuid,
  poll_public_id text,
  poll_status text,
  submitted_at timestamptz
)
language plpgsql
set search_path to ''
as $function$
declare
  eligible boolean;
  recent_count integer;
  daily_count integer;
  new_poll_id uuid;
  new_public_id text;
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
    raise exception 'Verified Battle.net account required to submit polls' using errcode = '23514';
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(p_slug) > 80 then
    raise exception 'Invalid poll slug' using errcode = '23514';
  end if;

  if length(btrim(coalesce(p_title, ''))) not between 10 and 90 or p_title ~ '[<>]' then
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

  if not coalesce(p_bypass_rate_limit, false) then
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
  returning id, public_id, created_at
  into new_poll_id, new_public_id, new_created_at;

  insert into public.poll_options (poll_id, text, position, is_neutral)
  select
    new_poll_id,
    btrim(option_text),
    ordinality::smallint,
    lower(btrim(option_text)) in ('don''t care', 'no preference', 'undecided', 'no strong opinion')
  from unnest(p_options) with ordinality as submitted(option_text, ordinality);

  return query
  select new_poll_id, new_public_id, 'draft'::text, new_created_at;
end;
$function$;

revoke execute on function public.submit_poll_v3(uuid,text,text,text,text,text[],boolean,boolean)
from public, anon, authenticated;

grant execute on function public.submit_poll_v3(uuid,text,text,text,text,text[],boolean,boolean)
to service_role;
