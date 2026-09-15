-- Allow admins to restore already-published polls from the unpublished recycle bin
-- even if a later title-length rule would block the unchanged legacy title.
-- New polls, edited titles, and first-time publishes still keep the 10-90 character title rule.

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
  legacy_unpublished_restore boolean;
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
    legacy_unpublished_restore := old.status = 'hidden'
      and old.trash_reason = 'unpublished'
      and new.status = 'open'
      and new.title is not distinct from old.title
      and new.description is not distinct from old.description
      and new.category is not distinct from old.category
      and new.allow_multiple_answers is not distinct from old.allow_multiple_answers;

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
  else
    legacy_unpublished_restore := false;
  end if;

  if new.status <> 'draft' then
    if ((length(btrim(new.title)) not between 10 and 90) and legacy_unpublished_restore is not true)
       or new.title ~ '[<>]' then
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
