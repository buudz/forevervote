-- Fix PL/pgSQL output-column shadowing in admin_edit_poll().
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

  if length(clean_title) not between 10 and 180 or clean_title ~ '[<>]' then
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

revoke all on function public.admin_edit_poll(uuid,text,text,boolean,text,text) from public, anon, authenticated;
grant execute on function public.admin_edit_poll(uuid,text,text,boolean,text,text) to service_role;
