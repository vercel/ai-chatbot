-- Delete orphaned Chat records that reference non-existent users
DELETE FROM "Chat"
WHERE "userId" NOT IN (SELECT id FROM "User");