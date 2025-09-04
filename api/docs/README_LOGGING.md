# Sistema de Logging Estruturado e Tratamento de Erros

Este documento descreve o sistema robusto de logging e tratamento de erros implementado na API Claude Code SDK.

## 📋 Visão Geral

O sistema implementado fornece:

- **Logging Estruturado**: Logs em formato JSON com contexto rico
- **Tratamento Global de Exceções**: Middleware FastAPI para captura de todos os erros
- **Timeouts Configuráveis**: Previne operações infinitas
- **Rotação Automática de Logs**: Gerenciamento inteligente de arquivos de log
- **Contexto de Request**: Rastreamento detalhado de cada operação

## 🏗️ Arquitetura

### Componentes Principais

1. **`logging_config.py`** - Configuração central de logging
2. **`exception_middleware.py`** - Middleware de tratamento de erros
3. **`server.py`** - Integração nos endpoints principais
4. **`claude_handler.py`** - Logging no handler Claude
5. **`analytics_service.py`** - Logging no serviço de analytics

## 📊 Formato de Logs

Todos os logs são gerados em formato JSON estruturado:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "server",
  "message": "Iniciando envio de mensagem",
  "module": "server",
  "function": "send_message",
  "line": 625,
  "process_id": 12345,
  "thread_id": 67890,
  "request_id": "abc123",
  "session_id": "session-456",
  "client_ip": "192.168.1.100",
  "extra": {
    "event": "chat_message_start",
    "message_length": 150,
    "message_preview": "Como posso implementar um sistema..."
  }
}
```

### Campos Padrão

- **timestamp**: ISO 8601 UTC timestamp
- **level**: Nível do log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **logger**: Nome do logger/módulo
- **message**: Mensagem principal
- **module/function/line**: Localização no código
- **process_id/thread_id**: Identificação de processo/thread

### Campos de Contexto

- **request_id**: ID único da requisição HTTP
- **session_id**: ID da sessão Claude ativa
- **client_ip**: IP do cliente
- **extra**: Dados específicos do evento

## 🚀 Configuração

### Inicialização Básica

```python
from logging_config import setup_logging, get_contextual_logger

# Configura logging
setup_logging(
    level="INFO",
    log_file="/path/to/api.log",
    max_bytes=50 * 1024 * 1024,  # 50MB
    backup_count=10
)

# Obtém logger contextual
logger = get_contextual_logger(__name__)
```

### Variáveis de Ambiente

- `LOG_LEVEL`: Nível de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `REDIS_URL`: URL do Redis para caching de rate limiting

## 📝 Uso dos Loggers

### Logger Contextual

```python
from logging_config import get_contextual_logger

logger = get_contextual_logger(__name__)

# Log básico
logger.info("Operação concluída")

# Log com dados extras
logger.info(
    "Sessão criada com sucesso",
    extra={
        "event": "session_created",
        "session_id": session_id,
        "config": {
            "max_turns": 10,
            "tools_count": 3
        }
    }
)
```

### Contexto de Request

```python
from logging_config import set_request_context, clear_request_context

# Define contexto no início da request
set_request_context(
    req_id="req-123",
    sess_id="session-456", 
    client_ip="192.168.1.100"
)

# Todos os logs incluirão automaticamente esse contexto
logger.info("Processando request")

# Limpa contexto no final
clear_request_context()
```

## 🛡️ Tratamento de Erros

### Middleware Global

O `ErrorHandlingMiddleware` captura automaticamente:

- **Timeouts**: Operações que excedem o tempo limite
- **HTTPException**: Erros HTTP controlados  
- **Exception**: Erros não tratados

```python
# Configuração automática no server.py
app.add_middleware(
    ErrorHandlingMiddleware,
    timeout_seconds=300.0  # 5 minutos
)
```

### Decorador para Funções

```python
from exception_middleware import handle_errors

@handle_errors(timeout_seconds=30.0, reraise=True)
async def operacao_critica():
    # Sua lógica aqui
    await alguma_operacao()
    return resultado
```

### Streaming com Erros

```python
from exception_middleware import StreamingErrorHandler

async def meu_stream():
    try:
        # Gera dados de streaming
        yield dados
    except Exception as e:
        # Formata erro para SSE
        error_sse = await StreamingErrorHandler.handle_streaming_error(
            e, session_id
        )
        yield error_sse
