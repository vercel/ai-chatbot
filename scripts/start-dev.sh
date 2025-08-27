#!/bin/bash

# Script para iniciar o ambiente de desenvolvimento completo

echo "🚀 Iniciando ambiente de desenvolvimento do AI Chatbot com Claude Code SDK..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

# Função para matar processos ao sair
cleanup() {
    echo -e "\n${YELLOW}Encerrando servidores...${NC}"
    kill $PYTHON_PID $NEXT_PID 2>/dev/null
    exit
}
trap cleanup EXIT INT TERM

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 não encontrado!${NC}"
    exit 1
fi

# Verificar se Node está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado!${NC}"
    exit 1
fi

# Instalar dependências Python se necessário
echo -e "${GREEN}📦 Verificando dependências Python...${NC}"
cd api-python
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip

# Instalar dependências do requirements.txt
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
else
    echo -e "${YELLOW}Instalando dependências Python manualmente...${NC}"
    pip install fastapi uvicorn sse-starlette python-jose pydantic
fi

# Instalar Claude Code SDK do diretório pai
pip install -q -e /home/codable/terminal/claude-code-sdk-python/

# Iniciar servidor Python em background
echo -e "${GREEN}🐍 Iniciando servidor Python (porta 8001)...${NC}"
NODE_ENV=development python server.py &
PYTHON_PID=$!
sleep 2

# Verificar se o servidor Python está rodando
if ! kill -0 $PYTHON_PID 2>/dev/null; then
    echo -e "${RED}Falha ao iniciar servidor Python!${NC}"
    exit 1
fi

# Voltar ao diretório base
cd "$BASE_DIR"

# Instalar dependências Node se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências Node...${NC}"
    npm install
fi

# Configurar variáveis de ambiente
export CLAUDE_SDK_API_URL="http://localhost:8001"
export NODE_ENV="development"

# Iniciar Next.js
echo -e "${GREEN}⚛️  Iniciando Next.js (porta 3033)...${NC}"
npm run dev &
NEXT_PID=$!

# Aguardar servidores iniciarem
echo -e "${GREEN}✨ Aguardando servidores iniciarem...${NC}"
sleep 5

# Mostrar status
echo -e "\n${GREEN}✅ Ambiente de desenvolvimento iniciado!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📍 Frontend: ${GREEN}http://localhost:3033${NC}"
echo -e "📍 Backend API: ${GREEN}http://localhost:8001${NC}"
echo -e "📍 Health Check: ${GREEN}http://localhost:8001/health${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n💡 Pressione ${RED}Ctrl+C${NC} para encerrar\n"

# Manter script rodando
wait