-- Expand the poll catalog, add RolePlay/Hardcore categories, support more option-heavy polls,
-- and keep posted poll copy immutable except for this controlled pre-launch content correction.

alter table public.polls add column if not exists allow_custom_answers boolean not null default false;
alter table public.poll_options add column if not exists is_neutral boolean not null default false;

alter table public.polls drop constraint if exists polls_category_check;
alter table public.polls add constraint polls_category_check
  check (category in ('WoW Forever','Classes','PvP','Raids','Dungeons','World','Professions','QoL','Items','General','PvE','RolePlay','Hardcore'));

alter table public.poll_options drop constraint if exists poll_options_position_check;
alter table public.poll_options add constraint poll_options_position_check
  check (position between 1 and 20);

-- Existing neutral options were created before is_neutral existed.
update public.poll_options
set is_neutral = true
where lower(btrim(text)) in ('don''t care', 'no preference', 'undecided', 'no strong opinion');

-- Controlled pre-launch copy/category/display-order maintenance for existing seed polls.
-- The normal trigger remains the rule: posted poll slug/title/rationale cannot be edited by app flows.
alter table public.polls disable trigger guard_poll;

update public.polls set
  title = 'Should WoW Forever add Arena?',
  display_order = 10,
  updated_at = now()
where slug = 'arena';

update public.polls set display_order = case slug
  when 'raid-size' then 20
  when 'new-class' then 80
  when 'hardcore' then 90
  when 'flying' then 100
  when 'level-cap' then 110
  else display_order
end,
category = case slug
  when 'hardcore' then 'Hardcore'
  else category
end,
updated_at = now()
where slug in ('raid-size', 'new-class', 'hardcore', 'flying', 'level-cap');

alter table public.polls enable trigger guard_poll;

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
    if option_count not between 2 and 20 then
      raise exception 'Open polls need 2 to 20 options' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

with seed_author as (
  select id from public.users where battlenet_account_id = 'forevervote-system'
), seeded(slug, category, title, description, display_order, allow_custom_answers) as (
  values
    ('skyborne-opinion', 'RolePlay', 'Do you like the new Skyborne race?', 'Share whether Skyborne feels like a good fit for World of Warcraft: Forever.', 30, false),
    ('main-class', 'General', 'What class will you main?', 'Vote for the class you are most likely to play as your main character.', 40, false),
    ('future-races', 'RolePlay', 'Should more races be introduced in the future?', 'Should WoW Forever keep the playable race list focused, or expand it later?', 50, false),
    ('preferred-next-race', 'RolePlay', 'What is your preferred next race?', 'Choose the race you would most like to see added next if the playable roster expands.', 60, false),
    ('main-race', 'RolePlay', 'What will be the race of your main?', 'Pick the race you plan to main when you start playing.', 70, false)
)
insert into public.polls (creator_id, slug, category, title, description, status, display_order, allow_custom_answers)
select seed_author.id, seeded.slug, seeded.category, seeded.title, seeded.description, 'draft', seeded.display_order, seeded.allow_custom_answers
from seeded cross join seed_author
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  display_order = excluded.display_order,
  allow_custom_answers = excluded.allow_custom_answers;

with seeded_options(slug, position, text, is_neutral) as (
  values
    ('skyborne-opinion', 1, 'Yes', false),
    ('skyborne-opinion', 2, 'No', false),
    ('skyborne-opinion', 3, 'Don''t care', true),

    ('main-class', 1, 'Warrior', false),
    ('main-class', 2, 'Paladin', false),
    ('main-class', 3, 'Hunter', false),
    ('main-class', 4, 'Rogue', false),
    ('main-class', 5, 'Priest', false),
    ('main-class', 6, 'Shaman', false),
    ('main-class', 7, 'Mage', false),
    ('main-class', 8, 'Warlock', false),
    ('main-class', 9, 'Druid', false),
    ('main-class', 10, 'Undecided', true),

    ('future-races', 1, 'Yes', false),
    ('future-races', 2, 'No', false),
    ('future-races', 3, 'Don''t care', true),

    ('preferred-next-race', 1, 'Ogres', false),
    ('preferred-next-race', 2, 'High Elves', false),
    ('preferred-next-race', 3, 'Blood Elves', false),
    ('preferred-next-race', 4, 'Draenei', false),
    ('preferred-next-race', 5, 'Goblins', false),
    ('preferred-next-race', 6, 'Worgen', false),
    ('preferred-next-race', 7, 'Murloc', false),
    ('preferred-next-race', 8, 'Naga', false),
    ('preferred-next-race', 9, 'Dracthyr', false),
    ('preferred-next-race', 10, 'Pandaren', false),
    ('preferred-next-race', 11, 'No preference', true),

    ('main-race', 1, 'Human', false),
    ('main-race', 2, 'Dwarf', false),
    ('main-race', 3, 'Night Elf', false),
    ('main-race', 4, 'Gnome', false),
    ('main-race', 5, 'Orc', false),
    ('main-race', 6, 'Undead', false),
    ('main-race', 7, 'Tauren', false),
    ('main-race', 8, 'Troll', false),
    ('main-race', 9, 'Skyborne', false),
    ('main-race', 10, 'Undecided', true)
)
insert into public.poll_options (poll_id, position, text, is_neutral)
select polls.id, seeded_options.position, seeded_options.text, seeded_options.is_neutral
from seeded_options
join public.polls on polls.slug = seeded_options.slug
on conflict (poll_id, position) do update set
  text = excluded.text,
  is_neutral = excluded.is_neutral;

update public.polls
set status = 'open'
where slug in ('skyborne-opinion', 'main-class', 'future-races', 'preferred-next-race', 'main-race');

comment on column public.polls.allow_custom_answers is 'Future poll-creator toggle for allowing custom/write-in answers. Not enabled in the current MVP UI.';
comment on column public.poll_options.is_neutral is 'Marks white-vote choices such as Don''t care, No preference, or Undecided.';
