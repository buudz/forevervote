-- Seed the initial ForeverVote poll board and align live poll categories with the UI.
-- Run after 20260914000100_polling_foundation.sql.

alter table public.polls add column if not exists slug text;

alter table public.polls drop constraint if exists polls_slug_check;
alter table public.polls add constraint polls_slug_check
  check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create unique index if not exists polls_slug_unique_idx on public.polls(slug);

-- Keep the older backend category values valid for any existing rows, while allowing the new UI category PvE.
alter table public.polls drop constraint if exists polls_category_check;
alter table public.polls add constraint polls_category_check
  check (category in ('WoW Forever','Classes','PvP','Raids','Dungeons','World','Professions','QoL','Items','General','PvE'));

insert into public.users (battlenet_account_id, battletag, wow_verified, wow_verified_at)
values ('forevervote-system', 'ForeverVote#0000', true, now())
on conflict (battlenet_account_id) do update set
  battletag = excluded.battletag,
  wow_verified = true,
  wow_verified_at = coalesce(public.users.wow_verified_at, now());

with system_user as (
  select id from public.users where battlenet_account_id = 'forevervote-system'
), seeded(slug, category, title, description) as (
  values
    ('arena', 'PvP', 'Should WoW Forever eventually add Arena?', 'A place for small-team competition, or a step away from the Classic experience?'),
    ('raid-size', 'PvE', 'Should old 40-player raids stay 40-player?', 'Preserve the scale of the originals, or make room for smaller groups?'),
    ('new-class', 'General', 'Should Blizzard add a new class to Forever?', 'New ways to play, new class fantasies, and a different balance to strike.'),
    ('hardcore', 'General', 'Should Hardcore characters be able to transfer after death?', 'A final end to the adventure, or a new beginning on a regular realm?'),
    ('flying', 'World', 'Should Forever ever add flying?', 'Take to the skies, or keep exploration firmly on the ground?'),
    ('level-cap', 'General', 'Should Forever stay level 60 permanently?', 'Expand the adventure without raising the level cap?')
)
insert into public.polls (creator_id, slug, category, title, description, status)
select system_user.id, seeded.slug, seeded.category, seeded.title, seeded.description, 'draft'
from seeded cross join system_user
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = 'draft';

with seeded_options(slug, position, text) as (
  values
    ('arena', 1, 'Yes'), ('arena', 2, 'No'),
    ('raid-size', 1, 'Yes'), ('raid-size', 2, 'No'),
    ('new-class', 1, 'Yes'), ('new-class', 2, 'No'),
    ('hardcore', 1, 'Yes'), ('hardcore', 2, 'No'),
    ('flying', 1, 'Yes'), ('flying', 2, 'No'),
    ('level-cap', 1, 'Yes'), ('level-cap', 2, 'No')
)
insert into public.poll_options (poll_id, position, text)
select polls.id, seeded_options.position, seeded_options.text
from seeded_options
join public.polls on polls.slug = seeded_options.slug
on conflict (poll_id, position) do update set
  text = excluded.text;

update public.polls
set status = 'open'
where slug in ('arena', 'raid-size', 'new-class', 'hardcore', 'flying', 'level-cap');
