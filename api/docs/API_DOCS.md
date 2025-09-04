# 📚 Documentação da API Claude Chat

## 🚀 Visão Geral

API FastAPI para integração com o Claude Code SDK Python, oferecendo chat em tempo real com streaming, gerenciamento avançado de sessões, configuração de ferramentas e análise de uso.

### Principais Funcionalidades

- ✨ **Chat em Streaming (SSE)** - Respostas em tempo real via Server-Sent Events
- 🔧 **Configuração de Sessões** - System prompts, ferramentas e diretórios personalizados
- 💾 **Gerenciamento de Estado** - Histórico persistente por sessão
- 🛠️ **Suporte a Ferramentas** - Read, Write, Bash e outras ferramentas do Claude Code
- 📊 **Métricas de Uso** - Rastreamento de tokens e custos por sessão
- 🔄 **Controle de Fluxo** - Interrupção e limpeza de sessões em tempo real

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Cliente Web   │ ◄────► │  FastAPI Server │ ◄────► │  Claude SDK     │
│   (Frontend)    │   SSE   │   (server.py)   │         │ (claude_handler)│
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Claude Code    │
                            │      CLI        │
                            └─────────────────┘
```

## 🔌 Endpoints da API

### 📨 Chat e Mensagens

#### `POST /api/chat`
Envia uma mensagem para Claude e recebe resposta em streaming.

**Request Body:**
```json
{
  "message": "Explique o que é Machine Learning",
  "session_id": "opcional-uuid"  // Se não fornecido, será gerado
}
```

**Response:** Stream SSE com eventos:
```javascript
// Evento de processamento
data: {"type": "processing", "session_id": "uuid"}

// Evento de conteúdo
data: {"type": "assistant_text", "content": "Machine Learning é...", "session_id": "uuid"}

// Evento de uso de ferramenta
data: {"type": "tool_use", "tool": "Read", "id": "tool_id", "session_id": "uuid"}

// Evento de resultado de ferramenta
data: {"type": "tool_result", "tool_id": "tool_id", "content": "...", "session_id": "uuid"}

// Evento de resultado final com métricas
data: {"type": "result", "input_tokens": 100, "output_tokens": 200, "cost_usd": 0.05, "session_id": "uuid"}

// Evento de conclusão
data: {"type": "done", "session_id": "uuid"}
```

### 🎛️ Gerenciamento de Sessões

#### `POST /api/new-session`
Cria uma nova sessão básica.

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `POST /api/session-with-config` 🆕
Cria uma sessão com configurações específicas.

**Request Body:**
```json
{
  "system_prompt": "Você é um especialista em Python",
  "allowed_tools": ["Read", "Write", "Bash", "Grep"],
  "max_turns": 10,
  "permission_mode": "acceptEdits",
  "cwd": "/home/user/projeto"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `PUT /api/session/{session_id}/config` 🆕
Atualiza configuração de uma sessão existente (mantém histórico).

**Request Body:**
```json
{
  "system_prompt": "Novo system prompt",
  "allowed_tools": ["Read", "Write"],
  "max_turns": 5
}
```

**Response:**
```json
{
  "status": "updated",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `GET /api/session/{session_id}` 🆕
Obtém informações detalhadas de uma sessão.

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "active": true,
  "config": {
    "system_prompt": "Você é um assistente útil",
    "allowed_tools": ["Read", "Write", "Bash"],
    "max_turns": 10,
    "permission_mode": "acceptEdits",
    "cwd": "/home/user/projeto",
    "created_at": "2024-01-01T12:00:00"
  },
  "history": {
    "message_count": 5,
    "total_tokens": 1500,
    "total_cost": 0.075
  }
}
```

#### `GET /api/sessions` 🆕
Lista todas as sessões ativas.

**Response:**
```json
[
  {
    "session_id": "uuid1",
    "active": true,
    "config": {...},
    "history": {...}
  },
  {
    "session_id": "uuid2",
    "active": true,
    "config": {...},
    "history": {...}
  }
]
```

#### `POST /api/interrupt`
Interrompe a execução de uma sessão.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `POST /api/clear`
Limpa o contexto de uma sessão (mantém configuração).

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `DELETE /api/session/{session_id}`
Remove permanentemente uma sessão.

### 🏥 Sistema

#### `GET /`
Health check da API.

**Response:**
```json
{
  "status": "ok",
  "service": "Claude Chat API"
}
```

## 🛠️ Ferramentas Disponíveis

Quando configuradas, as seguintes ferramentas podem ser usadas pelo Claude:

| Ferramenta | Descrição |
|------------|-----------|
| `Read` | Lê arquivos do sistema |
| `Write` | Escreve arquivos no sistema |
| `Edit` | Edita arquivos existentes |
| `Bash` | Executa comandos shell |
| `Grep` | Busca em arquivos |
| `LS` | Lista diretórios |
| `WebFetch` | Busca conteúdo na web |
| `TodoWrite` | Gerencia lista de tarefas |

## 💻 Exemplos de Uso

### Python com requests

```python
import requests
import json

# Criar sessão com configuração
config = {
    "system_prompt": "Você é um assistente Python",
    "allowed_tools": ["Read", "Write", "Bash"],
    "cwd": "/home/user/projeto"
}

response = requests.post(
    "http://localhost:8989/api/session-with-config",
    json=config
)
session_id = response.json()["session_id"]

# Enviar mensagem com streaming
with requests.post(
    "http://localhost:8989/api/chat",
    json={
        "message": "Crie um script hello.py",
        "session_id": session_id
    },
    stream=True
) as response:
    for line in response.iter_lines():
        if line:
            if line.startswith(b"data: "):
                data = json.loads(line[6:])
                if data["type"] == "assistant_text":
                    print(data["content"], end="")
```

### JavaScript com EventSource

```javascript
// Criar sessão
const configResponse = await fetch('http://localhost:8989/api/session-with-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        system_prompt: 'Você é um assistente JavaScript',
        allowed_tools: ['Read', 'Write']
    })
});

const { session_id } = await configResponse.json();

// Chat com streaming
const eventSource = new EventSource(
    `http://localhost:8989/api/chat`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Como criar um servidor Express?',
            session_id
        })
    }
);

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'assistant_text':
            console.log(data.content);
            break;
        case 'tool_use':
            console.log(`Usando ferramenta: ${data.tool}`);
            break;
        case 'result':
            console.log(`Tokens: ${data.input_tokens}/${data.output_tokens}`);
            console.log(`Custo: $${data.cost_usd}`);
            break;
        case 'done':
            eventSource.close();
            break;
    }
};
```

### cURL

```bash
# Criar sessão com configuração
curl -X POST http://localhost:8989/api/session-with-config \
  -H "Content-Type: application/json" \
  -d '{
    "system_prompt": "Você é um assistente Bash",
    "allowed_tools": ["Bash", "Read"],
    "cwd": "/home/user"
  }'

