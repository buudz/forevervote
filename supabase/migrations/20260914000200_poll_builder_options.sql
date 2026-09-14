-- Support the public poll builder taxonomy and multi-choice polls such as class selection.
-- The production database is empty at the time this migration is introduced.

alter table public.poll_options
  drop constraint poll_options_position_check;

alter table public.poll_options
  add constraint poll_options_position_check
  check (position between 1 and 12);

alter table public.polls
  drop constraint polls_category_check;

alter table public.polls
  add constraint polls_category_check
  check (category in ('PvE','PvP','World','General'));

create or replace function public.guard_poll() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  eligible boolean;
  option_count integer;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id then
      raise exception 'Poll identity cannot be changed' using errcode = '23514';
    end if;
  end if;

  if TG_OP = 'INSERT' then
    select wow_verified into eligible from public.users where id = new.creator_id for share;
    if eligible is distinct from true then
      raise exception 'Verified WoW profile required to create or publish polls' using errcode = '23514';
    end if;
  elsif new.status = 'open' and old.status is distinct from 'open' then
    select wow_verified into eligible from public.users where id = new.creator_id for share;
    if eligible is distinct from true then
      raise exception 'Verified WoW profile required to create or publish polls' using errcode = '23514';
    end if;
  end if;

  if new.status = 'open' then
    select count(*) into option_count from public.poll_options where poll_id = new.id;
    if option_count not between 2 and 12 then
      raise exception 'Open polls need 2 to 12 options' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
