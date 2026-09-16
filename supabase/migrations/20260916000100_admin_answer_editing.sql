-- Allow admins to edit poll answer wording with full public audit history.
-- Once voting has started, answer IDs/order/count are preserved so existing votes keep their meaning.

create or replace function public.admin_edit_poll_v2(
  p_poll_id uuid,
  p_title text,
  p_description text,
  p_options text[],
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
  before_poll public.polls%rowtype;
  clean_title text;
  clean_description text;
  option_count integer;
  existing_option_count integer;
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
    raise exception 'Invalid poll rationale' using errcode = '23514';
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

  if current_poll.status not in ('draft', 'open', 'hidden') then
    raise exception 'Poll cannot be edited in its current state' using errcode = '23514';
  end if;

  before_poll := current_poll;

  select count(*)
  into vote_count
  from public.votes v
  where v.poll_id = p_poll_id;

  select count(*)
  into existing_option_count
  from public.poll_options po
  where po.poll_id = p_poll_id;

  if current_poll.allow_multiple_answers is distinct from coalesce(p_allow_multiple_answers, false)
     and vote_count > 0 then
    raise exception 'Voting mode cannot be changed after votes have been cast'
      using errcode = '23514';
  end if;

  if vote_count > 0 and option_count <> existing_option_count then
    raise exception 'Answer count cannot be changed after votes have been cast'
      using errcode = '23514';
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

  if before_poll.allow_multiple_answers is distinct from coalesce(p_allow_multiple_answers, false) then
    fields := array_append(fields, 'voting_mode');
  end if;

  if old_options_value is distinct from new_options_value then
    fields := array_append(fields, 'options');
  end if;

  if coalesce(array_length(fields, 1), 0) = 0 then
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
  perform set_config('forevervote.skip_poll_edit_audit', '1', true);
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

  if old_options_value is distinct from new_options_value then
    if vote_count > 0 then
      update public.poll_options po
      set
        text = btrim(submitted.option_text),
        is_neutral = lower(btrim(submitted.option_text)) in ('don''t care','no preference','undecided','no strong opinion')
      from unnest(p_options) with ordinality as submitted(option_text, ordinality)
      where po.poll_id = p_poll_id
        and po.position = submitted.ordinality::smallint;
    else
      delete from public.poll_options po
      where po.poll_id = p_poll_id;

      insert into public.poll_options (poll_id, text, position, is_neutral)
      select
        p_poll_id,
        btrim(option_text),
        ordinality::smallint,
        lower(btrim(option_text)) in ('don''t care','no preference','undecided','no strong opinion')
      from unnest(p_options) with ordinality as submitted(option_text, ordinality);
    end if;
  end if;

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
    coalesce(nullif(btrim(p_editor_battletag), ''), 'Admin'),
    'admin',
    before_poll.title,
    clean_title,
    coalesce(before_poll.description, ''),
    clean_description,
    before_poll.allow_multiple_answers,
    coalesce(p_allow_multiple_answers, false),
    before_poll.category,
    before_poll.category,
    old_options_value,
    new_options_value,
    before_poll.status,
    fields
  );

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

revoke all on function public.admin_edit_poll_v2(uuid,text,text,text[],boolean,text,text)
  from public, anon, authenticated;

grant execute on function public.admin_edit_poll_v2(uuid,text,text,text[],boolean,text,text)
  to service_role;

comment on function public.admin_edit_poll_v2(uuid,text,text,text[],boolean,text,text) is
  'Audited admin poll edit including answer wording. After voting starts, answer IDs/order/count stay fixed while wording corrections remain possible.';