```

## 📊 Eventos de Log Estruturados

### Eventos de Sessão

- `session_create_start` / `session_created`
- `session_destroy_start` / `session_destroyed`
- `session_interrupt_start` / `session_interrupted`
- `session_clear_start` / `session_cleared`

### Eventos de Chat

- `chat_message_start` / `chat_streaming_complete`
- `chat_streaming_timeout` / `chat_streaming_error`
- `tool_use` - Uso de ferramentas pelo Claude

### Eventos de Sistema

- `app_startup` / `app_ready` / `app_shutdown_complete`
- `sdk_connectivity_check` / `sdk_connected`
- `pool_maintenance` / `pool_cleanup`

## 🔧 Configuração Avançada

### Rotação de Logs

```python
setup_logging(
    level="INFO",
    log_file="/app/logs/api.log",
    max_bytes=50 * 1024 * 1024,  # 50MB por arquivo
    backup_count=10              # Mantém 10 arquivos antigos
)
```

### Múltiplos Handlers

```python
import logging
from logging_config import StructuredFormatter

# Logger personalizado para métricas
metrics_logger = logging.getLogger("metrics")
metrics_handler = logging.FileHandler("/app/logs/metrics.log")
metrics_handler.setFormatter(StructuredFormatter())
metrics_logger.addHandler(metrics_handler)
```

## 🎯 Timeouts Implementados

### Por Operação

- **Criação de Sessão**: 30s
- **Destruição de Sessão**: 15s  
- **Envio de Query**: 30s
- **Interrupção**: 10s
- **Limpeza de Sessão**: 30s

### Global

- **Request HTTP**: 300s (5 minutos)
- **Analytics Global**: 60s
- **Análise de Arquivo**: 10s por arquivo

## 🔍 Monitoramento

### Métricas de Logs

Os logs incluem métricas úteis:

```json
{
  "event": "chat_streaming_complete",
  "duration_ms": 1234.56,
  "chunks_sent": 42,
  "session_id": "abc-123"
}
```

### Status do Sistema

```json
{
  "event": "global_analytics_complete", 
  "files_processed": 150,
  "files_error": 2,
  "sessions_analyzed": 148,
  "duration_seconds": 12.34
}
```

## 🚨 Alertas e Problemas

### Indicadores de Problema

- **High Error Rate**: `error_rate > 10%`
- **Memory Usage**: `memory_percent > 90%`
- **Timeouts Frequentes**: Multiple timeout events
- **Sessions Órfãs**: `orphaned_sessions > 0`

### Logs de Erro Crítico

```json
{
  "level": "CRITICAL",
  "event": "sdk_init_error",
  "error_type": "ConnectionError",
  "error_message": "Failed to connect to Claude SDK"
}
```

## 📈 Análise de Performance

### Métricas de Duração

Todos os logs incluem `duration_ms` quando aplicável:

```bash
# Buscar operações lentas
grep "duration_ms" api.log | jq 'select(.duration_ms > 5000)'

# Análise de timeouts
grep "timeout" api.log | jq '.event'
```

### Estatísticas de Uso

```bash
# Sessões mais ativas
grep "session_created" api.log | jq '.session_id' | sort | uniq -c

# Ferramentas mais usadas  
grep "tool_use" api.log | jq '.tool_name' | sort | uniq -c
```

## 🛠️ Debugging

### Ativando Debug

```bash
export LOG_LEVEL=DEBUG
python server.py
```

### Logs de Debug Úteis

- Pool de conexões: `pool_*` events
- Session lifecycle: `session_*` events  
- Request tracing: `request_id` field

### Exemplo de Análise

```bash
# Seguir uma request específica
grep "req-abc123" api.log | jq '.message'

# Problemas de uma sessão
grep "session-456" api.log | jq 'select(.level == "ERROR")'
```

## 📋 Checklist de Implementação

### ✅ Concluído

- [x] Logging estruturado com JSON
- [x] Middleware global de exceções  
- [x] Timeouts em operações assíncronas
- [x] Contexto de request automático
- [x] Rotação de logs configurável
- [x] Tratamento de erros em streaming
- [x] Decoradores para funções críticas
- [x] Integração em todos os módulos principais

### 🔄 Melhorias Futuras

- [ ] Integração com sistemas de monitoramento (Prometheus/Grafana)
- [ ] Alertas automáticos baseados em thresholds
- [ ] Logs de auditoria para operações sensíveis  
- [ ] Compressão de logs antigos
- [ ] Dashboard em tempo real

## 📞 Suporte

Para problemas relacionados ao sistema de logging:

1. Verifique os logs em `/app/logs/api.log`
2. Ative modo DEBUG temporariamente
3. Use `request_id` para rastrear requests específicas
4. Analise eventos de erro para identificar padrões

---

**Nota**: Este sistema foi projetado para ser robusto e não impactar a performance da API, mesmo em alta carga. Todos os logs são assíncronos e não bloqueantes.