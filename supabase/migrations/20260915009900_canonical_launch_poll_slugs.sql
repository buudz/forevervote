-- Give the original launch polls full, canonical URL slugs.
-- We intentionally do not keep /polls/hardcore, /polls/arena, etc. as redirects,
-- so those short paths can later be used as category pages.
-- The poll guard normally blocks slug edits on open polls, so this data migration
-- disables only that guard trigger for the known launch-slug update and re-enables it immediately.

begin;

alter table public.polls disable trigger guard_poll;

update public.polls
set slug = case slug
  when 'arena' then 'should-wow-forever-add-arena-arena'
  when 'raid-size' then 'should-old-40-player-raids-stay-40-player-raid-size'
  when 'skyborne-opinion' then 'do-you-like-the-new-skyborne-race-skyborne-opinion'
  when 'main-class' then 'what-class-will-you-main-main-class'
  when 'future-races' then 'should-more-races-be-introduced-in-the-future-future-races'
  when 'preferred-next-race' then 'what-is-your-preferred-next-race-preferred-next-race'
  when 'main-race' then 'what-will-be-the-race-of-your-main-main-race'
  when 'new-class' then 'should-blizzard-add-a-new-class-to-forever-new-class'
  when 'hardcore' then 'should-hardcore-characters-be-able-to-transfer-after-death-hardcore'
  when 'flying' then 'should-forever-ever-add-flying-flying'
  when 'level-cap' then 'should-forever-stay-level-60-permanently-level-cap'
  else slug
end
where slug in (
  'arena',
  'raid-size',
  'skyborne-opinion',
  'main-class',
  'future-races',
  'preferred-next-race',
  'main-race',
  'new-class',
  'hardcore',
  'flying',
  'level-cap'
);

alter table public.polls enable trigger guard_poll;

commit;
