#!/bin/bash

# Script para iniciar a API Python do Claude Code SDK

echo "🚀 Iniciando API Python do Claude Code SDK..."

# Diretório base
BASE_DIR="/home/suthub/.claude/ai-chatbot"
API_DIR="$BASE_DIR/api"

# Verifica se o diretório existe
if [ ! -d "$API_DIR" ]; then
    echo "❌ Diretório API não encontrado: $API_DIR"
    exit 1
fi

# Muda para o diretório da API
cd "$API_DIR"

# Verifica Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado"
    exit 1
fi

# Instala dependências se necessário
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Configura variáveis de ambiente
export PYTHONPATH="$API_DIR:$API_DIR/claude-code-sdk-python/src:$PYTHONPATH"
export CLAUDE_CODE_ENTRYPOINT="sdk-web"
export DISABLE_AUTH="true"

# Porta padrão
PORT=${1:-8002}

echo "✅ Iniciando servidor na porta $PORT..."
echo "📝 Logs em: $API_DIR/server.log"

# Inicia o servidor
python3 server_simple.py --port $PORT 2>&1 | tee -a server.log