-- Transactional integration test: all users, roles, keys, and content fixtures roll back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
('00000000-0000-4000-8000-000000000101','qa-owner@origin.invalid',now()),
('00000000-0000-4000-8000-000000000102','qa-admin@origin.invalid',now()),
('00000000-0000-4000-8000-000000000103','qa-outsider@origin.invalid',now());
insert into app_private.editor_emails(email,role) values('qa-owner@origin.invalid','owner'),('qa-admin@origin.invalid','admin');
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated"}';
do $$declare d jsonb;begin
 if not public.editor_access() then raise exception 'Owner editor access failed';end if;
 d=public.owner_workspace('list');
 if d->'keys' is null then raise exception 'Owner list failed';end if;
 perform public.owner_workspace('add_admin','{"email":"qa-new@origin.invalid"}'::jsonb);
 perform public.owner_workspace('create_key',jsonb_build_object('label','QA draft key','hash',encode(sha256(convert_to('ato_'||repeat('a',64),'UTF8')),'hex'),'scope','draft','days',1));
 perform public.owner_workspace('create_key',jsonb_build_object('label','QA publish key','hash',encode(sha256(convert_to('ato_'||repeat('b',64),'UTF8')),'hex'),'scope','publish','days',1));
 if public.owner_workspace('list')::text like '%secret_hash%' then raise exception 'Key hash leaked';end if;
end$$;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated"}';
do $$begin
 if not public.editor_access() then raise exception 'Admin editor access failed';end if;
 begin perform public.owner_workspace('list');raise exception 'Admin gained owner access';exception when insufficient_privilege then null;end;
end$$;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000103","role":"authenticated"}';
do $$begin
 if public.editor_access() then raise exception 'Outsider gained editor access';end if;
 begin perform public.owner_workspace('create_key','{}');raise exception 'Outsider gained owner access';exception when insufficient_privilege then null;end;
end$$;
set local role anon;
set local request.jwt.claims='{}';
do $$declare record jsonb:='{"slug": "qa-agent-draft", "title": "Build a world beyond the frame.", "summary": "Turn a simple idea into a cinematic scene. Start with the subject. Make the atmosphere your own.", "category": "create", "kind": "prompt", "collection": "Cinematic imagery", "model": "Any image model", "cover": "/art/editorial.svg", "variables": [{"key": "subject", "label": "Your subject", "default": "a lone explorer"}, {"key": "setting", "label": "Setting", "default": "an unfamiliar planet with distant mountains"}, {"key": "lighting", "label": "Lighting", "default": "warm side light against a cool atmosphere"}, {"key": "ratio", "label": "Aspect ratio", "default": "4:5"}], "steps": [{"title": "Start with a reference", "description": "Upload a photograph you own or have permission to use. A reference is optional; your subject and setting can carry the composition."}, {"title": "Make it yours", "description": "Change the subject, setting, lighting, and aspect ratio below. Specific choices lead to a clearer brief."}, {"title": "Generate and refine", "description": "Copy the finished prompt into your image tool with your reference attached. Review details, then request one focused change at a time."}], "tags": ["Image prompt", "Composition", "ChatGPT"], "featured": true, "published": false, "publishedAt": "2026-10-29", "readMinutes": 3, "inputImage": "/art/input-landscape.svg", "outputImage": "/art/editorial.svg", "imageLabel": "EDITORIAL COMPOSITE \u00b7 YOUR REFERENCE", "prompt": "Create an original cinematic editorial image featuring {{subject}} in {{setting}}. Use {{lighting}} lighting, a wide sense of scale, layered depth, and realistic surface textures. Preserve a clear focal point, leave space for a title, and use a {{ratio}} composition. Use the attached image only as a compositional reference; do not reproduce its characters, logos, or title."}'::jsonb;result jsonb;begin
 begin perform public.agent_content('ato_'||repeat('c',64),'read');raise exception 'Invalid agent key accepted';exception when insufficient_privilege then null;end;
 result=public.agent_content('ato_'||repeat('a',64),'write',jsonb_build_array(record));
 if result->>'saved'<>'1' then raise exception 'Draft agent write failed';end if;
 if exists(select 1 from public.content where slug='qa-agent-draft') then raise exception 'Private draft leaked to anon';end if;
 begin perform public.agent_content('ato_'||repeat('a',64),'write',jsonb_build_array(record||'{"published":true}'::jsonb));raise exception 'Draft key published';exception when insufficient_privilege then null;end;
 begin perform public.agent_content('ato_'||repeat('a',64),'write',jsonb_build_array(record||'{"slug":"cinematic-worlds","published":false}'::jsonb));raise exception 'Draft key altered a published resource';exception when insufficient_privilege then null;end;
 result=public.agent_content('ato_'||repeat('b',64),'write',jsonb_build_array(record||'{"slug":"qa-agent-published","published":true}'::jsonb));
 if not exists(select 1 from public.content where slug='qa-agent-published') then raise exception 'Publish agent failed';end if;
 begin perform public.owner_workspace('list');raise exception 'Anon gained owner access';exception when insufficient_privilege then null;end;
end$$;
reset role;
update app_private.agent_keys set revoked_at=now() where label='QA draft key';
update app_private.agent_keys set expires_at=now()-interval '1 second' where label='QA publish key';
set local role anon;
do $$begin
 begin perform public.agent_content('ato_'||repeat('a',64),'read');raise exception 'Revoked key accepted';exception when insufficient_privilege then null;end;
 begin perform public.agent_content('ato_'||repeat('b',64),'read');raise exception 'Expired key accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'Owner/admin boundaries, draft/publish permissions, revocation, expiry, and private drafts passed. All fixtures rolled back.' as result;
