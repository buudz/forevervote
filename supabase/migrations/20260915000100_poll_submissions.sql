-- Community poll submissions.
-- Submissions are created atomically as draft polls and require admin moderation
-- before they can become visible on the public board.

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

  if length(btrim(coalesce(p_description, ''))) not between 20 and 1500 or p_description ~ '[<>]' then
    raise exception 'Invalid poll rationale' using errcode = '23514';
  end if;

  if p_category not in ('PvE','PvP','World','RolePlay','Hardcore','General') then
    raise exception 'Invalid poll category' using errcode = '23514';
  end if;

  option_count := coalesce(array_length(p_options, 1), 0);
  if option_count not between 2 and 5 then
    raise exception 'Poll submissions need 2 to 5 options' using errcode = '23514';
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
    allow_custom_answers
  )
  values (
    p_creator_id,
    p_slug,
    btrim(p_title),
    btrim(p_description),
    p_category,
    'draft',
    false
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

revoke all on function public.submit_poll(uuid,text,text,text,text,text[]) from public, anon, authenticated;
grant execute on function public.submit_poll(uuid,text,text,text,text,text[]) to service_role;

comment on function public.submit_poll(uuid,text,text,text,text,text[]) is
  'Creates a verified user poll submission and its options atomically as a draft awaiting moderation.';
