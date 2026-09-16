-- Battle.net authentication is the ForeverVote participation gate.
-- Blizzard's profile endpoint can return 404 for legitimate WoW players, so Classic profile visibility is informational only.

update public.users
set
  wow_verified = true,
  wow_verified_at = coalesce(wow_verified_at, created_at, now())
where battlenet_account_id is not null
  and wow_verified is distinct from true;

comment on column public.users.wow_verified is
  'Legacy eligibility flag. True means this identity was established through trusted Battle.net OAuth. WoW profile namespace checks are informational and are not required to vote or submit polls.';

comment on table public.votes is
  'Count actual rows for results. One row per Battle.net-backed user per poll; no editable vote totals.';
