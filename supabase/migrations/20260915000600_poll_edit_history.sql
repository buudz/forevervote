-- Add audited admin editing for poll titles and rationale/context.
-- Every title/context change is append-only in poll_edit_history and survives poll deletion.

create table if not exists public.poll_edit_history (
  id bigint generated always as identity primary key,
  poll_id uuid not null,
  poll_slug text not null,
  poll_creator_id uuid,
  edited_at timestamptz not null default now(),
  editor_battlenet_account_id text,
  editor_battletag text not null default 'Admin',
  old_title text not null,
  new_title text not null,
  old_description text not null default '',
  new_description text not null default '',
  poll_status text not null,
  changed_fields text[] not null
);

create index if not exists poll_edit_history_poll_id_edited_at_idx
  on public.poll_edit_history(poll_id, edited_at desc);

create index if not exists poll_edit_history_slug_edited_at_idx
  on public.poll_edit_history(poll_slug, edited_at desc);

alter table public.poll_edit_history enable row level security;
revoke all on table public.poll_edit_history from public, anon, authenticated;
grant select on table public.poll_edit_history to service_role;

create or replace function public.block_poll_edit_history_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Poll edit history is append-only' using errcode = '55000';
end;
$$;

drop trigger if exists block_poll_edit_history_mutation on public.poll_edit_history;
create trigger block_poll_edit_history_mutation
before update or delete on public.poll_edit_history
for each row execute function public.block_poll_edit_history_mutation();

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
begin
  if new.title is not distinct from old.title
     and new.description is not distinct from old.description then
    return new;
  end if;

  if new.title is distinct from old.title then
    fields := array_append(fields, 'title');
  end if;

  if new.description is distinct from old.description then
    fields := array_append(fields, 'rationale');
  end if;

  editor_account := nullif(current_setting('forevervote.editor_account_id', true), '');
  editor_tag := coalesce(nullif(current_setting('forevervote.editor_battletag', true), ''), 'Admin');

  insert into public.poll_edit_history (
    poll_id,
    poll_slug,
    poll_creator_id,
    editor_battlenet_account_id,
    editor_battletag,
    old_title,
    new_title,
    old_description,
    new_description,
    poll_status,
    changed_fields
  )
  values (
    old.id,
    old.slug,
    old.creator_id,
    editor_account,
    editor_tag,
    old.title,
    new.title,
    coalesce(old.description, ''),
    coalesce(new.description, ''),
    new.status,
    fields
  );

  return new;
end;
$$;

drop trigger if exists audit_poll_copy_edit on public.polls;
create trigger audit_poll_copy_edit
after update of title, description on public.polls
for each row
when (
  old.title is distinct from new.title
  or old.description is distinct from new.description
)
execute function public.audit_poll_copy_edit();

create or replace function public.guard_poll() returns trigger
language plpgsql security invoker set search_path = '' as $$
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

    if new.title is distinct from old.title
       or new.description is distinct from old.description then
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

  if TG_OP = 'INSERT' or (new.status = 'open' and (TG_OP = 'INSERT' or old.status is distinct from 'open')) then
    select wow_verified into eligible from public.users where id = new.creator_id for share;
    if eligible is distinct from true then
      raise exception 'Verified WoW profile required to create or publish polls' using errcode = '23514';
    end if;
  end if;

  if new.status = 'open' then
    select count(*) into option_count from public.poll_options where poll_id = new.id;
    if option_count not between 2 and 20 then
      raise exception 'Open polls need 2 to 20 options' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.admin_edit_poll_copy(
  p_poll_id uuid,
  p_title text,
  p_description text,
  p_editor_battlenet_account_id text,
  p_editor_battletag text
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_title text,
  poll_description text,
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
begin
  clean_title := btrim(coalesce(p_title, ''));
  clean_description := btrim(coalesce(p_description, ''));

  if length(clean_title) not between 10 and 180 or clean_title ~ '[<>]' then
    raise exception 'Invalid poll title' using errcode = '23514';
  end if;

  if length(clean_description) > 1500 or clean_description ~ '[<>]' then
    raise exception 'Invalid poll rationale' using errcode = '23514';
  end if;

  select *
  into current_poll
  from public.polls
  where id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found' using errcode = 'P0002';
  end if;

  if current_poll.status not in ('draft', 'open', 'hidden') then
    raise exception 'Poll cannot be edited in its current state' using errcode = '23514';
  end if;

  if current_poll.title is not distinct from clean_title
     and coalesce(current_poll.description, '') is not distinct from clean_description then
    return query
    select
      current_poll.id,
      current_poll.slug,
      current_poll.title,
      coalesce(current_poll.description, ''),
      current_poll.status,
      current_poll.updated_at;
    return;
  end if;

  perform set_config('forevervote.admin_poll_edit', '1', true);
  perform set_config('forevervote.editor_account_id', coalesce(p_editor_battlenet_account_id, ''), true);
  perform set_config('forevervote.editor_battletag', coalesce(nullif(btrim(p_editor_battletag), ''), 'Admin'), true);

  update public.polls
  set
    title = clean_title,
    description = clean_description
  where id = p_poll_id
  returning * into current_poll;

  return query
  select
    current_poll.id,
    current_poll.slug,
    current_poll.title,
    coalesce(current_poll.description, ''),
    current_poll.status,
    current_poll.updated_at;
end;
$$;

revoke all on function public.admin_edit_poll_copy(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_edit_poll_copy(uuid,text,text,text,text) to service_role;

comment on table public.poll_edit_history is
  'Append-only audit log for every admin change to a poll title or rationale. History survives poll deletion.';
comment on function public.admin_edit_poll_copy(uuid,text,text,text,text) is
  'Server-only audited admin editor for poll title and rationale/context.';
