-- Expand community polls to 20 answers and add an admin recycle-bin lifecycle.
-- Rejected submissions remain restorable for 2 days.
-- Unpublished live polls remain restorable for 7 days.

alter table public.polls add column if not exists trash_reason text;
alter table public.polls add column if not exists trashed_at timestamptz;
alter table public.polls add column if not exists trash_expires_at timestamptz;

alter table public.polls drop constraint if exists polls_trash_state_check;
alter table public.polls add constraint polls_trash_state_check check (
  (
    trash_reason is null
    and trashed_at is null
    and trash_expires_at is null
  )
  or (
    status = 'hidden'
    and trash_reason in ('rejected', 'unpublished')
    and trashed_at is not null
    and trash_expires_at is not null
    and trash_expires_at > trashed_at
  )
);

create index if not exists polls_trash_expiry_idx
  on public.polls(status, trash_expires_at)
  where status = 'hidden' and trash_expires_at is not null;

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

  select count(*) into recent_count
  from public.polls
  where creator_id = p_creator_id
    and created_at > now() - interval '10 minutes';

  if recent_count >= 3 then
    raise exception 'Too many poll submissions in the last 10 minutes' using errcode = 'P0001';
  end if;

  select count(*) into daily_count
  from public.polls
  where creator_id = p_creator_id
    and created_at > now() - interval '24 hours';

  if daily_count >= 10 then
    raise exception 'Too many poll submissions in the last 24 hours' using errcode = 'P0001';
  end if;

  insert into public.polls (
    creator_id, slug, title, description, category, status, allow_custom_answers
  )
  values (
    p_creator_id, p_slug, btrim(p_title), btrim(coalesce(p_description, '')), p_category, 'draft', false
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

comment on column public.polls.trash_reason is
  'Why a hidden poll is in the recycle bin: rejected submission or unpublished live poll.';
comment on column public.polls.trashed_at is
  'When the poll entered the admin recycle bin.';
comment on column public.polls.trash_expires_at is
  'When the poll is no longer restorable and may be permanently deleted.';
