-- Keep the deployed multi-answer vote RPC unambiguous under PL/pgSQL output parameters.
create or replace function public.cast_poll_vote(
  p_poll_id uuid,
  p_user_id uuid,
  p_option_id uuid
)
returns table (
  vote_id uuid,
  option_id uuid,
  allow_multiple_answers boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  eligible boolean;
  poll_status text;
  multiple_answers boolean;
  selected_neutral boolean;
  saved_vote public.votes%rowtype;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_poll_id::text || ':' || p_user_id::text, 0)
  );

  select u.wow_verified
  into eligible
  from public.users u
  where u.id = p_user_id
  for share;

  if eligible is distinct from true then
    raise exception 'Verified WoW profile required' using errcode = '23514';
  end if;

  select p.status, p.allow_multiple_answers
  into poll_status, multiple_answers
  from public.polls p
  where p.id = p_poll_id
  for share;

  if poll_status is distinct from 'open' then
    raise exception 'Poll is not open' using errcode = '23514';
  end if;

  select po.is_neutral
  into selected_neutral
  from public.poll_options po
  where po.poll_id = p_poll_id
    and po.id = p_option_id;

  if selected_neutral is null then
    raise exception 'Invalid poll option' using errcode = '23514';
  end if;

  if multiple_answers is not true then
    delete from public.votes v
    where v.poll_id = p_poll_id
      and v.user_id = p_user_id
      and v.option_id <> p_option_id;
  elsif selected_neutral is true then
    delete from public.votes v
    where v.poll_id = p_poll_id
      and v.user_id = p_user_id
      and v.option_id <> p_option_id;
  else
    delete from public.votes v
    using public.poll_options po
    where v.poll_id = p_poll_id
      and v.user_id = p_user_id
      and po.poll_id = v.poll_id
      and po.id = v.option_id
      and po.is_neutral is true;
  end if;

  insert into public.votes (poll_id, user_id, option_id)
  values (p_poll_id, p_user_id, p_option_id)
  on conflict on constraint one_selection_per_option_per_user
  do update set updated_at = now()
  returning * into saved_vote;

  return query
  select saved_vote.id, saved_vote.option_id, multiple_answers;
end;
$$;

revoke all on function public.cast_poll_vote(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.cast_poll_vote(uuid,uuid,uuid) to service_role;
