create table chats (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) not null,
  chat_id uuid not null,
  message jsonb not null,
  created_at timestamptz default now()
)