# Integração Chat Frontend com API Backend - Guia Completo

## Visão Geral
Este documento descreve o processo completo de integração entre o frontend Next.js (chat), backend FastAPI com Claude Code SDK, e a nova integração com Streamlit.

## Problema Inicial
- A API estava configurada para rodar na porta 8989, mas essa porta estava ocupada por outro processo
- O frontend estava configurado para conectar na porta 8989
- Havia incompatibilidade entre as configurações de CORS
- O Claude Code SDK Python não estava instalado corretamente no ambiente virtual

## Solução Implementada

### 1. Configuração do Ambiente Virtual e Dependências

#### Verificação do ambiente virtual existente:
```bash
ls -la ~/.claude/cc-sdk-chat/.venv/bin/
```

#### Instalação do Claude Code SDK como submodule:
```bash
cd /home/suthub/.claude/cc-sdk-chat/api
git submodule update --init --recursive
```

#### Instalação do SDK no ambiente virtual:
```bash
~/.claude/cc-sdk-chat/.venv/bin/pip install -e claude-code-sdk-python
```

**Nota:** Foi necessário usar `--break-system-packages` devido ao ambiente gerenciado:
```bash
pip3 install --break-system-packages -e claude-code-sdk-python
```

### 2. Configuração da API Backend

#### Mudança de porta (8989 → 8992)
Como a porta 8989 estava ocupada, alteramos para 8992:

**Arquivo:** `/home/suthub/.claude/cc-sdk-chat/api/server.py` (linha 532-534)
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8992, reload=False)
```

#### Configuração de CORS
Adicionamos suporte para localhost e 127.0.0.1:

**Arquivo:** `/home/suthub/.claude/cc-sdk-chat/api/server.py` (linhas 76-88)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3082", 
        "http://localhost:3000",
        "http://127.0.0.1:3082",  # Adicionado
        "https://suthub.agentesintegrados.com",
        "http://suthub.agentesintegrados.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Configuração do Frontend

#### Atualização da URL da API
Mudamos a URL base para conectar na nova porta:

**Arquivo:** `/home/suthub/.claude/cc-sdk-chat/chat/src/lib/api.ts` (linhas 45-46 e 50)
```typescript
// Em desenvolvimento, usa localhost
this.baseUrl = 'http://localhost:8992';

// SSR ou ambiente Node.js
this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8992';
```

### 4. Comandos de Execução

#### Iniciar o Backend (API):
```bash
cd /home/suthub/.claude/cc-sdk-chat/api
~/.claude/cc-sdk-chat/.venv/bin/python server.py
```

#### Iniciar o Frontend (Chat):
```bash
cd /home/suthub/.claude/cc-sdk-chat/chat
npm run dev
```

### 5. Teste da Integração

#### Verificar criação de sessão:
```bash
curl -X POST http://localhost:8992/api/new-session
```
Resposta esperada:
```json
{"session_id":"196c7ded-b50a-4c19-86ae-c21cc48f3826"}
```

## Estrutura Final

### Serviços em Execução:
- **Frontend Next.js:** http://localhost:3082
- **Backend FastAPI:** http://localhost:8992

### Fluxo de Comunicação:
1. Usuário acessa http://localhost:3082
2. Frontend envia requisições para http://localhost:8992/api/
3. API processa com Claude Code SDK
4. Respostas retornam via SSE (Server-Sent Events)

## Problemas Resolvidos

1. ✅ **Porta ocupada:** Mudança de 8989 para 8992
2. ✅ **CORS:** Adição de origens permitidas
3. ✅ **Dependências:** Instalação correta do Claude Code SDK
4. ✅ **Ambiente virtual:** Uso do venv correto
5. ✅ **Configuração de URLs:** Sincronização frontend-backend

## Observações Importantes

### Diferença entre execução local vs Docker:
- **Local:** Usa processos Python e Node.js diretamente
- **Docker:** Usaria containers isolados (configurado mas não em uso)

### Variáveis de Ambiente:
- O frontend detecta automaticamente o ambiente (produção vs desenvolvimento)
- Em produção (suthub.agentesintegrados.com), usa proxy reverso
- Em desenvolvimento, conecta diretamente na API local

### Processo de Background:
Os serviços foram iniciados com `run_in_background=true` para manter execução contínua:
```python
# API em background
~/.claude/cc-sdk-chat/.venv/bin/python server.py  # bash_8

# Frontend em background  
cd /home/suthub/.claude/cc-sdk-chat/chat && npm run dev  # bash_10
```

## Comandos Úteis

### Verificar processos:
```bash
ps aux | grep server.py
ps aux | grep "next dev"
```

### Parar processos:
```bash
# Para API
pkill -f "python server.py"

# Para Frontend
pkill -f "next dev"
```

### Logs e monitoramento:
```bash
# Ver output da API
curl http://localhost:8992/

