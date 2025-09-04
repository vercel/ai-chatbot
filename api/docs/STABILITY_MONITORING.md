# Sistema de Estabilidade e Monitoramento da API Claude SDK

Este documento descreve as melhorias implementadas na API Claude SDK para aumentar a estabilidade, monitoramento e resilência do sistema.

## 🚀 Funcionalidades Implementadas

### 1. Health Check Detalhado (`/health/detailed`)

Endpoint melhorado que fornece informações completas sobre o status da API:

```json
{
  "status": "healthy|degraded|unhealthy",
  "service": "Claude Chat API",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "timestamp": "2024-01-01T12:00:00Z",
  "sessions": {
    "active_count": 15,
    "total_created": 150,
    "active_sessions": ["session1", "session2"],
    "session_configs": 10
  },
  "system": {
    "cpu": {
      "usage_percent": 25.5,
      "count": 8,
      "load_average": [1.2, 1.1, 1.0]
    },
    "memory": {
      "total_gb": 16.0,
      "available_gb": 8.5,
      "usage_percent": 45.2,
      "process_rss_mb": 256.7,
      "process_vms_mb": 512.3
    },
    "disk": {
      "usage_percent": 65.8
    }
  },
  "claude_sdk": {
    "status": "connected",
    "connection_time_ms": 125.5,
    "last_check": "2024-01-01T12:00:00Z"
  },
  "performance": {
    "requests_total": 1500,
    "requests_in_progress": 3,
    "errors_total": 12,
    "error_rate": 0.8
  },
  "stability": {
    "circuit_breakers": {
      "claude_sdk": {
        "state": "closed",
        "failure_count": 0,
        "can_execute": true
      }
    }
  },
  "fallback_stats": {
    "operations": {
      "chat": {
        "total_calls": 100,
        "primary_success": 95,
        "fallback_used": 5,
        "cache_hits": 3
      }
    }
  }
}
```

### 2. Circuit Breakers

Sistema de circuit breakers para proteger operações críticas:

#### Circuit Breakers Configurados:
- **`claude_sdk`**: Protege operações do Claude SDK
  - Threshold de falhas: 3 consecutivas
  - Timeout: 30 segundos
  - Sucessos para fechar: 2

- **`session_operations`**: Protege operações de sessão
  - Threshold de falhas: 5 consecutivas  
  - Timeout: 60 segundos

#### Estados dos Circuit Breakers:
- **CLOSED**: Normal - permite todas as requisições
- **OPEN**: Bloqueado - rejeita requisições devido a falhas
- **HALF_OPEN**: Teste - permite requisições limitadas para verificar recuperação

#### Endpoints de Gerenciamento:
```bash
# Ver status de estabilidade
GET /health/stability

# Resetar circuit breaker específico
POST /health/circuit-breaker/{circuit_name}/reset
```

### 3. Sistema de Fallbacks

Sistema robusto de fallbacks para operações críticas:

#### Estratégias de Fallback:
1. **CACHED_RESPONSE**: Usa resposta cacheada anterior
2. **MOCK_RESPONSE**: Retorna resposta mock predefinida
3. **DEGRADED_SERVICE**: Funcionalidade limitada
4. **QUEUE_FOR_RETRY**: Enfileira para retry posterior
5. **ALTERNATIVE_PROVIDER**: Usa provedor alternativo

#### Configurações por Operação:
- **Chat**: Cache (180s) → Mock Response
- **Create Session**: Cache → Mock Response

#### Endpoint de Gerenciamento:
```bash
# Limpar cache de fallbacks
POST /health/fallback-cache/clear
```

### 4. Reconexão Automática

Sistema de reconexão com backoff exponencial:

- Delays progressivos: [1s, 2s, 5s, 10s, 30s, 60s]
- Máximo 6 tentativas por operação
- Integrado com circuit breakers
- Log detalhado de tentativas

### 5. Endpoints de Métricas Melhorados

#### `/metrics` (Básico)
```json
{
  "requests_total": 1500,
  "requests_in_progress": 3,
  "errors_total": 12,
  "sessions_created": 150,
  "sessions_active": 15,
  "uptime_seconds": 3600,
  "fallbacks_used": 5,
  "circuit_breakers_open": 0,
  "memory_usage_percent": 45.2,
  "cpu_usage_percent": 25.5
}
```

