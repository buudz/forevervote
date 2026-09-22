create sequence public.polls_public_number_seq as bigint start with 1;

alter table public.polls
  add column public_number bigint
  not null
  default nextval('public.polls_public_number_seq');

alter sequence public.polls_public_number_seq
  owned by public.polls.public_number;

alter table public.polls
  add constraint polls_public_number_positive check (public_number > 0),
  add constraint polls_public_number_key unique (public_number);
