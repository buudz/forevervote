-- Give the multi-answer submission RPC a unique PostgREST name.
-- This avoids ambiguity/schema-cache issues from the legacy overloaded submit_poll functions.

create or replace function public.submit_poll_v2(
  p_creator_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_category text,
  p_options text[],
  p_allow_multiple_answers boolean
)
returns table (
  poll_id uuid,
  poll_slug text,
  poll_status text,
  submitted_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from public.submit_poll(
    p_creator_id,
    p_slug,
    p_title,
    p_description,
    p_category,
    p_options,
    p_allow_multiple_answers
  );
$$;

revoke all on function public.submit_poll_v2(uuid,text,text,text,text,text[],boolean)
  from public, anon, authenticated;
grant execute on function public.submit_poll_v2(uuid,text,text,text,text,text[],boolean)
  to service_role;

comment on function public.submit_poll_v2(uuid,text,text,text,text,text[],boolean) is
  'Unique PostgREST entrypoint for ForeverVote poll submissions, including multi-answer mode.';
