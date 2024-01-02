create table chats (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  messages jsonb not null,
  user_id uuid references users(id) not null,
  created_at timestamptz default now()
)
