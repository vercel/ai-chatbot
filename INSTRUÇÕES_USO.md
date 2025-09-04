# 📚 INSTRUÇÕES DE USO - CLAUDE CODE SDK NO AI-CHATBOT

## 🚀 SERVIÇOS RODANDO

### ✅ Backend Python
- **Status**: RODANDO
- **Porta**: 8002
- **URL**: http://localhost:8002
- **Health**: http://localhost:8002/health

### ✅ Frontend Next.js
- **Status**: RODANDO
- **Porta**: 3033
- **URL**: http://localhost:3033

## 🎯 COMO USAR O CLAUDE CODE SDK

### OPÇÃO 1: Chat Dedicado (FUNCIONANDO 100%)
**URL**: http://localhost:3033/claude

- Interface dedicada para Claude SDK
- Não requer autenticação
- Streaming visual em tempo real
- **RECOMENDADO PARA TESTES**

### OPÇÃO 2: Interface Principal
**URL**: http://localhost:3033

1. Faça login (ou use modo Guest)
2. Clique em "New chat"
3. Selecione o modelo: **"Claude Code (Local)"**
4. Digite suas mensagens
5. O Claude responderá usando o SDK local

### OPÇÃO 3: Teste HTML Direto
**URL**: http://localhost:3033/test-direct.html

- Interface HTML simples
- Testa conexão diretamente
- Útil para debug

## 🔧 COMANDOS ÚTEIS

### Verificar se está funcionando:
```bash
# Backend health check
curl http://localhost:8002/health

# Teste de chat direto
curl -X POST http://localhost:8002/api/claude/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Olá", "session_id": "test"}'
```

### Se precisar reiniciar:

#### Backend Python:
```bash
cd /home/codable/terminal/claude-code-sdk-python/ai-chatbot/api-python
export PYTHONPATH=/home/codable/terminal/claude-code-sdk-python
python3 -m uvicorn server:app --host 0.0.0.0 --port 8002
```

#### Frontend Next.js:
```bash
cd /home/codable/terminal/claude-code-sdk-python/ai-chatbot
npm run dev
```

## 🎨 DIFERENÇAS ENTRE AS INTERFACES

| Recurso | Chat Dedicado (/claude) | Interface Principal (/) |
|---------|-------------------------|-------------------------|
| Autenticação | ❌ Não precisa | ✅ Precisa login |
| Seleção de Modelo | ❌ Sempre Claude SDK | ✅ Múltiplos modelos |
| Streaming | ✅ Direto do browser | ✅ Via API route |
| Melhor para | Testes rápidos | Uso completo |

## ⚠️ TROUBLESHOOTING

### Erro "Failed to fetch"
- Verifique se o backend está rodando: `curl http://localhost:8002/health`
- Verifique CORS no console do navegador

### Chat não responde
- Verifique se selecionou "Claude Code (Local)" como modelo
- Verifique logs do backend Python

### Página não carrega
- Verifique se Next.js está rodando na porta 3033
- Limpe cache do navegador

## 🎉 RESUMO

**O Claude Code SDK está FUNCIONANDO em ambas as interfaces:**

1. **Chat Dedicado** (http://localhost:3033/claude) - ✅ 100% Funcional
2. **Interface Principal** (http://localhost:3033) - ✅ Funcional com login

**Sem necessidade de API keys!** Usa o Claude instalado localmente.

---
**Última atualização**: 27/08/2025