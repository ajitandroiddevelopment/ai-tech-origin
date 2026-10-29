-- AI Tech Origin: public reading, account-owned saves, and restricted editorial tools.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;
create table app_private.editor_emails(email text primary key check(email=lower(email)));
-- Add owner email addresses through the authorized dashboard after migration; keep them out of source control.
alter table app_private.editor_emails enable row level security;
revoke all on app_private.editor_emails from anon, authenticated;

create function app_private.is_editor() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join app_private.editor_emails e on lower(u.email)=e.email where u.id=(select auth.uid()) and u.email_confirmed_at is not null);
$$;
revoke all on function app_private.is_editor() from public;
grant execute on function app_private.is_editor() to anon,authenticated;
create function public.editor_access() returns boolean language sql stable security invoker set search_path='' as $$select app_private.is_editor();$$;
grant execute on function public.editor_access() to authenticated;

create table public.content(slug text primary key check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),payload jsonb not null check(jsonb_typeof(payload)='object' and payload->>'slug'=slug),published boolean not null default false,updated_at timestamptz not null default now());
alter table public.content enable row level security;
grant select on public.content to anon,authenticated;
grant insert,update,delete on public.content to authenticated;
create policy content_read on public.content for select to anon,authenticated using(published or (select app_private.is_editor()));
create policy content_insert on public.content for insert to authenticated with check((select app_private.is_editor()));
create policy content_update on public.content for update to authenticated using((select app_private.is_editor())) with check((select app_private.is_editor()));
create policy content_delete on public.content for delete to authenticated using((select app_private.is_editor()));
create index content_published on public.content(published,updated_at desc);

create table public.saved_items(user_id uuid not null references auth.users(id) on delete cascade,slug text not null check(length(slug)<=100),created_at timestamptz not null default now(),primary key(user_id,slug));
alter table public.saved_items enable row level security;
grant select,insert,update,delete on public.saved_items to authenticated;
create policy own_saves on public.saved_items for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

create table public.newsletter_subscribers(id uuid primary key default gen_random_uuid(),email text not null unique check(length(email)<=254 and position('@' in email)>1),consent_at timestamptz not null default now(),status text not null default 'subscribed' check(status in ('subscribed','unsubscribed')),unsubscribe_token uuid not null default gen_random_uuid());
alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon,authenticated;
grant select,update on public.newsletter_subscribers to authenticated;
create policy editor_subscribers on public.newsletter_subscribers for all to authenticated using((select app_private.is_editor())) with check((select app_private.is_editor()));
-- Deliberately narrow anonymous signup API; it returns no subscriber data.
create function app_private.join_newsletter(subscriber_email text) returns void language plpgsql security definer set search_path='' as $$begin
 if length(subscriber_email)>254 or subscriber_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email';end if;
 insert into public.newsletter_subscribers(email) values(lower(trim(subscriber_email))) on conflict(email) do nothing;
end;$$;
revoke all on function app_private.join_newsletter(text) from public;
grant execute on function app_private.join_newsletter(text) to anon,authenticated;
create function public.join_newsletter(subscriber_email text) returns void language sql security invoker set search_path='' as $$select app_private.join_newsletter(subscriber_email);$$;
grant execute on function public.join_newsletter(text) to anon,authenticated;

create table public.visitor_events(id bigint generated always as identity primary key,visitor uuid not null,event text not null check(event in ('page_view','open','copy','save','unsave')),slug text,path text not null,created_at timestamptz not null default now());
alter table public.visitor_events enable row level security;
revoke all on public.visitor_events from anon,authenticated;
grant select on public.visitor_events to authenticated;
create policy editor_events on public.visitor_events for select to authenticated using((select app_private.is_editor()));
create index visitor_events_date on public.visitor_events(created_at desc);
create index visitor_events_visitor_date on public.visitor_events(visitor,created_at desc);
create function app_private.record_visit(visitor uuid,event_name text,content_slug text,page_path text) returns void language plpgsql security definer set search_path='' as $$declare used integer;begin
 if event_name not in ('page_view','open','copy','save','unsave') or length(page_path)>200 or length(content_slug)>100 then raise exception 'Invalid event';end if;
 perform pg_advisory_xact_lock(hashtext(visitor::text));
 select count(*) into used from public.visitor_events e where e.visitor=record_visit.visitor and e.created_at>now()-interval '1 day';
 if used>=300 then return;end if;
 insert into public.visitor_events(visitor,event,slug,path) values(visitor,event_name,content_slug,page_path);
end;$$;
revoke all on function app_private.record_visit(uuid,text,text,text) from public;
grant execute on function app_private.record_visit(uuid,text,text,text) to anon,authenticated;
create function public.record_visit(visitor uuid,event_name text,content_slug text,page_path text) returns void language sql security invoker set search_path='' as $$select app_private.record_visit(visitor,event_name,content_slug,page_path);$$;
grant execute on function public.record_visit(uuid,text,text,text) to anon,authenticated;

create function app_private.editor_metrics() returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 if not app_private.is_editor() then raise exception 'Editor access required';end if;
 select jsonb_build_object('visitors',(select count(distinct visitor) from public.visitor_events where created_at>now()-interval '30 days'),'views',(select count(*) from public.visitor_events where event='page_view' and created_at>now()-interval '30 days'),'copies',(select count(*) from public.visitor_events where event='copy' and created_at>now()-interval '30 days'),'saves',(select count(*) from public.visitor_events where event='save' and created_at>now()-interval '30 days'),'subscribers',(select count(*) from public.newsletter_subscribers where status='subscribed'),'daily',(select coalesce(jsonb_agg(d),'[]'::jsonb) from (select created_at::date as day,count(*) as views from public.visitor_events where event='page_view' and created_at>now()-interval '30 days' group by 1 order by 1)d),'top',(select coalesce(jsonb_agg(t),'[]'::jsonb) from(select slug,count(*) as opens from public.visitor_events where event='open' and slug is not null group by slug order by count(*) desc limit 10)t)) into result;
 return result;
end;$$;
revoke all on function app_private.editor_metrics() from public;
grant execute on function app_private.editor_metrics() to authenticated;
create function public.editor_metrics() returns jsonb language sql stable security invoker set search_path='' as $$select app_private.editor_metrics();$$;
grant execute on function public.editor_metrics() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('origin-media','origin-media',true,12582912,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy origin_media_read on storage.objects for select to anon,authenticated using(bucket_id='origin-media');
create policy origin_media_write on storage.objects for insert to authenticated with check(bucket_id='origin-media' and (select app_private.is_editor()));
create policy origin_media_update on storage.objects for update to authenticated using(bucket_id='origin-media' and (select app_private.is_editor())) with check(bucket_id='origin-media' and (select app_private.is_editor()));
