-- Preserve append-only creator behavior while allowing parent poll cleanup to cascade.
drop trigger if exists guard_poll_context_update_immutable on public.poll_context_updates;

create trigger guard_poll_context_update_immutable
before update on public.poll_context_updates
for each row execute function public.guard_poll_context_update_immutable();

comment on table public.poll_context_updates is
  'Creator updates are immutable after posting through the application. Rows may only disappear when their parent poll is permanently deleted.';
