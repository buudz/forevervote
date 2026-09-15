-- Profile preferences, 90-character poll titles, and creator editing for zero-vote polls.

alter table public.users
  add column if not exists poll_sort_preference text not null default 'explore',
  add column if not exists poll_vote_filter_preference text not null default 'unvoted';

alter table public.users
  drop constraint if exists users_poll_sort_preference_check,
  add constraint users_poll_sort_preference_check
    check (poll_sort_preference in ('explore','popular','newest','oldest'));

alter table public.users
  drop constraint if exists users_poll_vote_filter_preference_check,
  add constraint users_poll_vote_filter_preference_check
    check (poll_vote_filter_preference in ('all','unvoted','voted'));

alter table public.poll_edit_history
  add column if not exists editor_role text not null default 'admin',
  add column if not exists old_category text,
  add column if not exists new_category text,
  add column if not exists old_options jsonb,
  add column if not exists new_options jsonb;

create or replace function public.audit_poll_copy_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fields text[] := '{}'::text[];
  editor_account text;
  editor_tag text;
  editor_role_value text;
begin
  if coalesce(current_setting('forevervote.skip_poll_edit_audit', true), '') = '1' then
    return new;
  end if;

  if new.title is not distinct from old.title
     and new.description is not distinct from old.description
     and new.allow_multiple_answers is not distinct from old.allow_multiple_answers
     and new.category is not distinct from old.category then
    return new;
  end if;

  if new.title is distinct from old.title then
    fields := array_append(fields, 'title');
  end if;

  if new.description is distinct from old.description then
    fields := array_append(fields, 'rationale');
  end if;

  if new.allow_multiple_answers is distinct from old.allow_multiple_answers then
    fields := array_append(fields, 'voting_mode');
  end if;

  if new.category is distinct from old.category then
    fields := array_append(fields, 'category');
  end if;

  editor_account := nullif(current_setting('forevervote.editor_account_id', true), '');
  editor_tag := coalesce(nullif(current_setting('forevervote.editor_battletag', true), ''), 'Admin');
  editor_role_value := coalesce(nullif(current_setting('forevervote.editor_role', true), ''), 'admin');

  insert into public.poll_edit_history (
    poll_id,
    poll_slug,
    poll_creator_id,
    editor_battlenet_account_id,
    editor_battletag,
    editor_role,
    old_title,
    new_title,
    old_description,
    new_description,
    old_allow_multiple_answers,
    new_allow_multiple_answers,
    old_category,
    new_category,
    poll_status,
    changed_fields
  )
  values (
    old.id,
    old.slug,
    old.creator_id,
    editor_account,
    editor_tag,
    editor_role_value,
    old.title,
    new.title,
    coalesce(old.description, ''),
    coalesce(new.description, ''),
    old.allow_multiple_answers,
    new.allow_multiple_answers,
    old.category,
    new.category,
    new.status,
    fields
  );

  return new;
end;
$$;

drop trigger if exists audit_poll_copy_edit on public.polls;
create trigger audit_poll_copy_edit
after update of title, description, allow_multiple_answers, category on public.polls
for each row
when (
  old.title is distinct from new.title
  or old.description is distinct from new.description
  or old.allow_multiple_answers is distinct from new.allow_multiple_answers
  or old.category is distinct from new.category
)
execute function public.audit_poll_copy_edit();

create or replace function public.guard_poll() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  eligible boolean;
  option_count integer;
  audited_edit boolean;
  audited_mode_edit boolean;
  creator_edit boolean;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id then
      raise exception 'Poll identity cannot be changed' using errcode = '23514';
    end if;

    if old.status <> 'draft' and new.slug is distinct from old.slug then
      raise exception 'Posted poll slug cannot be changed' using errcode = '23514';
    end if;

    audited_edit := coalesce(current_setting('forevervote.admin_poll_edit', true), '') = '1';
    audited_mode_edit := coalesce(current_setting('forevervote.admin_poll_mode_edit', true), '') = '1';
    creator_edit := coalesce(current_setting('forevervote.creator_poll_edit', true), '') = '1';

    if (new.title is distinct from old.title
        or new.description is distinct from old.description
        or new.category is distinct from old.category)
       and audited_edit is not true
       and creator_edit is not true then
      raise exception 'Poll wording/category changes must use an audited edit function'
        using errcode = '23514';
    end if;

    if new.allow_multiple_answers is distinct from old.allow_multiple_answers
       and audited_mode_edit is not true
       and creator_edit is not true then
      raise exception 'Poll voting mode changes must use an audited edit function'
        using errcode = '23514';
    end if;

    new.created_at := old.created_at;
    new.published_at := old.published_at;
  end if;

  if new.status <> 'draft' then
    if length(btrim(new.title)) not between 10 and 90 or new.title ~ '[<>]' then
      raise exception 'Posted polls need a title between 10 and 90 characters without angle brackets'
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

