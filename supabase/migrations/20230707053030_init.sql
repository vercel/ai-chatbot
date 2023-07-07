create table "public"."chats" (
    "id" text not null,
    "user_id" uuid null default auth.uid (),
    "payload" jsonb
);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."chats" add constraint "chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_user_id_fkey";

-- RLS
alter table "public"."chats" enable row level security;

create policy "Allow public read for shared chats"
on "public"."chats"
as permissive
for select
to public
using (((payload ->> 'sharePath'::text) IS NOT NULL));

create policy "Allow full access to own chats"
on "public"."chats"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



