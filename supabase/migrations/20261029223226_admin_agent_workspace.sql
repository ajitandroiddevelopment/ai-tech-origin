-- Owner-managed admins and scoped content automation. No auth passwords are stored here.
begin;
alter table app_private.editor_emails add column role text not null default 'admin' check(role in ('owner','admin'));
alter table app_private.editor_emails add column created_at timestamptz not null default now();
-- The existing one-person allowlist is the bootstrap owner. Abort rather than choose among multiple editors.
do $$begin
 if (select count(*) from app_private.editor_emails) <> 1 then raise exception 'Bootstrap requires exactly one existing editor; explicitly choose the owner first'; end if;
 update app_private.editor_emails set role='owner';
end$$;
create function app_private.is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join app_private.editor_emails e on lower(u.email)=e.email where u.id=(select auth.uid()) and u.email_confirmed_at is not null and e.role='owner');
$$;
revoke all on function app_private.is_owner() from public;
grant execute on function app_private.is_owner() to authenticated;
create table app_private.agent_keys(id uuid primary key default gen_random_uuid(),label text not null check(length(label) between 1 and 100),secret_hash text not null unique check(length(secret_hash)=64),scope text not null check(scope in ('draft','publish')),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),expires_at timestamptz not null,revoked_at timestamptz,last_used_at timestamptz);
alter table app_private.agent_keys enable row level security;
revoke all on app_private.agent_keys from public,anon,authenticated;
create table app_private.activity_log(id bigint generated always as identity primary key,actor uuid,agent_id uuid,action text not null,subject text,created_at timestamptz not null default now());
alter table app_private.activity_log enable row level security;
revoke all on app_private.activity_log from public,anon,authenticated;
create function app_private.owner_workspace(operation text,details jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare member_email text; key_id uuid; result jsonb;
begin
 if not app_private.is_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
 if operation='list' then
  return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object('verified',exists(select 1 from auth.users u where lower(u.email)=e.email and u.email_confirmed_at is not null)) order by e.role desc,e.email),'[]'::jsonb) from app_private.editor_emails e),'keys',(select coalesce(jsonb_agg(jsonb_build_object('id',k.id,'label',k.label,'scope',k.scope,'created_at',k.created_at,'expires_at',k.expires_at,'revoked_at',k.revoked_at,'last_used_at',k.last_used_at) order by k.created_at desc),'[]'::jsonb) from app_private.agent_keys k),'activity',(select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) from (select action,subject,created_at from app_private.activity_log order by created_at desc limit 50)a));
 elsif operation='add_admin' then
  member_email=lower(trim(details->>'email'));
  if member_email is null or length(member_email)>254 or member_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email required';end if;
  insert into app_private.editor_emails(email,role) values(member_email,'admin') on conflict(email) do nothing;
  insert into app_private.activity_log(actor,action,subject) values(auth.uid(),'admin_added',member_email);
 elsif operation='remove_admin' then
  member_email=lower(trim(details->>'email'));
  if exists(select 1 from app_private.editor_emails where email=member_email and role='owner') then raise exception 'The owner cannot be removed here';end if;
  delete from app_private.editor_emails where email=member_email and role='admin';
  insert into app_private.activity_log(actor,action,subject) values(auth.uid(),'admin_removed',member_email);
 elsif operation='create_key' then
  if details->>'label' is null or length(trim(details->>'label')) not between 1 and 100 or details->>'hash' is null or details->>'hash' !~ '^[a-f0-9]{64}$' or details->>'scope' is null or details->>'scope' not in ('draft','publish') or details->>'days' is null or (details->>'days')::integer not between 1 and 90 then raise exception 'Invalid key settings';end if;
  insert into app_private.agent_keys(label,secret_hash,scope,created_by,expires_at) values(trim(details->>'label'),details->>'hash',details->>'scope',auth.uid(),now()+make_interval(days=>(details->>'days')::integer)) returning id into key_id;
  insert into app_private.activity_log(actor,agent_id,action,subject) values(auth.uid(),key_id,'agent_key_created',details->>'label');
  return jsonb_build_object('id',key_id);
 elsif operation='revoke_key' then
  update app_private.agent_keys set revoked_at=now() where id=(details->>'id')::uuid;
  insert into app_private.activity_log(actor,agent_id,action) values(auth.uid(),(details->>'id')::uuid,'agent_key_revoked');
 else raise exception 'Unknown operation';end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function app_private.owner_workspace(text,jsonb) from public;
