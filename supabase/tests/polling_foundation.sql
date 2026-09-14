begin;
do $$
declare
  u uuid; unverified uuid; p uuid; p2 uuid; yes_option uuid; no_option uuid; other_option uuid;
  table_name text; role_name text; operation text; n integer;
begin
  foreach table_name in array array['users','polls','poll_options','votes'] loop
    foreach role_name in array array['anon','authenticated'] loop
      foreach operation in array array['SELECT','INSERT','UPDATE','DELETE'] loop
        if has_table_privilege(role_name, 'public.' || table_name, operation) then
          raise exception 'Unexpected browser grant: % % %', role_name, table_name, operation;
        end if;
      end loop;
    end loop;
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then
      raise exception 'Missing RLS on %', table_name;
    end if;
  end loop;
  insert into public.users(battlenet_account_id,battletag,wow_verified,wow_verified_at)
    values ('test-' || gen_random_uuid(), 'Test#0001',true,now()) returning id into u;
  insert into public.users(battlenet_account_id,battletag)
    values ('test-' || gen_random_uuid(), 'Test#0002') returning id into unverified;
  insert into public.polls(creator_id,title,category) values(u,'Test poll question?','General') returning id into p;
  insert into public.poll_options(poll_id,text,position) values(p,'Yes',1) returning id into yes_option;
  begin
    update public.polls set status='open' where id=p;
    raise exception 'FAIL: published with one option';
  exception when check_violation then null;
  end;
  insert into public.poll_options(poll_id,text,position) values(p,'No',2) returning id into no_option;
  update public.polls set status='open' where id=p;
  insert into public.polls(creator_id,title,category) values(u,'Other test question?','General') returning id into p2;
  insert into public.poll_options(poll_id,text,position) values(p2,'Other',1) returning id into other_option;
  begin
    insert into public.votes(poll_id,user_id,option_id) values(p,unverified,yes_option);
    raise exception 'FAIL: unverified user voted';
  exception when check_violation then null;
  end;
  begin
    insert into public.polls(creator_id,title,category) values(unverified,'Unverified proposal?','General');
    raise exception 'FAIL: unverified user created poll';
  exception when check_violation then null;
  end;
  begin
    insert into public.votes(poll_id,user_id,option_id) values(p,u,other_option);
    raise exception 'FAIL: cross-poll option accepted';
  exception when foreign_key_violation then null;
  end;
  insert into public.votes(poll_id,user_id,option_id) values(p,u,yes_option);
  begin
    insert into public.votes(poll_id,user_id,option_id) values(p,u,no_option);
    raise exception 'FAIL: duplicate vote accepted';
  exception when unique_violation then null;
  end;
  update public.votes set option_id=no_option where poll_id=p and user_id=u;
  select count(*) into n from public.votes where poll_id=p and user_id=u and option_id=no_option;
  if n <> 1 then raise exception 'FAIL: change vote did not preserve one row'; end if;
  begin
    update public.votes set user_id=unverified where poll_id=p and user_id=u;
    raise exception 'FAIL: vote reassignment accepted';
  exception when check_violation then null;
  end;
  begin
    update public.poll_options set text='Changed' where id=yes_option;
    raise exception 'FAIL: published option edited';
  exception when check_violation then null;
  end;
  update public.polls set status='closed' where id=p;
  begin
    update public.votes set option_id=yes_option where poll_id=p and user_id=u;
    raise exception 'FAIL: closed poll vote changed';
  exception when check_violation then null;
  end;
end;
$$;
rollback;
select 'PASS: browser grants, RLS, verification, options, duplicate vote, vote change, immutable identity, closed poll; test data rolled back' as result;
