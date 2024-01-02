create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  profile_image text,
  status boolean default true,
  additional_info jsonb null,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create extension if not exists moddatetime schema extensions;
create trigger handle_updated_at before update on users
  for each row execute procedure moddatetime (updated_at);