grant execute on function app_private.owner_workspace(text,jsonb) to authenticated;
create function public.owner_workspace(operation text,details jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.owner_workspace(operation,details);$$;
revoke all on function public.owner_workspace(text,jsonb) from public,anon;
grant execute on function public.owner_workspace(text,jsonb) to authenticated;
create function app_private.agent_content(agent_token text,operation text,records jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare access_key app_private.agent_keys; item jsonb; field text; image_url text; total integer:=0;
begin
 if agent_token is null or agent_token !~ '^ato_[a-f0-9]{64}$' then raise exception 'Agent access denied' using errcode='42501';end if;
 select k.* into access_key from app_private.agent_keys k join auth.users u on u.id=k.created_by join app_private.editor_emails e on e.email=lower(u.email) and e.role='owner' where k.secret_hash=encode(sha256(convert_to(agent_token,'UTF8')),'hex') and k.revoked_at is null and k.expires_at>now() and u.email_confirmed_at is not null for update of k;
 if not found then raise exception 'Agent access denied' using errcode='42501';end if;
 if (select count(*) from app_private.activity_log where agent_id=access_key.id and created_at>now()-interval '1 hour')>=300 then raise exception 'Hourly request limit reached';end if;
 update app_private.agent_keys set last_used_at=now() where id=access_key.id;
 if operation='read' then
  insert into app_private.activity_log(agent_id,action) values(access_key.id,'agent_read');
  return jsonb_build_object('items',(select coalesce(jsonb_agg(payload || jsonb_build_object('published',published)),'[]'::jsonb) from public.content));
 elsif operation<>'write' then raise exception 'Unknown operation';end if;
 if records is null or jsonb_typeof(records)<>'array' or jsonb_array_length(records) not between 1 and 100 or octet_length(records::text)>1000000 then raise exception 'Supply 1–100 content records under 1 MB';end if;
 for item in select value from jsonb_array_elements(records) loop
  if jsonb_typeof(item)<>'object' or item->>'slug' is null or item->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(item->>'slug')>100 or coalesce(length(item->>'title'),0) not between 1 and 200 or coalesce(length(item->>'summary'),0) not between 1 and 1000 or item->>'kind' is null or item->>'kind' not in ('prompt','guide','newsletter') or item->>'category' is null or item->>'category' not in ('create','work','learn') or jsonb_typeof(item->'published') is distinct from 'boolean' then raise exception 'Invalid content';end if;
  foreach field in array array['slug','title','summary','collection','model','prompt','publishedAt'] loop
   if jsonb_typeof(item->field) is distinct from 'string' then raise exception 'Invalid text field';end if;
  end loop;
  if length(item->>'prompt')>30000 or length(item->>'collection')>100 then raise exception 'Text field too long';end if;
  foreach field in array array['variables','steps','tags'] loop
   if jsonb_typeof(item->field) is distinct from 'array' or jsonb_array_length(item->field)>30 then raise exception 'Invalid content lists';end if;
  end loop;
  foreach field in array array['cover','inputImage','outputImage'] loop
   image_url=item->>field;
   if image_url is not null and image_url<>'' and not (image_url ~ '^/[^/]' and position(chr(92) in image_url)=0 or image_url ~ '^https://[^/@]+(/|$)') then raise exception 'Invalid image URL';end if;
  end loop;
  if access_key.scope='draft' and (item->>'published')::boolean then raise exception 'This key can save drafts only' using errcode='42501';end if;
  insert into public.content as c(slug,payload,published) values(item->>'slug',item,(item->>'published')::boolean)
  on conflict(slug) do update set payload=excluded.payload,published=excluded.published,updated_at=now() where access_key.scope='publish' or not c.published;
  if not found then raise exception 'Draft keys cannot change published resources' using errcode='42501';end if;
  insert into app_private.activity_log(agent_id,action,subject) values(access_key.id,case when (item->>'published')::boolean then 'agent_published' else 'agent_draft_saved' end,item->>'slug');
  total=total+1;
 end loop;
 return jsonb_build_object('saved',total);
end;$$;
revoke all on function app_private.agent_content(text,text,jsonb) from public;
grant execute on function app_private.agent_content(text,text,jsonb) to anon,authenticated;
create function public.agent_content(agent_token text,operation text,records jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.agent_content(agent_token,operation,records);$$;
revoke all on function public.agent_content(text,text,jsonb) from public;
grant execute on function public.agent_content(text,text,jsonb) to anon,authenticated;
commit;
