create table users (
  id bigint primary key generated always as identity,
  name text not null,
  email text not null,
  profile_pic text,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create extension if not exists moddatetime schema extensions;
create trigger handle_updated_at before update on users
  for each row execute procedure moddatetime (updated_at);
