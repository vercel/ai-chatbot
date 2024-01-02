create table chats (
  id text primary key,
  title text not null,
  messages jsonb not null,
  user_id uuid references users(id) not null,
  created_at timestamptz default now()
)
