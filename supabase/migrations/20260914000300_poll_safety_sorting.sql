-- Add stable poll ordering, a neutral vote option, and immutable posted poll copy.
-- `description` is the poll rationale used by the current app/API.

alter table public.polls add column if not exists display_order integer;
alter table public.polls add column if not exists published_at timestamptz;
alter table public.polls add column if not exists updated_at timestamptz not null default now();

alter table public.polls drop constraint if exists polls_display_order_check;
alter table public.polls add constraint polls_display_order_check
  check (display_order is null or display_order between 1 and 100000);

alter table public.polls drop constraint if exists polls_description_check;
alter table public.polls drop constraint if exists polls_rationale_required_check;
alter table public.polls add constraint polls_rationale_required_check
  check (
    status = 'draft'
    or (length(btrim(description)) between 20 and 1500 and description !~ '[<>]')
  );

create index if not exists polls_status_display_order_idx on public.polls(status, display_order, created_at);

update public.polls set display_order = case slug
  when 'arena' then 10
  when 'raid-size' then 20
  when 'new-class' then 30
  when 'hardcore' then 40
  when 'flying' then 50
  when 'level-cap' then 60
  else display_order
end
where slug in ('arena', 'raid-size', 'new-class', 'hardcore', 'flying', 'level-cap');

update public.polls
set published_at = coalesce(published_at, created_at),
    updated_at = coalesce(updated_at, now())
where status <> 'draft';

-- Add a neutral/white-vote option to the current launch polls.
-- This is a controlled maintenance migration, so we temporarily bypass the
-- draft-only option guard while adding an option that does not change the
-- meaning of existing Yes/No votes.
alter table public.poll_options disable trigger guard_poll_options;

with seeded_options(slug, position, text) as (
  values
    ('arena', 3, 'Don''t care'),
    ('raid-size', 3, 'Don''t care'),
    ('new-class', 3, 'Don''t care'),
    ('hardcore', 3, 'Don''t care'),
    ('flying', 3, 'Don''t care'),
    ('level-cap', 3, 'Don''t care')
)
insert into public.poll_options (poll_id, position, text)
select polls.id, seeded_options.position, seeded_options.text
from seeded_options
join public.polls on polls.slug = seeded_options.slug
on conflict (poll_id, position) do update set
  text = excluded.text
where lower(btrim(public.poll_options.text)) in ('don''t care', 'no strong opinion');

alter table public.poll_options enable trigger guard_poll_options;

create or replace function public.guard_poll() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare eligible boolean; option_count integer;
begin
  if TG_OP = 'UPDATE' then
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id then
      raise exception 'Poll identity cannot be changed' using errcode = '23514';
    end if;

    if old.status <> 'draft' and (
      new.slug is distinct from old.slug
      or new.title is distinct from old.title
      or new.description is distinct from old.description
    ) then
      raise exception 'Posted poll title and rationale cannot be changed' using errcode = '23514';
    end if;

    new.created_at := old.created_at;
    new.published_at := old.published_at;
  end if;

  if new.status <> 'draft' then
    if length(btrim(new.title)) not between 10 and 180 then
      raise exception 'Posted polls need a title between 10 and 180 characters' using errcode = '23514';
    end if;

    if length(btrim(new.description)) not between 20 and 1500 then
      raise exception 'Posted polls need a short rationale between 20 and 1500 characters' using errcode = '23514';
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
    if option_count not between 2 and 5 then
      raise exception 'Open polls need 2 to 5 options' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

comment on column public.polls.description is 'Poll rationale. Required before posting and immutable after a poll leaves draft.';
comment on column public.polls.display_order is 'Manual editorial order for the calm default Explore view.';
comment on column public.polls.published_at is 'First time the poll left draft state.';
