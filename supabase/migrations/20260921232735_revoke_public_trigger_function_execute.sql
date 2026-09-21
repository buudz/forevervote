revoke execute on function public.audit_poll_copy_edit() from public, anon, authenticated;
revoke execute on function public.award_vote_reputation() from public, anon, authenticated;
revoke execute on function public.block_poll_edit_history_mutation() from public, anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
