-- Token-based unsubscribe: no email addresses or subscriber details are exposed.
create function app_private.leave_newsletter(token uuid) returns void language sql security definer set search_path='' as $$
 update public.newsletter_subscribers set status='unsubscribed' where unsubscribe_token=token;
$$;
revoke all on function app_private.leave_newsletter(uuid) from public;
grant execute on function app_private.leave_newsletter(uuid) to anon,authenticated;
create function public.leave_newsletter(token uuid) returns void language sql security invoker set search_path='' as $$select app_private.leave_newsletter(token);$$;
grant execute on function public.leave_newsletter(uuid) to anon,authenticated;
