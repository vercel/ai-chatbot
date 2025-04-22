-- Drop tables in order of dependency

DROP TABLE IF EXISTS "public"."votes";
DROP TABLE IF EXISTS "public"."messages";
DROP TABLE IF EXISTS "public"."chats";

DROP TABLE IF EXISTS "public"."Vote";
DROP TABLE IF EXISTS "public"."Message";

DROP TABLE IF EXISTS "public"."webhook_logs";
DROP TABLE IF EXISTS "public"."callback_debug_logs"; 