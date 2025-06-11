-- Начало единой транзакции для безопасного удаления.
BEGIN;

-- Шаг 1: Создаем ВРЕМЕННУЮ таблицу для хранения ID всех пользователей, подлежащих удалению.
CREATE TEMPORARY TABLE users_to_delete (
    id UUID PRIMARY KEY
) ON COMMIT DROP;

-- Шаг 2: Наполняем временную таблицу ID гостевых и тестовых пользователей.
-- Мы ищем пользователей, у которых email начинается с 'guest-' ИЛИ заканчивается на '@playwright.com'.
INSERT INTO users_to_delete (id)
SELECT id FROM "User" WHERE email LIKE 'guest-%' OR email LIKE '%@playwright.com';

-- Шаг 3: Последовательно удаляем все связанные данные, используя ID из нашей временной таблицы.

-- 3.1. Удаляем предложения (Suggestions), созданные этими пользователями.
DELETE FROM "Suggestion"
WHERE "userId" IN (SELECT id FROM users_to_delete);

-- 3.2. Удаляем сообщения (Message_v2) из чатов, принадлежащих этим пользователям.
DELETE FROM "Message_v2"
WHERE "chatId" IN (SELECT id FROM "Chat" WHERE "userId" IN (SELECT id FROM users_to_delete));

-- 3.3. Удаляем сообщения из старой таблицы (Message) на всякий случай.
DELETE FROM "Message"
WHERE "chatId" IN (SELECT id FROM "Chat" WHERE "userId" IN (SELECT id FROM users_to_delete));

-- 3.4. Удаляем сами чаты (Chat).
DELETE FROM "Chat"
WHERE "userId" IN (SELECT id FROM users_to_delete);

-- 3.5. Удаляем артефакты (Artifact).
-- Сначала удаляем предложения, которые могли быть оставлены на этих артефактах (даже другими пользователями).
DELETE FROM "Suggestion"
WHERE "documentId" IN (SELECT id FROM "Artifact" WHERE "userId" IN (SELECT id FROM users_to_delete));
-- Теперь удаляем сами артефакты.
DELETE FROM "Artifact"
WHERE "userId" IN (SELECT id FROM users_to_delete);


-- Шаг 4: Наконец, удаляем самих пользователей из таблицы "User".
DELETE FROM "User"
WHERE id IN (SELECT id FROM users_to_delete);


-- Завершаем и применяем транзакцию. Временная таблица будет удалена автоматически.
COMMIT;