#!/bin/bash
#
# @file refactor_artifacts.sh
# @description Скрипт для полного рефакторинга файловой структуры, связанной с артефактами.
# @version 1.0.0
# @date 2025-06-10
#

set -e

echo "🚀 Запуск рефакторинга файловой структуры артефактов..."

# --- Функция для вывода сообщений ---
log_action() {
  echo "  -> $1"
}

# --- Основные директории ---
ARTIFACTS_DIR="artifacts"
TOOLS_DIR="$ARTIFACTS_DIR/tools"
KINDS_DIR="$ARTIFACTS_DIR/kinds"
OLD_TOOLS_DIR="lib/ai/tools"
OLD_ARTIFACTS_LIB_DIR="lib/artifacts"

# --- Шаг 1: Создание новых директорий ---
log_action "1. Создание новых директорий..."
mkdir -p "$TOOLS_DIR"
mkdir -p "$KINDS_DIR"
echo "     ✅ Директории $TOOLS_DIR и $KINDS_DIR созданы."

# --- Шаг 2: Перемещение реализаций по типам артефактов ---
log_action "2. Перемещение реализаций по типам артефактов..."
if [ -d "$ARTIFACTS_DIR/code" ]; then
    mv "$ARTIFACTS_DIR/code" "$KINDS_DIR/code"
    echo "     ✅ Перемещено: $ARTIFACTS_DIR/code -> $KINDS_DIR/code"
fi
if [ -d "$ARTIFACTS_DIR/image" ]; then
    mv "$ARTIFACTS_DIR/image" "$KINDS_DIR/image"
    echo "     ✅ Перемещено: $ARTIFACTS_DIR/image -> $KINDS_DIR/image"
fi
if [ -d "$ARTIFACTS_DIR/sheet" ]; then
    mv "$ARTIFACTS_DIR/sheet" "$KINDS_DIR/sheet"
    echo "     ✅ Перемещено: $ARTIFACTS_DIR/sheet -> $KINDS_DIR/sheet"
fi
if [ -d "$ARTIFACTS_DIR/text" ]; then
    mv "$ARTIFACTS_DIR/text" "$KINDS_DIR/text"
    echo "     ✅ Перемещено: $ARTIFACTS_DIR/text -> $KINDS_DIR/text"
fi

# --- Шаг 3: Перемещение AI-инструментов ---
log_action "3. Перемещение AI-инструментов..."
if [ -d "$OLD_TOOLS_DIR" ]; then
    # Игнорируем constants.ts и get-weather.ts, так как они не относятся к артефактам напрямую
    find "$OLD_TOOLS_DIR" -name "artifact*.ts" -exec mv {} "$TOOLS_DIR/" \;
    echo "     ✅ Инструменты артефактов перемещены в $TOOLS_DIR"
else
    echo "     ⚠️ Директория $OLD_TOOLS_DIR не найдена."
fi

# --- Шаг 4: Создание нового barrel-файла ---
log_action "4. Создание barrel-файла..."
touch "$KINDS_DIR/artifact-tools.ts"
echo "     ✅ Пустой файл $KINDS_DIR/artifact-tools.ts создан."

# --- Шаг 5: Удаление старых директорий и файлов ---
log_action "5. Удаление устаревших файлов и директорий..."
if [ -d "$OLD_ARTIFACTS_LIB_DIR" ]; then
    rm -rf "$OLD_ARTIFACTS_LIB_DIR"
    echo "     ✅ Удалена директория $OLD_ARTIFACTS_LIB_DIR."
fi
# Очистка старой директории инструментов, оставляя только не-артефактные
if [ -d "$OLD_TOOLS_DIR" ]; then
    find "$OLD_TOOLS_DIR" -name "artifact*.ts" -type f -delete
    echo "     ✅ Удалены старые копии инструментов артефактов из $OLD_TOOLS_DIR"
fi


echo "🎉 Рефакторинг файловой структуры завершен!"
echo "➡️  Дайте права на выполнение 'chmod +x refactor_artifacts.sh' и запустите './refactor_artifacts.sh' для применения изменений."
echo "➡️  После этого я сгенерирую новое содержимое для всех измененных и созданных файлов."