#### `/health/stability` (Detalhado)
Retorna status completo de circuit breakers, fallbacks e health checks.

### 6. Graceful Shutdown Melhorado

Shutdown em etapas com timeouts e limpeza de recursos:

1. **Sinalização de shutdown** - Para novas conexões
2. **Encerramento de sessões em lotes** - Máximo 10 por vez
3. **Timeouts individuais** - 15s por sessão, 30s por lote
4. **Limpeza de recursos** - Cache, estatísticas, etc.
5. **Log detalhado** - Rastreamento completo

### 7. Health Checks Registrados

Health checks automáticos executados periodicamente:

- **Claude SDK**: Testa conectividade criando sessão temporária
- **Memory**: Verifica uso de memória (alerta > 90%)
- **Sessions**: Monitora número de sessões ativas (alerta > 100)

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Logging
LOG_LEVEL=INFO

# Redis para rate limiting e cache (opcional)
REDIS_URL=redis://localhost:6379

# Servidor
HOST=127.0.0.1
PORT=8989
```

### Configuração de Circuit Breakers

Os circuit breakers podem ser configurados programaticamente:

```python
from stability_monitor import stability_monitor, CircuitBreakerConfig

stability_monitor.register_circuit_breaker(
    "custom_operation",
    CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=3,
        timeout_seconds=60
    )
)
```

### Configuração de Fallbacks

```python
from fallback_system import fallback_system, FallbackConfig, FallbackStrategy

fallback_system.register_fallback(
    "custom_operation",
    FallbackConfig(
        FallbackStrategy.CACHED_RESPONSE,
        priority=1,
        cache_ttl_seconds=300
    )
)
```

## 📊 Monitoramento

### Métricas Importantes

1. **Error Rate**: Deve ficar abaixo de 5%
2. **Circuit Breakers Open**: Deve ser 0 em operação normal
3. **Fallbacks Used**: Indica problemas se muito alto
4. **Memory Usage**: Alerta se > 90%
5. **Active Sessions**: Monitorar crescimento anômalo

### Alertas Recomendados

- Error rate > 10% por 5 minutos
- Qualquer circuit breaker aberto
- Uso de memória > 90% por 2 minutos
- Mais de 3 fallbacks usados por minuto
- Mais de 100 sessões ativas

## 🐛 Troubleshooting

### Circuit Breaker Aberto
```bash
# Ver status
curl http://localhost:8989/health/stability

# Resetar se necessário
curl -X POST http://localhost:8989/health/circuit-breaker/claude_sdk/reset
```

### Cache de Fallbacks Cheio
```bash
# Limpar cache
curl -X POST http://localhost:8989/health/fallback-cache/clear
```

### Performance Degradada
```bash
# Check health detalhado
curl http://localhost:8989/health/detailed

# Métricas básicas
curl http://localhost:8989/metrics
```

## 📈 Logs Estruturados

Todos os eventos são logados com contexto estruturado:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "event": "circuit_breaker_opened",
  "component": "stability_monitor",
  "circuit_name": "claude_sdk",
  "failure_count": 3
}
```

### Eventos Importantes

- `circuit_breaker_opened/closed`
- `fallback_used`
- `reconnection_attempt`
- `session_shutdown_timeout`
- `cache_hit/miss`
- `health_check_failed`

## 🔄 Integração com Código Existente

O sistema é totalmente compatível com o código existente. As melhorias são transparentes e não quebram funcionalidades existentes.

### Decorators Disponíveis

```python
from stability_monitor import circuit_breaker, retry_on_failure

@circuit_breaker("my_operation")
@retry_on_failure(max_retries=3)
async def my_function():
    # Sua lógica aqui
    pass
```

### Execução Protegida Manual

```python
from stability_monitor import stability_monitor

result = await stability_monitor.protected_execute_with_retry(
    "my_circuit_breaker",
    my_function,
    max_retries=3
)
```

## 🏥 Status da Implementação

✅ Health check detalhado  
✅ Circuit breakers  
✅ Sistema de fallbacks  
✅ Reconexão automática  
✅ Métricas melhoradas  
✅ Graceful shutdown  
✅ Endpoints de gerenciamento  
✅ Logs estruturados  
✅ Integração transparente  

## 📞 Suporte

Para suporte ou dúvidas sobre o sistema de estabilidade, consulte os logs estruturados e utilize os endpoints de diagnóstico disponíveis.