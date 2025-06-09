#!/bin/bash
#
# @file refactor_structure.sh
# @description Скрипт для полного рефакторинга файловой структуры и нейминга с "Content/Document" на "Artifact".
# @version 1.0.0
# @date 2025-06-09
#

set -e

echo "🚀 Запуск комплексного рефакторинга структуры проекта..."

# --- Функция для вывода сообщений ---
log_action() {
  echo "  -> $1"
}

# --- Переменные ---
APP_DIR="app"
COMPONENTS_DIR="components"
AI_TOOLS_DIR="lib/ai/tools"
MAIN_GROUP_DIR="$APP_DIR/(main)"
API_DIR="$APP_DIR/api"

# --- Шаг 1: Переименование директорий ---
log_action "1. Переименование директорий..."
if [ -d "$MAIN_GROUP_DIR/content" ]; then
  mv "$MAIN_GROUP_DIR/content" "$MAIN_GROUP_DIR/artifacts"
  echo "     ✅ Директория $MAIN_GROUP_DIR/content -> $MAIN_GROUP_DIR/artifacts"
fi
if [ -d "$API_DIR/content" ]; then
  mv "$API_DIR/content" "$API_DIR/artifacts"
  echo "     ✅ Директория $API_DIR/content -> $API_DIR/artifacts"
fi
if [ -d "$API_DIR/document" ]; then
  mv "$API_DIR/document" "$API_DIR/artifact"
  echo "     ✅ Директория $API_DIR/document -> $API_DIR/artifact"
fi

# --- Шаг 2: Переименование файлов компонентов и действий ---
log_action "2. Переименование файлов..."
# Компоненты
mv "$COMPONENTS_DIR/multimodal-input.tsx" "$COMPONENTS_DIR/chat-input.tsx" 2>/dev/null || echo "     ⚠️ Не найден multimodal-input.tsx"
mv "$COMPONENTS_DIR/document-preview.tsx" "$COMPONENTS_DIR/artifact-preview.tsx" 2>/dev/null || echo "     ⚠️ Не найден document-preview.tsx"
mv "$COMPONENTS_DIR/content-card.tsx" "$COMPONENTS_DIR/artifact-card.tsx" 2>/dev/null || echo "     ⚠️ Не найден content-card.tsx"
mv "$COMPONENTS_DIR/content-grid-client-wrapper.tsx" "$COMPONENTS_DIR/artifact-grid-client-wrapper.tsx" 2>/dev/null || echo "     ⚠️ Не найден content-grid-client-wrapper.tsx"
mv "$COMPONENTS_DIR/content-grid-display.tsx" "$COMPONENTS_DIR/artifact-grid-display.tsx" 2>/dev/null || echo "     ⚠️ Не найден content-grid-display.tsx"
echo "     ✅ Файлы компонентов переименованы."

# --- Шаг 3: Удаление устаревших файлов ---
log_action "3. Удаление устаревших файлов..."
rm -f "$COMPONENTS_DIR/data-stream-handler.tsx"
rm -f "$COMPONENTS_DIR/artifact-messages.tsx"
rm -f "$AI_TOOLS_DIR/create-document.ts"
rm -f "$AI_TOOLS_DIR/update-document.ts"
rm -f "$AI_TOOLS_DIR/get-document.ts"
rm -f "$AI_TOOLS_DIR/request-suggestions.ts"
echo "     ✅ Устаревшие файлы удалены."

# --- Шаг 4: Создание заглушек для новых инструментов ---
log_action "4. Создание заглушек для новых AI инструментов..."
touch "$AI_TOOLS_DIR/artifactCreate.ts"
touch "$AI_TOOLS_DIR/artifactUpdate.ts"
touch "$AI_TOOLS_DIR/artifactEnhance.ts"
touch "$AI_TOOLS_DIR/artifactContent.ts"
touch "$AI_TOOLS_DIR/artifactDelete.ts"
touch "$AI_TOOLS_DIR/artifactRestore.ts"
echo "     ✅ Файлы-заглушки для инструментов созданы."


echo "🎉 Рефакторинг файловой структуры завершен!"
echo "➡️  Дайте команду 'chmod +x refactor_structure.sh' и затем './refactor_structure.sh' для применения изменений."
echo "➡️  После этого я сгенерирую новое содержимое для всех измененных и созданных файлов."
