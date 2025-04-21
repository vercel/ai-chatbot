CREATE INDEX IF NOT EXISTS "chat_user_id_idx" ON "Chat" ("userId");
CREATE INDEX IF NOT EXISTS "message_v2_chat_id_idx" ON "Message_v2" ("chatId");