# Testar chat
curl -X POST http://localhost:8992/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "teste", "session_id": "test-123"}'
```

## Nova Integração: Streamlit com API cc-sdk-chat

### 6. Integração do Streamlit (NOVA IMPLEMENTAÇÃO)

#### Problema Original:
O Streamlit estava usando subprocess direto com o Claude SDK, gerando erros de módulo `src` não encontrado.

#### Solução Implementada:
Criamos um cliente API que conecta o Streamlit à mesma API FastAPI usada pelo frontend Next.js.

#### Cliente API para Streamlit:
**Arquivo criado:** `/home/suthub/.claude/api-claude-code-app/8504-chat/claude_api_client.py`

```python
class ClaudeChatAPIClient:
    """Cliente para comunicação com a API Claude Chat"""
    
    def __init__(self, api_url: str = "http://localhost:8992"):
        self.api_url = api_url.rstrip("/")
        self.session_id: Optional[str] = None
        
    def simple_query(self, message: str) -> Dict:
        """Envia mensagem e retorna resposta completa (não streaming)"""
        # Conecta com API FastAPI na porta 8992
        # Retorna resultado compatível com sistema anterior
```

#### Modificação do Streamlit:
**Arquivo modificado:** `/home/suthub/.claude/api-claude-code-app/8504-chat/chat_app.py`

```python
def send_claude_query(prompt: str) -> Dict:
    """Envia query para Claude usando API do cc-sdk-chat"""
    try:
        from claude_api_client import query_claude_via_api
        result = query_claude_via_api(prompt)
        # Processa resposta da API FastAPI
        return result
```

#### Dependências Adicionais:
```bash
pip install --break-system-packages sseclient-py requests
```

### Estrutura Final Atualizada

### Serviços em Execução:
- **Frontend Next.js:** http://localhost:3082
- **Backend FastAPI:** http://localhost:8992  
- **Streamlit Chat:** http://localhost:40047 ⭐ (NOVO)

### Fluxo de Comunicação Unificado:
1. **Next.js Frontend:** http://localhost:3082 → API http://localhost:8992
2. **Streamlit Chat:** http://localhost:40047 → API http://localhost:8992 ⭐
3. Ambos usam a mesma API FastAPI com Claude Code SDK
4. Respostas processadas de forma unificada

### Vantagens da Nova Arquitetura:
1. ✅ **Arquitetura unificada:** Um único backend para múltiplas interfaces
2. ✅ **Sem problemas de módulos:** Streamlit não acessa SDK diretamente
3. ✅ **Mesmo comportamento:** Claude responde igual em ambas interfaces
4. ✅ **Facilidade de manutenção:** Apenas uma API para manter

## Problemas Resolvidos (ATUALIZADO)

1. ✅ **Porta ocupada:** Mudança de 8989 para 8992
2. ✅ **CORS:** Adição de origens permitidas
3. ✅ **Dependências:** Instalação correta do Claude Code SDK
4. ✅ **Ambiente virtual:** Uso do venv correto
5. ✅ **Configuração de URLs:** Sincronização frontend-backend
6. ✅ **Erro módulo 'src':** Streamlit agora usa cliente API ⭐
7. ✅ **Arquitetura unificada:** Múltiplas interfaces, uma API ⭐

## Comandos de Execução Atualizados

#### Iniciar o Backend (API):
```bash
cd /home/suthub/.claude/api-claude-code-app/cc-sdk-chat/api
python3 server.py
```

#### Iniciar o Frontend Next.js:
```bash
cd /home/suthub/.claude/api-claude-code-app/cc-sdk-chat/chat
npm run dev
```

#### Iniciar o Streamlit Chat (NOVO):
```bash
cd /home/suthub/.claude/api-claude-code-app/8504-chat
python3 -m streamlit run chat_app.py --server.port 40047 --server.headless true --server.address 0.0.0.0
```

## Observações Importantes Atualizadas

### Métricas no Streamlit:
Atualmente, o Streamlit mostra métricas zeradas (Tokens: 0↑ 0↓ | Custo: $0.000000) porque a API FastAPI ainda não retorna essas informações detalhadas. Isso é uma limitação conhecida que pode ser implementada futuramente.

### Vantagens da Nova Integração:
- **Consistência:** Ambas interfaces usam o mesmo backend
- **Robustez:** Elimina problemas de subprocess e módulos
- **Escalabilidade:** Facilita adição de novas interfaces
- **Manutenibilidade:** Centralização da lógica de negócio

## Conclusão

A integração foi expandida com sucesso para incluir:
1. Frontend Next.js profissional (http://localhost:3082)
2. API FastAPI robusta (http://localhost:8992)
3. **Interface Streamlit simplificada (http://localhost:40047) ⭐**

Todas as interfaces compartilham a mesma API backend, garantindo comportamento consistente e facilitando manutenção. O sistema está funcional e pronto para uso em ambiente de desenvolvimento com múltiplas opções de interface.