# Enviar mensagem (use o session_id retornado)
curl -X POST http://localhost:8989/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Liste os arquivos no diretório atual",
    "session_id": "UUID-AQUI"
  }'

# Obter informações da sessão
curl http://localhost:8989/api/session/UUID-AQUI

# Listar todas as sessões
curl http://localhost:8989/api/sessions
```

## 🚀 Instalação e Execução

### Pré-requisitos

1. **Python 3.10+**
2. **Node.js** (para Claude Code CLI)
3. **Claude Code CLI instalado:**
   ```bash
   sudo npm install -g @anthropic-ai/claude-code
   ```

### Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd cc-sdk-chat/api

# Crie ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instale dependências
pip install fastapi uvicorn

# Entre no diretório do SDK
cd claude-code-sdk-python
pip install -r requirements.txt
pip install -e .
cd ..
```

### Execução

```bash
# Modo produção
python3 server.py

# Modo desenvolvimento (com auto-reload)
uvicorn server:app --reload --host 0.0.0.0 --port 8989

# Com logs detalhados
uvicorn server:app --log-level debug --port 8989
```

## 📊 Monitoramento e Métricas

### Métricas por Sessão

Cada sessão rastreia:
- **message_count**: Número de mensagens trocadas
- **total_tokens**: Total de tokens usados (entrada + saída)
- **total_cost**: Custo acumulado em USD
- **created_at**: Timestamp de criação

### Análise de Uso

```python
# Script para análise de uso
import requests

response = requests.get("http://localhost:8989/api/sessions")
sessions = response.json()

total_cost = sum(s["history"]["total_cost"] for s in sessions)
total_tokens = sum(s["history"]["total_tokens"] for s in sessions)
total_messages = sum(s["history"]["message_count"] for s in sessions)

print(f"Sessões ativas: {len(sessions)}")
print(f"Total de mensagens: {total_messages}")
print(f"Total de tokens: {total_tokens}")
print(f"Custo total: ${total_cost:.4f}")
```

## 🔒 Segurança e Boas Práticas

### Configuração de CORS

A API está configurada para aceitar requisições de:
- `http://localhost:3082`
- `http://localhost:3000`

Para produção, ajuste em `server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-dominio.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Limitações e Timeouts

Recomenda-se implementar:
- Rate limiting por IP/sessão
- Timeout máximo para sessões inativas
- Limite de sessões simultâneas por usuário
- Validação de tamanho de mensagens

### Modo de Permissão

Opções para `permission_mode`:
- `acceptEdits`: Aceita automaticamente edições de arquivo
- `ask`: Pergunta antes de executar ferramentas
- `deny`: Nega automaticamente uso de ferramentas

## 🐛 Troubleshooting

### Problemas Comuns

**1. Claude Code não encontrado**
```bash
# Verifique instalação
which claude
claude --version

# Reinstale se necessário
sudo npm install -g @anthropic-ai/claude-code
```

**2. Erro de importação do SDK**
```bash
# Verifique o path do SDK
cd /home/codable/Claudable/cc-sdk-chat/api/claude-code-sdk-python
python3 -m src "teste"
```

**3. Sessão não responde**
```python
# Force limpeza da sessão
import requests
requests.post(
    "http://localhost:8989/api/clear",
    json={"session_id": "UUID"}
)
```

## 📈 Roadmap

### Próximas Features

- [ ] WebSocket para comunicação bidirecional
- [ ] Persistência de sessões em banco de dados
- [ ] Autenticação e autorização
- [ ] Rate limiting e quotas
- [ ] Dashboard de monitoramento
- [ ] Suporte a múltiplos modelos
- [ ] Cache de respostas
- [ ] Webhooks para eventos

## 📝 Licença

MIT License - Veja LICENSE para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ usando Claude Code SDK Python**