create or replace function public.admin_edit_poll(
  p_poll_id uuid,
  p_title text,
  p_description text,
  p_allow_multiple_answers boolean,
  p_editor_battlenet_account_id text,
  p_editor_battletag text
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_title text,
  poll_description text,
  poll_allow_multiple_answers boolean,
  poll_status text,
  poll_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_poll public.polls%rowtype;
  clean_title text;
  clean_description text;
  vote_count bigint;
begin
  clean_title := btrim(coalesce(p_title, ''));
  clean_description := btrim(coalesce(p_description, ''));

  if length(clean_title) not between 10 and 90 or clean_title ~ '[<>]' then
    raise exception 'Invalid poll title' using errcode = '23514';
  end if;

  if length(clean_description) > 1500 or clean_description ~ '[<>]' then
    raise exception 'Invalid poll rationale' using errcode = '23514';
  end if;

  select p.*
  into current_poll
  from public.polls p
  where p.id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found' using errcode = 'P0002';
  end if;

  if current_poll.status not in ('draft', 'open', 'hidden') then
    raise exception 'Poll cannot be edited in its current state' using errcode = '23514';
  end if;

  if current_poll.allow_multiple_answers is distinct from coalesce(p_allow_multiple_answers, false) then
    select count(*)
    into vote_count
    from public.votes v
    where v.poll_id = p_poll_id;

    if vote_count > 0 then
      raise exception 'Voting mode cannot be changed after votes have been cast'
        using errcode = '23514';
    end if;
  end if;

  if current_poll.title is not distinct from clean_title
     and coalesce(current_poll.description, '') is not distinct from clean_description
     and current_poll.allow_multiple_answers is not distinct from coalesce(p_allow_multiple_answers, false) then
    return query
    select
      current_poll.id,
      current_poll.slug,
      current_poll.title,
      coalesce(current_poll.description, ''),
      current_poll.allow_multiple_answers,
      current_poll.status,
      current_poll.updated_at;
    return;
  end if;

  perform set_config('forevervote.admin_poll_edit', '1', true);
  perform set_config('forevervote.admin_poll_mode_edit', '1', true);
  perform set_config('forevervote.editor_account_id', coalesce(p_editor_battlenet_account_id, ''), true);
  perform set_config('forevervote.editor_battletag', coalesce(nullif(btrim(p_editor_battletag), ''), 'Admin'), true);
  perform set_config('forevervote.editor_role', 'admin', true);

  update public.polls p
  set
    title = clean_title,
    description = clean_description,
    allow_multiple_answers = coalesce(p_allow_multiple_answers, false)
  where p.id = p_poll_id
  returning p.* into current_poll;

  return query
  select
    current_poll.id,
    current_poll.slug,
    current_poll.title,
    coalesce(current_poll.description, ''),
    current_poll.allow_multiple_answers,
    current_poll.status,
    current_poll.updated_at;
end;
$$;

create or replace function public.creator_edit_poll(
  p_poll_id uuid,
  p_user_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_options text[],
  p_allow_multiple_answers boolean,
  p_editor_battlenet_account_id text,
  p_editor_battletag text
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_status text,
  poll_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_poll public.polls%rowtype;
  before_poll public.polls%rowtype;
  clean_title text;
  clean_description text;
  option_count integer;
  distinct_option_count integer;
  vote_count bigint;
  fields text[] := '{}'::text[];
  old_options_value jsonb;
  new_options_value jsonb;
begin
  clean_title := btrim(coalesce(p_title, ''));
  clean_description := btrim(coalesce(p_description, ''));

  if length(clean_title) not between 10 and 90 or clean_title ~ '[<>]' then
    raise exception 'Invalid poll title' using errcode = '23514';
  end if;

  if length(clean_description) > 1500 or clean_description ~ '[<>]' then
    raise exception 'Invalid poll context' using errcode = '23514';
  end if;

  if p_category not in ('PvE','PvP','World','RolePlay','Hardcore','General') then
    raise exception 'Invalid poll category' using errcode = '23514';
  end if;

  option_count := coalesce(array_length(p_options, 1), 0);
  if option_count not between 2 and 20 then
    raise exception 'Polls need 2 to 20 options' using errcode = '23514';
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

  select p.*
  into current_poll
  from public.polls p
  where p.id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found' using errcode = 'P0002';
  end if;

  before_poll := current_poll;

  if current_poll.creator_id is distinct from p_user_id then
    raise exception 'Only the poll creator can edit this poll' using errcode = '42501';
  end if;

  if current_poll.status not in ('draft', 'open') then
    raise exception 'This poll can no longer be edited by its creator' using errcode = '23514';
  end if;

  select count(*)
  into vote_count
  from public.votes v
  where v.poll_id = p_poll_id;

  if vote_count > 0 then
    raise exception 'Poll cannot be edited after voting has started' using errcode = '23514';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'text', po.text,
        'position', po.position,
        'isNeutral', po.is_neutral
      )
      order by po.position
    ),
    '[]'::jsonb
  )
  into old_options_value
  from public.poll_options po
  where po.poll_id = p_poll_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'text', btrim(submitted.option_text),
        'position', submitted.ordinality,
        'isNeutral', lower(btrim(submitted.option_text)) in ('don''t care','no preference','undecided','no strong opinion')
      )
      order by submitted.ordinality
    ),
    '[]'::jsonb
  )
  into new_options_value
  from unnest(p_options) with ordinality as submitted(option_text, ordinality);

  if before_poll.title is distinct from clean_title then
    fields := array_append(fields, 'title');
  end if;
  if coalesce(before_poll.description, '') is distinct from clean_description then
    fields := array_append(fields, 'rationale');
  end if;
  if before_poll.category is distinct from p_category then
    fields := array_append(fields, 'category');
  end if;
  if before_poll.allow_multiple_answers is distinct from coalesce(p_allow_multiple_answers, false) then
    fields := array_append(fields, 'voting_mode');
  end if;
  if old_options_value is distinct from new_options_value then
    fields := array_append(fields, 'options');
  end if;

  if coalesce(array_length(fields, 1), 0) = 0 then
    return query
    select current_poll.id, current_poll.slug, current_poll.status, current_poll.updated_at;
    return;
  end if;

  perform set_config('forevervote.creator_poll_edit', '1', true);
  perform set_config('forevervote.skip_poll_edit_audit', '1', true);
  perform set_config('forevervote.editor_account_id', coalesce(p_editor_battlenet_account_id, ''), true);
  perform set_config('forevervote.editor_battletag', coalesce(nullif(btrim(p_editor_battletag), ''), 'Poll creator'), true);
  perform set_config('forevervote.editor_role', 'creator', true);

  update public.polls p
  set
    title = clean_title,
    description = clean_description,
    category = p_category,
    allow_multiple_answers = coalesce(p_allow_multiple_answers, false)
  where p.id = p_poll_id
  returning p.* into current_poll;

  delete from public.poll_options po
  where po.poll_id = p_poll_id;

  insert into public.poll_options (poll_id, text, position, is_neutral)
  select
    p_poll_id,
    btrim(option_text),
    ordinality::smallint,
    lower(btrim(option_text)) in ('don''t care','no preference','undecided','no strong opinion')
  from unnest(p_options) with ordinality as submitted(option_text, ordinality);

  insert into public.poll_edit_history (
    poll_id,
    poll_slug,
    poll_creator_id,
    editor_battlenet_account_id,
    editor_battletag,
    editor_role,
    old_title,
    new_title,
    old_description,
    new_description,
    old_allow_multiple_answers,
    new_allow_multiple_answers,
    old_category,
    new_category,
    old_options,
    new_options,
    poll_status,
    changed_fields
  )
  values (
    before_poll.id,
    before_poll.slug,
    before_poll.creator_id,
    nullif(p_editor_battlenet_account_id, ''),
    coalesce(nullif(btrim(p_editor_battletag), ''), 'Poll creator'),
    'creator',
    before_poll.title,
    clean_title,
    coalesce(before_poll.description, ''),
    clean_description,
    before_poll.allow_multiple_answers,
    coalesce(p_allow_multiple_answers, false),
    before_poll.category,
    p_category,
    old_options_value,
    new_options_value,
    before_poll.status,
    fields
  );

  return query
  select current_poll.id, current_poll.slug, current_poll.status, current_poll.updated_at;
end;
$$;

revoke all on function public.creator_edit_poll(uuid,uuid,text,text,text,text[],boolean,text,text)
  from public, anon, authenticated;
grant execute on function public.creator_edit_poll(uuid,uuid,text,text,text,text[],boolean,text,text)
  to service_role;

comment on function public.creator_edit_poll(uuid,uuid,text,text,text,text[],boolean,text,text) is
  'Lets a poll creator edit a draft or live zero-vote poll. All changes are audited; edits are blocked once any vote exists.';
