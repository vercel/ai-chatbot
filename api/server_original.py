"""Servidor FastAPI para integração com Claude Code SDK."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from fastapi import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
import asyncio
import json
import uuid
import psutil
import time
import os
from datetime import datetime

from claude_handler import ClaudeHandler, SessionConfig
from analytics_service import AnalyticsService
from session_manager import ClaudeCodeSessionManager
from session_validator import SessionValidator
from logging_config import setup_logging, get_contextual_logger
from exception_middleware import ErrorHandlingMiddleware, StreamingErrorHandler
from security_models import SecureChatMessage, SecureSessionAction, SecureSessionConfigRequest, SecurityHeaders
from security_middleware import SecurityMiddleware, CORSSecurityMiddleware
from rate_limiter import RateLimitManager
from stability_monitor import stability_monitor, CircuitBreakerConfig, CircuitState
from fallback_system import fallback_system, FallbackConfig, FallbackStrategy

# Configuração de logging estruturado
setup_logging(
    level=os.getenv("LOG_LEVEL", "INFO"),
    log_file="/home/suthub/.claude/api-claude-code-app/cc-sdk-chat/logs/api.log",
    max_bytes=50 * 1024 * 1024,  # 50MB
    backup_count=10
)
logger = get_contextual_logger(__name__)

# Variáveis globais para monitoramento
app_start_time = time.time()
health_status = {'status': 'starting', 'last_check': None}
metrics = {
    'requests_total': 0,
    'requests_in_progress': 0,
    'errors_total': 0,
    'sessions_created': 0,
    'sessions_active': 0,
    'fallbacks_used': 0,
    'circuit_breakers_open': 0
}

# Configuração de circuit breakers
stability_monitor.register_circuit_breaker(
    "claude_sdk",
    CircuitBreakerConfig(
        failure_threshold=3,
        success_threshold=2, 
        timeout_seconds=30
    )
)

stability_monitor.register_circuit_breaker(
    "session_operations",
    CircuitBreakerConfig(
        failure_threshold=5,
        timeout_seconds=60
    )
)

# Configuração de fallbacks
fallback_system.register_fallback(
    "chat",
    FallbackConfig(FallbackStrategy.CACHED_RESPONSE, priority=1, cache_ttl_seconds=180)
)
fallback_system.register_fallback(
    "chat", 
    FallbackConfig(FallbackStrategy.MOCK_RESPONSE, priority=2)
)

fallback_system.register_fallback(
    "create_session",
    FallbackConfig(FallbackStrategy.CACHED_RESPONSE, priority=1)
)
fallback_system.register_fallback(
    "create_session",
    FallbackConfig(FallbackStrategy.MOCK_RESPONSE, priority=2)
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação com inicialização e shutdown limpos."""
    # Inicialização
    logger.info(
        "Iniciando Claude Chat API...",
        extra={"event": "app_startup", "component": "server"}
    )
    health_status['status'] = 'healthy'
    health_status['last_check'] = datetime.now().isoformat()
    
    # Inicializa handlers
    try:
        # Teste de conectividade com Claude SDK
        logger.info(
            "Verificando conectividade com Claude SDK...",
            extra={"event": "sdk_connectivity_check", "component": "claude_sdk"}
        )
        
        test_client = claude_handler.clients.get('test')
        if not test_client:
            await asyncio.wait_for(
                claude_handler.create_session('test'),
                timeout=30.0
            )
            await claude_handler.destroy_session('test')
            
        logger.info(
            "Claude SDK conectado com sucesso",
            extra={"event": "sdk_connected", "component": "claude_sdk"}
        )
        
    except asyncio.TimeoutError:
        logger.error(
            "Timeout na conexão com Claude SDK",
            extra={"event": "sdk_timeout", "component": "claude_sdk", "timeout_seconds": 30}
        )
        health_status['status'] = 'degraded'
    except Exception as e:
        logger.error(
            "Problema na inicialização do Claude SDK",
            extra={
                "event": "sdk_init_error", 
                "component": "claude_sdk",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        health_status['status'] = 'degraded'
    
    logger.info(
        "Claude Chat API iniciada com sucesso",
        extra={"event": "app_ready", "component": "server"}
    )
    
    yield
    
    # Shutdown limpo
    logger.info(
        "Iniciando shutdown graceful...",
        extra={"event": "app_shutdown_start", "component": "server"}
    )
    health_status['status'] = 'shutting_down'
    
    # Encerra todas as sessões ativas
    try:
        active_sessions = list(claude_handler.clients.keys())
        logger.info(
            "Encerrando sessões ativas...",
            extra={
                "event": "sessions_cleanup",
                "component": "session_manager",
                "active_sessions_count": len(active_sessions)
            }
        )
        
        # Timeout para shutdown de cada sessão
        shutdown_tasks = []
        for session_id in active_sessions:
            task = asyncio.create_task(
                asyncio.wait_for(
                    claude_handler.destroy_session(session_id),
                    timeout=10.0
                )
            )
            shutdown_tasks.append((session_id, task))
        
        # Aguarda todas as sessões ou timeout geral
        try:
            for session_id, task in shutdown_tasks:
                try:
                    await task
                except asyncio.TimeoutError:
                    logger.warning(
                        "Timeout ao encerrar sessão",
                        extra={
                            "event": "session_shutdown_timeout",
                            "session_id": session_id,
                            "timeout_seconds": 10
                        }
                    )
                except Exception as e:
                    logger.warning(
                        "Erro ao encerrar sessão",
                        extra={
                            "event": "session_shutdown_error",
                            "session_id": session_id,
                            "error_type": type(e).__name__,
                            "error_message": str(e)
                        }
                    )
        except Exception as e:
            logger.error(
                "Erro geral no shutdown de sessões",
                extra={
                    "event": "sessions_cleanup_error",
                    "error_type": type(e).__name__,
                    "error_message": str(e)
                }
            )
        
        # Limpa recursos do sistema de estabilidade
        try:
            # Limpa cache de fallbacks
            cache_stats = fallback_system.cache_manager.get_stats()
            fallback_system.cache_manager.clear()
            
            # Reset estatísticas de fallbacks
            fallback_system.reset_stats()
            
            # Log limpeza de recursos
            logger.info(
                "Recursos de estabilidade limpos",
                extra={
                    "event": "stability_cleanup",
                    "cache_items_cleared": cache_stats.get("total_items", 0),
                    "fallback_stats_reset": True
                }
            )
            
        except Exception as e:
            logger.warning(f"Erro ao limpar recursos de estabilidade: {e}")
        
        logger.info(
            "Sessões encerradas e recursos limpos",
            extra={"event": "sessions_closed", "component": "session_manager"}
        )
        
    except Exception as e:
        logger.error(
            "Erro durante shutdown",
            extra={
                "event": "shutdown_error",
                "component": "server",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
    
    logger.info(
        "Shutdown concluído",
        extra={"event": "app_shutdown_complete", "component": "server"}
    )

app = FastAPI(
    title="Claude Chat API",
    lifespan=lifespan,
    description="""
    ## API de Chat com Claude Code SDK
    
    Esta API fornece integração com o Claude Code SDK para conversas em streaming.
    
    ### Funcionalidades principais:
    
    * **Chat em Streaming** - Respostas em tempo real via Server-Sent Events (SSE)
    * **Gerenciamento de Sessões** - Criar, interromper e limpar sessões de chat
    * **Contexto Persistente** - Mantém histórico de conversas por sessão
    * **Interrupção em Tempo Real** - Pare respostas em andamento instantaneamente
    
    ### Como usar:
    
    1. Crie uma nova sessão com `/api/new-session`
    2. Envie mensagens para `/api/chat` com o `session_id`
    3. Receba respostas em streaming via SSE
    4. Gerencie a sessão com endpoints de controle
    
    ### Formato de Resposta SSE:
    
    As respostas são enviadas como eventos SSE no formato:
    ```
    data: {"type": "content", "content": "texto", "session_id": "uuid"}
    data: {"type": "done", "session_id": "uuid"}
    ```
    """,
    version="1.0.0",
    contact={
        "name": "Suporte API",
        "email": "api@example.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=[
        {
            "url": "http://localhost:8989",
            "description": "Servidor de desenvolvimento"
        }
    ],
    tags_metadata=[
        {
            "name": "Chat",
            "description": "Operações de chat com Claude"
        },
        {
            "name": "Sessões",
            "description": "Gerenciamento de sessões de chat"
        },
        {
            "name": "Sistema",
            "description": "Endpoints de sistema e monitoramento"
        }
    ]
)

# Middleware de tratamento de erros (deve ser adicionado primeiro)
app.add_middleware(
    ErrorHandlingMiddleware,
    timeout_seconds=300.0  # 5 minutos
)

# Middleware de segurança (segundo na hierarquia)
app.add_middleware(
    SecurityMiddleware,
    redis_url=os.getenv("REDIS_URL")
)

# Middleware CORS específico com validação de origem
app.add_middleware(CORSSecurityMiddleware)

# Configuração CORS padrão como fallback
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3082", 
        "http://localhost:3000",
        "http://127.0.0.1:3082",
        "https://suthub.agentesintegrados.com",
        "http://suthub.agentesintegrados.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept", "Accept-Language", "Content-Language", "Content-Type", 
        "Authorization", "X-Requested-With", "X-Session-ID"
    ],
)

# Handlers globais
claude_handler = ClaudeHandler()
analytics_service = AnalyticsService()
session_manager = ClaudeCodeSessionManager()
session_validator = SessionValidator()
rate_limiter = RateLimitManager(redis_url=os.getenv("REDIS_URL"))

# Evento de startup para inicializar tarefas assíncronas
@app.on_event("startup")
async def startup_event():
    """Inicializa tarefas assíncronas no startup do servidor."""
    await claude_handler.ensure_pool_maintenance_started()
    await session_manager.ensure_scheduler_started()
    logger.info("Tarefas assíncronas iniciadas com sucesso")

# Funções utilitárias para monitoramento
def get_system_metrics() -> Dict[str, Any]:
    """Coleta métricas do sistema."""
    try:
        # Informações da CPU
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        
        # Informações da memória
        memory = psutil.virtual_memory()
        
        # Informações do processo atual
        process = psutil.Process()
        process_memory = process.memory_info()
        
        return {
            "cpu": {
                "usage_percent": cpu_percent,
                "count": cpu_count,
                "load_average": list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else None
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "usage_percent": memory.percent,
                "process_rss_mb": round(process_memory.rss / (1024**2), 2),
                "process_vms_mb": round(process_memory.vms / (1024**2), 2)
            },
            "disk": {
                "usage_percent": psutil.disk_usage('/').percent
            }
        }
    except Exception as e:
        logger.error(f"Erro ao coletar métricas do sistema: {e}")
        return {"error": str(e)}

async def check_claude_sdk_health() -> Dict[str, Any]:
    """Verifica status do Claude SDK."""
    try:
        # Testa conectividade criando uma sessão temporária
        test_session_id = f"health_check_{int(time.time())}"
        
        start_time = time.time()
        await claude_handler.create_session(test_session_id)
        connection_time = time.time() - start_time
        
        # Limpa sessão de teste
        await claude_handler.destroy_session(test_session_id)
        
        return {
            "status": "connected",
            "connection_time_ms": round(connection_time * 1000, 2),
            "last_check": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro na verificação do Claude SDK: {e}")
        return {
            "status": "error",
            "error": str(e),
            "last_check": datetime.now().isoformat()
        }

# Middleware para contagem de requests
@app.middleware("http")
async def metrics_middleware(request, call_next):
    """Middleware para coletar métricas de requests."""
    metrics['requests_total'] += 1
    metrics['requests_in_progress'] += 1
    
    start_time = time.time()
    
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        metrics['errors_total'] += 1
        raise
    finally:
        metrics['requests_in_progress'] -= 1

# Modelos de dados removidos - usando versões seguras de security_models.py

class HealthResponse(BaseModel):
    """Resposta do health check."""
    status: str = Field(..., description="Status da API", example="ok")
    service: str = Field(..., description="Nome do serviço", example="Claude Chat API")

class DetailedHealthResponse(BaseModel):
    """Resposta detalhada do health check."""
    status: str = Field(..., description="Status geral", example="healthy")
    service: str = Field(..., description="Nome do serviço", example="Claude Chat API")
    version: str = Field(..., description="Versão da API", example="1.0.0")
    uptime_seconds: float = Field(..., description="Tempo de atividade em segundos")
    timestamp: str = Field(..., description="Timestamp da verificação")
    sessions: Dict[str, Any] = Field(..., description="Estatísticas de sessões")
    system: Dict[str, Any] = Field(..., description="Métricas do sistema")
    claude_sdk: Dict[str, Any] = Field(..., description="Status do Claude SDK")
    performance: Dict[str, Any] = Field(..., description="Métricas de performance")
    stability: Dict[str, Any] = Field(..., description="Status de estabilidade e circuit breakers")
    fallback_stats: Dict[str, Any] = Field(..., description="Estatísticas dos fallbacks")

class MetricsResponse(BaseModel):
    """Resposta com métricas básicas."""
    requests_total: int = Field(..., description="Total de requests processados")
    requests_in_progress: int = Field(..., description="Requests em andamento")
    errors_total: int = Field(..., description="Total de erros")
    sessions_created: int = Field(..., description="Sessões criadas")
    sessions_active: int = Field(..., description="Sessões ativas")
    uptime_seconds: float = Field(..., description="Tempo de atividade")
    fallbacks_used: int = Field(..., description="Total de fallbacks utilizados")
    circuit_breakers_open: int = Field(..., description="Circuit breakers atualmente abertos")
    memory_usage_percent: float = Field(..., description="Uso de memória em %")
    cpu_usage_percent: float = Field(..., description="Uso de CPU em %")

class HeartbeatResponse(BaseModel):
    """Resposta do heartbeat."""
    alive: bool = Field(..., description="Indica se o serviço está vivo")
    timestamp: str = Field(..., description="Timestamp do heartbeat")
    uptime: float = Field(..., description="Tempo de atividade")

class SessionResponse(BaseModel):
    """Resposta para operações de sessão."""
    session_id: str = Field(..., description="ID da sessão", example="550e8400-e29b-41d4-a716-446655440000")

class StatusResponse(BaseModel):
    """Resposta genérica com status."""
    status: str = Field(..., description="Status da operação", example="success")
    session_id: str = Field(..., description="ID da sessão afetada", example="550e8400-e29b-41d4-a716-446655440000")

class StreamEvent(BaseModel):
    """Evento SSE para streaming."""
    type: str = Field(..., description="Tipo do evento", example="content")
    content: Optional[str] = Field(None, description="Conteúdo da mensagem", example="Olá! Como posso ajudar?")
    session_id: str = Field(..., description="ID da sessão", example="550e8400-e29b-41d4-a716-446655440000")
    error: Optional[str] = Field(None, description="Mensagem de erro se houver")

# SessionConfigRequest removido - usando SecureSessionConfigRequest

class SessionInfoResponse(BaseModel):
    """Informações detalhadas de uma sessão."""
    session_id: str
    active: bool
    config: Dict[str, Any]
    history: Dict[str, Any]

@app.get(
    "/",
    tags=["Sistema"],
    summary="Health Check",
    description="Verifica se a API está funcionando corretamente",
    response_description="Status da API",
    responses={
        200: {
            "description": "API funcionando normalmente",
            "content": {
                "application/json": {
                    "example": {"status": "ok", "service": "Claude Chat API"}
                }
            }
        }
    },
    response_model=HealthResponse
)
async def root() -> HealthResponse:
    """Health check endpoint para verificar o status da API."""
    return HealthResponse(status="ok", service="Claude Chat API")

@app.get(
    "/health/detailed",
    tags=["Sistema"],
    summary="Health Check Detalhado",
    description="""Verifica status detalhado da API com métricas completas.
    
    Inclui:
    - Status de sessões ativas
    - Uso de memória e CPU  
    - Status de conexão com Claude SDK
    - Métricas de performance
    - Tempo de atividade
    """,
    response_description="Status detalhado da API",
    response_model=DetailedHealthResponse
)
async def detailed_health() -> DetailedHealthResponse:
    """Health check detalhado com métricas completas."""
    current_time = datetime.now()
    uptime = time.time() - app_start_time
    
    # Atualiza status global
    health_status['last_check'] = current_time.isoformat()
    
    # Coleta informações de sessões
    active_sessions = list(claude_handler.clients.keys())
    session_info = {
        "active_count": len(active_sessions),
        "total_created": metrics['sessions_created'],
        "active_sessions": active_sessions[:10],  # Mostra apenas 10 primeiras
        "session_configs": len(claude_handler.session_configs)
    }
    
    # Métricas do sistema
    system_metrics = get_system_metrics()
    
    # Status do Claude SDK
    claude_status = await check_claude_sdk_health()
    
    # Métricas de performance
    performance_metrics = {
        "requests_total": metrics['requests_total'],
        "requests_in_progress": metrics['requests_in_progress'], 
        "errors_total": metrics['errors_total'],
        "error_rate": round(metrics['errors_total'] / max(metrics['requests_total'], 1) * 100, 2),
        "avg_response_time_ms": None  # Pode ser implementado com histórico
    }
    
    # Status de estabilidade e circuit breakers
    stability_status = stability_monitor.get_system_status()
    fallback_stats = fallback_system.get_fallback_stats()
    
    # Conta circuit breakers abertos
    open_breakers = sum(1 for cb_stats in stability_status["circuit_breakers"].values() 
                       if cb_stats["state"] == "open")
    metrics['circuit_breakers_open'] = open_breakers
    
    # Conta fallbacks usados
    total_fallbacks_used = sum(stats.get("fallback_used", 0) 
                              for stats in fallback_stats.get("operations", {}).values())
    metrics['fallbacks_used'] = total_fallbacks_used
    
    # Executa health checks registrados
    health_check_results = await stability_monitor.run_health_checks()
    
    # Determina status geral
    overall_status = "healthy"
    
    # Verifica condições de degradação
    if claude_status.get("status") == "error":
        overall_status = "degraded"
    elif system_metrics.get("memory", {}).get("usage_percent", 0) > 90:
        overall_status = "degraded"
    elif performance_metrics.get("error_rate", 0) > 10:
        overall_status = "degraded"
    elif open_breakers > 0:
        overall_status = "degraded"
    elif health_check_results.get("overall_status") != "healthy":
        overall_status = "degraded"
    
    return DetailedHealthResponse(
        status=overall_status,
        service="Claude Chat API",
        version="1.0.0",
        uptime_seconds=uptime,
        timestamp=current_time.isoformat(),
        sessions=session_info,
        system=system_metrics,
        claude_sdk=claude_status,
        performance=performance_metrics,
        stability=stability_status,
        fallback_stats=fallback_stats
    )

@app.get(
    "/metrics",
    tags=["Sistema"],
    summary="Métricas Básicas",
    description="Retorna métricas básicas para monitoramento externo",
    response_description="Métricas básicas de monitoramento",
    response_model=MetricsResponse
)
async def get_metrics() -> MetricsResponse:
    """Endpoint de métricas básicas para monitoramento."""
    uptime = time.time() - app_start_time
    metrics['sessions_active'] = len(claude_handler.clients)
    
    # Coleta métricas de sistema
    try:
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
    except:
        memory_percent = 0.0
        cpu_percent = 0.0
    else:
        memory_percent = memory.percent
    
    # Atualiza métricas de estabilidade
    stability_status = stability_monitor.get_system_status()
    open_breakers = sum(1 for cb_stats in stability_status["circuit_breakers"].values() 
                       if cb_stats["state"] == "open")
    metrics['circuit_breakers_open'] = open_breakers
    
    fallback_stats = fallback_system.get_fallback_stats()
    total_fallbacks_used = sum(stats.get("fallback_used", 0) 
                              for stats in fallback_stats.get("operations", {}).values())
    metrics['fallbacks_used'] = total_fallbacks_used
    
    return MetricsResponse(
        requests_total=metrics['requests_total'],
        requests_in_progress=metrics['requests_in_progress'],
        errors_total=metrics['errors_total'],
        sessions_created=metrics['sessions_created'],
        sessions_active=metrics['sessions_active'],
        uptime_seconds=uptime,
        fallbacks_used=metrics['fallbacks_used'],
        circuit_breakers_open=metrics['circuit_breakers_open'],
        memory_usage_percent=memory_percent,
        cpu_usage_percent=cpu_percent
    )

@app.get(
    "/heartbeat",
    tags=["Sistema"],
    summary="Heartbeat",
    description="Endpoint simples para verificação de vida do serviço",
    response_description="Confirmação de que o serviço está vivo",
    response_model=HeartbeatResponse
)
async def heartbeat() -> HeartbeatResponse:
    """Heartbeat simples para monitoramento externo."""
    return HeartbeatResponse(
        alive=True,
        timestamp=datetime.now().isoformat(),
        uptime=time.time() - app_start_time
    )

@app.get(
    "/health/stability",
    tags=["Sistema"],
    summary="Status de Estabilidade",
    description="Retorna status detalhado dos circuit breakers e sistema de fallbacks",
    response_description="Status de estabilidade do sistema"
)
async def get_stability_status():
    """Endpoint específico para monitoramento de estabilidade."""
    stability_status = stability_monitor.get_system_status()
    fallback_stats = fallback_system.get_fallback_stats()
    
    return {
        "timestamp": datetime.now().isoformat(),
        "circuit_breakers": stability_status["circuit_breakers"],
        "fallback_statistics": fallback_stats,
        "health_checks": stability_status["health_checks"],
        "summary": {
            "total_circuit_breakers": len(stability_status["circuit_breakers"]),
            "open_circuit_breakers": sum(1 for cb in stability_status["circuit_breakers"].values() 
                                       if cb["state"] == "open"),
            "total_operations_with_fallbacks": len(fallback_stats.get("operations", {})),
            "total_fallbacks_used": sum(stats.get("fallback_used", 0) 
                                      for stats in fallback_stats.get("operations", {}).values())
        }
    }

@app.post(
    "/health/circuit-breaker/{circuit_name}/reset",
    tags=["Sistema"],
    summary="Resetar Circuit Breaker",
    description="Força reset de um circuit breaker específico",
    response_description="Resultado do reset"
)
async def reset_circuit_breaker(circuit_name: str):
    """Reseta um circuit breaker específico."""
    cb = stability_monitor.get_circuit_breaker(circuit_name)
    
    if not cb:
        raise HTTPException(status_code=404, detail=f"Circuit breaker '{circuit_name}' não encontrado")
    
    # Reset manual do circuit breaker
    cb.state = CircuitState.CLOSED
    cb.failure_count = 0
    cb.success_count = 0
    cb.last_failure_time = None
    cb.half_open_requests = 0
    
    logger.info(
        f"Circuit breaker '{circuit_name}' resetado manualmente",
        extra={"event": "circuit_breaker_manual_reset", "circuit_name": circuit_name}
    )
    
    return {
        "circuit_breaker": circuit_name,
        "status": "reset",
        "new_state": cb.state.value,
        "timestamp": datetime.now().isoformat()
    }

@app.post(
    "/health/fallback-cache/clear",
    tags=["Sistema"], 
    summary="Limpar Cache de Fallbacks",
    description="Limpa todo o cache de fallbacks do sistema",
    response_description="Resultado da limpeza"
)
async def clear_fallback_cache():
    """Limpa o cache de fallbacks."""
    cache_stats_before = fallback_system.cache_manager.get_stats()
    fallback_system.cache_manager.clear()
    
    logger.info(
        "Cache de fallbacks limpo manualmente",
        extra={"event": "fallback_cache_cleared", "items_cleared": cache_stats_before["total_items"]}
    )
    
    return {
        "status": "cleared",
        "items_cleared": cache_stats_before["total_items"],
        "timestamp": datetime.now().isoformat()
    }

@app.post(
    "/api/chat",
    tags=["Chat"],
    summary="Enviar Mensagem",
    description="""Envia uma mensagem para Claude e recebe a resposta em streaming via SSE.
    
    As respostas são enviadas como Server-Sent Events (SSE) permitindo recebimento em tempo real.
    Cada chunk de resposta é enviado como um evento 'data' no formato JSON.
    """,
    response_description="Stream SSE com resposta de Claude",
    responses={
        200: {
            "description": "Stream SSE iniciado com sucesso",
            "content": {
                "text/event-stream": {
                    "example": "data: {\"type\": \"content\", \"content\": \"Olá!\", \"session_id\": \"uuid\"}\n\n"
                }
            }
        },
        500: {
            "description": "Erro no processamento da mensagem"
        }
    }
)
async def send_message(chat_message: SecureChatMessage) -> StreamingResponse:
    """Envia mensagem para Claude e retorna resposta em streaming."""
    
    # Se não há session_id, deixa None para Claude SDK criar
    session_id = chat_message.session_id
    
    # Log início da mensagem
    logger.info(
        "Iniciando envio de mensagem",
        extra={
            "event": "chat_message_start",
            "session_id": session_id or "new",
            "message_length": len(chat_message.message),
            "message_preview": chat_message.message[:100] + "..." if len(chat_message.message) > 100 else chat_message.message
        }
    )
    
    async def generate():
        """Gera stream SSE com tratamento robusto de erros."""
        # Inicializa real_session_id no escopo da função
        real_session_id = session_id
        start_time = time.time()
        total_chunks = 0
        
        try:
            # Usa sistema de fallbacks para execução protegida
            async def execute_chat():
                async for response in claude_handler.send_message(
                    session_id, 
                    chat_message.message
                ):
                    yield response
            
            # Executa com circuit breaker e fallbacks
            chat_result = await fallback_system.execute_with_fallback(
                "chat",
                execute_chat,
                {"session_id": session_id, "message": chat_message.message[:100]}
            )
            
            # Se usou fallback, envia resposta mock
            if chat_result.get("fallback_used"):
                mock_response = chat_result["result"]
                data = json.dumps(mock_response)
                yield f"data: {data}\n\n"
                total_chunks += 1
            else:
                # Execução normal - itera sobre os responses
                async for response in chat_result["result"]:
                    # Captura session_id real quando disponível
                    if "session_id" in response:
                        real_session_id = response["session_id"]
                        
                    # Se é primeira mensagem sem session_id, envia evento de nova sessão
                    if not session_id and real_session_id and real_session_id != session_id:
                        migration_data = json.dumps({
                            "type": "session_migrated",
                            "session_id": real_session_id,
                            "migrated": False  # Nova sessão, não migração
                        })
                        yield f"data: {migration_data}\n\n"
                        
                        logger.info(
                            "Nova sessão criada durante streaming",
                            extra={
                                "event": "session_auto_created",
                                "new_session_id": real_session_id
                            }
                        )
                    
                    # Formato SSE
                    data = json.dumps(response)
                    yield f"data: {data}\n\n"
                    total_chunks += 1
                    
        except Exception as e:
            error_msg = str(e)
            
            # Verifica se é erro de transporte fechado (cliente desconectou)
            if 'WriteUnixTransport' in error_msg and 'closed=True' in error_msg:
                logger.debug(
                    "Cliente desconectou durante streaming",
                    extra={
                        "event": "client_disconnected",
                        "session_id": real_session_id or "unknown",
                        "chunks_sent": total_chunks
                    }
                )
                # Não tenta enviar mais dados pois o cliente já fechou a conexão
                return
            
            # Tenta fallback em caso de outros erros
            try:
                fallback_result = await fallback_system.execute_with_fallback(
                    "chat",
                    lambda: {"type": "content", "content": f"Erro no sistema: {str(e)}", "session_id": real_session_id or "error"},
                    {"session_id": real_session_id or "error", "error": str(e)}
                )
                
                if fallback_result.get("fallback_used"):
                    mock_response = fallback_result["result"] 
                    data = json.dumps(mock_response)
                    yield f"data: {data}\n\n"
                    total_chunks += 1
                    
            except Exception as fallback_error:
                logger.error(f"Falha também no fallback: {fallback_error}")
                # Fallback final manual
                error_response = {
                    "type": "content",
                    "content": "⚠️ Sistema temporariamente indisponível. Tente novamente em alguns minutos.",
                    "session_id": real_session_id or "emergency",
                    "error": True
                }
                data = json.dumps(error_response)
                yield f"data: {data}\n\n"
                total_chunks += 1
                
        except asyncio.TimeoutError:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                "Timeout no streaming de mensagem",
                extra={
                    "event": "chat_streaming_timeout",
                    "session_id": real_session_id or "unknown",
                    "duration_ms": duration_ms,
                    "chunks_sent": total_chunks
                }
            )
            try:
                yield await StreamingErrorHandler.handle_streaming_error(
                    asyncio.TimeoutError("Timeout no processamento da mensagem"),
                    real_session_id or "unknown"
                )
            except:
                # Cliente já desconectou, ignora erro
                pass
            
        except Exception as e:
            error_msg = str(e)
            
            # Verifica se é erro de transporte fechado
            if 'WriteUnixTransport' in error_msg and 'closed=True' in error_msg:
                logger.debug(
                    "Cliente desconectou no final do streaming",
                    extra={
                        "event": "client_disconnected_end",
                        "session_id": real_session_id or "unknown"
                    }
                )
                return
            
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                "Erro durante streaming de mensagem",
                extra={
                    "event": "chat_streaming_error",
                    "session_id": real_session_id or "unknown",
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "duration_ms": duration_ms,
                    "chunks_sent": total_chunks
                }
            )
            try:
                yield await StreamingErrorHandler.handle_streaming_error(
                    e, real_session_id or "unknown"
                )
            except:
                # Cliente já desconectou, ignora erro
                pass
        finally:
            duration_ms = (time.time() - start_time) * 1000
            
            # Log final do streaming
            logger.info(
                "Finalizando streaming de mensagem",
                extra={
                    "event": "chat_streaming_complete",
                    "session_id": real_session_id or "unknown",
                    "duration_ms": duration_ms,
                    "total_chunks": total_chunks
                }
            )
            
            # Tenta enviar evento de fim, mas ignora se cliente já desconectou
            try:
                final_data = {
                    'type': 'done', 
                    'session_id': real_session_id or "unknown"
                }
                yield f"data: {json.dumps(final_data)}\n\n"
            except:
                # Cliente já desconectou, não há problema
                pass
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-ID": session_id or "pending"
        }
    )

@app.post(
    "/api/interrupt",
    tags=["Sessões"],
    summary="Interromper Sessão",
    description="""Interrompe imediatamente a geração de resposta em andamento para uma sessão específica.
    
    Útil quando o usuário deseja parar uma resposta longa ou cancelar uma operação.
    """,
    response_description="Confirmação de interrupção",
    responses={
        200: {
            "description": "Sessão interrompida com sucesso",
            "content": {
                "application/json": {
                    "example": {"status": "interrupted", "session_id": "uuid"}
                }
            }
        },
        404: {
            "description": "Sessão não encontrada"
        }
    },
    response_model=StatusResponse
)
async def interrupt_session(action: SecureSessionAction) -> StatusResponse:
    """Interrompe a execução de uma sessão ativa."""
    logger.info(
        "Iniciando interrupção de sessão",
        extra={
            "event": "session_interrupt_start",
            "session_id": action.session_id
        }
    )
    
    try:
        success = await asyncio.wait_for(
            claude_handler.interrupt_session(action.session_id),
            timeout=10.0  # Timeout de 10 segundos para interrupção
        )
        
        if not success:
            logger.warning(
                "Sessão não encontrada para interrupção",
                extra={
                    "event": "session_not_found",
                    "session_id": action.session_id
                }
            )
            raise HTTPException(status_code=404, detail="Session not found")
        
        logger.info(
            "Sessão interrompida com sucesso",
            extra={
                "event": "session_interrupted",
                "session_id": action.session_id
            }
        )
        
        return StatusResponse(status="interrupted", session_id=action.session_id)
        
    except asyncio.TimeoutError:
        logger.error(
            "Timeout ao interromper sessão",
            extra={
                "event": "session_interrupt_timeout",
                "session_id": action.session_id,
                "timeout_seconds": 10
            }
        )
        raise HTTPException(
            status_code=408, 
            detail="Timeout ao interromper sessão"
        )
    except Exception as e:
        logger.error(
            "Erro ao interromper sessão",
            extra={
                "event": "session_interrupt_error",
                "session_id": action.session_id,
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao interromper sessão: {str(e)}"
        )

@app.post(
    "/api/clear",
    tags=["Sessões"],
    summary="Limpar Contexto",
    description="""Limpa todo o histórico e contexto de uma sessão, mantendo o session_id.
    
    Após limpar, a sessão continua ativa mas sem histórico de mensagens anteriores.
    """,
    response_description="Confirmação de limpeza",
    responses={
        200: {
            "description": "Contexto limpo com sucesso",
            "content": {
                "application/json": {
                    "example": {"status": "cleared", "session_id": "uuid"}
                }
            }
        }
    },
    response_model=StatusResponse
)
async def clear_session(action: SecureSessionAction) -> StatusResponse:
    """Limpa o contexto e histórico de uma sessão."""
    logger.info(
        "Iniciando limpeza de sessão",
        extra={
            "event": "session_clear_start",
            "session_id": action.session_id
        }
    )
    
    try:
        await asyncio.wait_for(
            claude_handler.clear_session(action.session_id),
            timeout=30.0  # Timeout de 30 segundos para limpeza
        )
        
        logger.info(
            "Sessão limpa com sucesso",
            extra={
                "event": "session_cleared",
                "session_id": action.session_id
            }
        )
        
        return StatusResponse(status="cleared", session_id=action.session_id)
        
    except asyncio.TimeoutError:
        logger.error(
            "Timeout ao limpar sessão",
            extra={
                "event": "session_clear_timeout",
                "session_id": action.session_id,
                "timeout_seconds": 30
            }
        )
        raise HTTPException(
            status_code=408,
            detail="Timeout ao limpar sessão"
        )
    except Exception as e:
        logger.error(
            "Erro ao limpar sessão",
            extra={
                "event": "session_clear_error",
                "session_id": action.session_id,
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao limpar sessão: {str(e)}"
        )


@app.delete(
    "/api/session/{session_id}",
    tags=["Sessões"],
    summary="Deletar Sessão",
    description="""Remove permanentemente uma sessão e todo seu histórico.
    
    Esta ação é irreversível. A sessão e todas as mensagens associadas serão deletadas.
    """,
    response_description="Confirmação de exclusão",
    responses={
        200: {
            "description": "Sessão deletada com sucesso",
            "content": {
                "application/json": {
                    "example": {"status": "deleted", "session_id": "uuid"}
                }
            }
        },
        404: {
            "description": "Sessão não encontrada"
        }
    },
    response_model=StatusResponse
)
async def delete_session(session_id: str = Path(..., description="ID único da sessão a ser deletada")) -> StatusResponse:
    """Remove permanentemente uma sessão."""
    logger.info(
        "Iniciando deleção de sessão",
        extra={
            "event": "session_delete_start",
            "session_id": session_id
        }
    )
    
    try:
        await asyncio.wait_for(
            claude_handler.destroy_session(session_id),
            timeout=30.0  # Timeout de 30 segundos para deleção
        )
        
        logger.info(
            "Sessão deletada com sucesso",
            extra={
                "event": "session_deleted",
                "session_id": session_id
            }
        )
        
        return StatusResponse(status="deleted", session_id=session_id)
        
    except asyncio.TimeoutError:
        logger.error(
            "Timeout ao deletar sessão",
            extra={
                "event": "session_delete_timeout",
                "session_id": session_id,
                "timeout_seconds": 30
            }
        )
        raise HTTPException(
            status_code=408,
            detail="Timeout ao deletar sessão"
        )
    except Exception as e:
        logger.error(
            "Erro ao deletar sessão",
            extra={
                "event": "session_delete_error",
                "session_id": session_id,
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao deletar sessão: {str(e)}"
        )

@app.post(
    "/api/session-with-config",
    tags=["Sessões"],
    summary="Criar Sessão com Configuração",
    description="""Cria uma nova sessão com configurações específicas.
    
    Permite definir system prompt, ferramentas permitidas, diretório de trabalho e outras opções.
    """,
    response_description="ID da nova sessão criada",
    responses={
        200: {
            "description": "Sessão criada com configurações",
            "content": {
                "application/json": {
                    "example": {"session_id": "uuid"}
                }
            }
        }
    },
    response_model=SessionResponse
)
async def create_session_with_config(config: SecureSessionConfigRequest) -> SessionResponse:
    """Cria uma sessão com configurações específicas."""
    session_id = str(uuid.uuid4())
    
    session_config = SessionConfig(
        system_prompt=config.system_prompt,
        allowed_tools=config.allowed_tools,
        max_turns=config.max_turns,
        permission_mode=config.permission_mode,
        cwd=config.cwd
    )
    
    await claude_handler.create_session(session_id, session_config)
    
    # Atualiza métricas
    metrics['sessions_created'] += 1
    
    logger.info(f"✅ Sessão criada: {session_id}")
    return SessionResponse(session_id=session_id)

@app.put(
    "/api/session/{session_id}/config",
    tags=["Sessões"],
    summary="Atualizar Configuração da Sessão",
    description="""Atualiza a configuração de uma sessão existente.
    
    A sessão será recriada com as novas configurações mas o histórico será mantido.
    """,
    response_description="Confirmação de atualização",
    responses={
        200: {
            "description": "Configuração atualizada",
            "content": {
                "application/json": {
                    "example": {"status": "updated", "session_id": "uuid"}
                }
            }
        },
        404: {
            "description": "Sessão não encontrada"
        }
    },
    response_model=StatusResponse
)
async def update_session_config(
    session_id: str = Path(..., description="ID da sessão"),
    config: SecureSessionConfigRequest = ...
) -> StatusResponse:
    """Atualiza configuração de uma sessão."""
    session_config = SessionConfig(
        system_prompt=config.system_prompt,
        allowed_tools=config.allowed_tools,
        max_turns=config.max_turns,
        permission_mode=config.permission_mode,
        cwd=config.cwd
    )
    
    success = await claude_handler.update_session_config(session_id, session_config)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return StatusResponse(status="updated", session_id=session_id)

@app.get(
    "/api/session/{session_id}",
    tags=["Sessões"],
    summary="Obter Informações da Sessão",
    description="""Retorna informações detalhadas sobre uma sessão específica.
    
    Inclui configurações, estatísticas de uso e status.
    """,
    response_description="Informações da sessão",
    responses={
        200: {
            "description": "Informações da sessão",
            "content": {
                "application/json": {
                    "example": {
                        "session_id": "uuid",
                        "active": True,
                        "config": {
                            "system_prompt": "...",
                            "allowed_tools": ["Read", "Write"],
                            "created_at": "2024-01-01T00:00:00"
                        },
                        "history": {
                            "message_count": 10,
                            "total_tokens": 1000,
                            "total_cost": 0.05
                        }
                    }
                }
            }
        },
        404: {
            "description": "Sessão não encontrada"
        }
    },
    response_model=SessionInfoResponse
)
async def get_session_info(session_id: str = Path(..., description="ID da sessão")) -> SessionInfoResponse:
    """Obtém informações detalhadas de uma sessão."""
    info = await claude_handler.get_session_info(session_id)
    
    if "error" in info:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionInfoResponse(**info)

@app.get(
    "/api/sessions",
    tags=["Sessões"],
    summary="Listar Todas as Sessões",
    description="""Retorna lista de todas as sessões ativas com suas informações.
    
    Útil para monitoramento e gerenciamento de múltiplas conversas.
    """,
    response_description="Lista de sessões",
    responses={
        200: {
            "description": "Lista de sessões ativas",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "session_id": "uuid1",
                            "active": True,
                            "config": {"system_prompt": "..."},
                            "history": {"message_count": 5}
                        }
                    ]
                }
            }
        }
    }
)
async def list_sessions() -> List[SessionInfoResponse]:
    """Lista todas as sessões ativas."""
    sessions = await claude_handler.get_all_sessions()
    return [SessionInfoResponse(**session) for session in sessions]

@app.get(
    "/api/current-session-id",
    tags=["Sessões"],
    summary="Obter ID da Sessão Claude Code Atual",
    description="""Retorna o ID da sessão Claude Code ativa atual extraído dos arquivos .jsonl.
    
    Busca em ~/.claude/projects/ pelo arquivo .jsonl mais recente.
    """,
    response_description="ID da sessão atual"
)
async def get_current_claude_session_id():
    """Obtém ID real da sessão Claude Code ativa do projeto cc-sdk-chat."""
    import json
    import glob
    from pathlib import Path
    
    claude_projects = Path.home() / ".claude" / "projects"
    
    if not claude_projects.exists():
        return {"session_id": None, "error": "Diretório ~/.claude/projects/ não encontrado"}
    
    # Busca especificamente no projeto cc-sdk-chat-api
    target_project = None
    for project_dir in claude_projects.iterdir():
        if project_dir.is_dir() and "cc-sdk-chat-api" in project_dir.name:
            target_project = project_dir
            break
    
    if not target_project:
        # Fallback: busca em todos os projetos
        jsonl_files = []
        for project_dir in claude_projects.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob("*.jsonl"):
                    jsonl_files.append(jsonl_file)
    else:
        # Busca apenas no projeto correto
        jsonl_files = list(target_project.glob("*.jsonl"))
    
    if not jsonl_files:
        return {"session_id": None, "error": "Nenhum arquivo .jsonl encontrado"}
    
    # Ordena por modificação mais recente
    jsonl_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
    latest_file = jsonl_files[0]
    
    try:
        # Lê primeira linha para pegar sessionId
        with open(latest_file, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if first_line:
                data = json.loads(first_line)
                session_id = data.get('sessionId')
                return {
                    "session_id": session_id,
                    "file": str(latest_file),
                    "project": latest_file.parent.name
                }
    except Exception as e:
        return {"session_id": None, "error": str(e)}
    
    return {"session_id": None, "error": "Não foi possível extrair sessionId"}

@app.get(
    "/api/session-history/{session_id}",
    tags=["Sessões"],
    summary="Obter Histórico Real da Sessão Claude",
    description="""Carrega histórico completo de uma sessão do arquivo .jsonl.
    
    Preserva todo o histórico mesmo se a pessoa sair e entrar novamente.
    """,
    response_description="Histórico da sessão"
)
async def get_session_history(session_id: str):
    """Obtém histórico real de uma sessão do arquivo .jsonl."""
    import json
    from pathlib import Path
    
    claude_projects = Path.home() / ".claude" / "projects"
    
    if not claude_projects.exists():
        return {"messages": [], "error": "Diretório ~/.claude/projects/ não encontrado"}
    
    # Busca arquivo com este session_id
    target_file = None
    for project_dir in claude_projects.iterdir():
        if project_dir.is_dir():
            for jsonl_file in project_dir.glob("*.jsonl"):
                if jsonl_file.stem == session_id:
                    target_file = jsonl_file
                    break
            if target_file:
                break
    
    if not target_file:
        return {"messages": [], "error": f"Arquivo de sessão {session_id} não encontrado"}
    
    messages = []
    origin = None  # Detecta origem da sessão
    session_title = None
    
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            first_line = True
            for line in f:
                if line.strip():
                    try:
                        data = json.loads(line)
                        
                        # Detecta origem na primeira linha
                        if first_line:
                            first_line = False
                            if data.get('type') == 'summary':
                                origin = 'Terminal'
                                session_title = 'Claude Code SDK - Somente Leitura'
                            elif data.get('userType') == 'external':
                                origin = 'Terminal'
                                session_title = 'Claude Code SDK - Somente Leitura'
                            else:
                                origin = 'Web'
                                session_title = f'Sessão {session_id[-8:]}'
                        
                        # Extrai mensagem se existir
                        if 'message' in data and 'role' in data['message']:
                            msg = data['message']
                            
                            # Converte para formato do chat
                            chat_message = {
                                "id": data.get('uuid', ''),
                                "role": msg['role'],
                                "content": msg.get('content', ''),
                                "timestamp": data.get('timestamp'),
                                "tokens": None,
                                "cost": None
                            }
                            
                            # Extrai tokens e custo se disponível
                            if 'usage' in msg:
                                usage = msg['usage']
                                chat_message["tokens"] = {
                                    "input": usage.get('input_tokens', 0),
                                    "output": usage.get('output_tokens', 0)
                                }
                            
                            # Detecta ferramentas usadas
                            tools_used = []
                            if 'content' in msg and isinstance(msg['content'], list):
                                for content_block in msg['content']:
                                    if isinstance(content_block, dict) and content_block.get('type') == 'tool_use':
                                        tool_name = content_block.get('name')
                                        if tool_name:
                                            tools_used.append(tool_name)
                            
                            if tools_used:
                                chat_message["tools"] = tools_used
                            
                            messages.append(chat_message)
                            
                    except json.JSONDecodeError:
                        continue
                        
    except Exception as e:
        return {"messages": [], "error": str(e)}
    
    return {
        "messages": messages,
        "session_id": session_id,
        "origin": origin,
        "title": session_title,
        "total_messages": len(messages),
        "file": str(target_file)
    }

@app.get(
    "/api/analytics/global",
    tags=["Analytics"],
    summary="Analytics Globais das Sessões",
    description="""Retorna métricas completas de todas as sessões Claude Code.
    
    Analisa todos os arquivos .jsonl para fornecer:
    - Total de tokens, custo, mensagens
    - Métricas por projeto  
    - Ferramentas mais usadas
    - Rankings de sessões
    """,
    response_description="Analytics completos"
)
async def get_global_analytics():
    """Obtém analytics globais de todas as sessões."""
    try:
        analytics = await analytics_service.get_global_analytics()
        
        return {
            "summary": {
                "total_sessions": analytics.total_sessions,
                "total_messages": analytics.total_messages,
                "total_tokens": analytics.total_tokens,
                "total_cost": analytics.total_cost,
                "active_projects": len(analytics.active_projects)
            },
            "by_project": {
                "sessions": analytics.sessions_by_project,
                "costs": analytics.cost_by_project,
                "tokens": analytics.tokens_by_project
            },
            "top_tools": analytics.most_used_tools,
            "top_sessions": [
                {
                    "id": s.session_id,
                    "project": s.project,
                    "messages": s.total_messages,
                    "tokens": s.total_input_tokens + s.total_output_tokens,
                    "cost": s.total_cost,
                    "duration_hours": s.duration_hours,
                    "tools": s.tools_used
                }
                for s in sorted(analytics.sessions_metrics, key=lambda x: x.total_messages, reverse=True)[:10]
            ]
        }
    except Exception as e:
        return {"error": str(e)}

@app.get(
    "/api/analytics/session/{session_id}",
    tags=["Analytics"],
    summary="Analytics de Sessão Específica",
    description="""Retorna métricas detalhadas de uma sessão específica.""",
    response_description="Analytics da sessão"
)
async def get_session_analytics(session_id: str):
    """Obtém analytics de uma sessão específica."""
    try:
        metrics = await analytics_service.get_session_analytics(session_id)
        
        if not metrics:
            return {"error": "Sessão não encontrada"}
        
        return {
            "session_id": metrics.session_id,
            "project": metrics.project,
            "messages": {
                "total": metrics.total_messages,
                "user": metrics.user_messages,
                "assistant": metrics.assistant_messages
            },
            "tokens": {
                "input": metrics.total_input_tokens,
                "output": metrics.total_output_tokens,
                "total": metrics.total_input_tokens + metrics.total_output_tokens
            },
            "cost": metrics.total_cost,
            "tools_used": metrics.tools_used,
            "timing": {
                "first_message": metrics.first_message_time.isoformat() if metrics.first_message_time else None,
                "last_message": metrics.last_message_time.isoformat() if metrics.last_message_time else None,
                "duration_hours": metrics.duration_hours
            },
            "file_path": metrics.file_path
        }
    except Exception as e:
        return {"error": str(e)}

@app.get(
    "/api/validate-session/{session_id}",
    tags=["Sessões"],
    summary="Validar Sessão",
    description="Valida se uma sessão existe e pode ser usada para redirecionamento",
    response_description="Status de validação da sessão"
)
async def validate_session(session_id: str = Path(..., description="ID da sessão para validar")):
    """Valida se uma sessão existe e é válida para uso."""
    validation = session_validator.validate_session_for_redirect(session_id)
    
    if validation['can_redirect']:
        return {
            "valid": True,
            "session_id": session_id,
            "message": "Sessão válida e existe no sistema"
        }
    else:
        return {
            "valid": False,
            "session_id": session_id,
            "error": validation['error'],
            "details": {
                "exists": validation['exists'],
                "is_temporary": validation['is_temporary'],
                "is_valid_uuid": validation['valid']
            }
        }

@app.get(
    "/api/real-sessions",
    tags=["Sessões"],
    summary="Listar Sessões Reais",
    description="Retorna lista de IDs de sessões que realmente existem no sistema",
    response_description="Lista de sessões reais existentes"
)
async def get_real_sessions():
    """Lista todas as sessões reais que existem no sistema."""
    real_sessions = session_validator.get_real_session_ids()
    return {
        "sessions": list(real_sessions),
        "count": len(real_sessions),
        "message": f"Encontradas {len(real_sessions)} sessões reais no sistema"
    }

@app.get(
    "/api/discover-projects",
    tags=["Projetos"],
    summary="Descobrir Todos os Projetos",
    description="Descobre automaticamente todos os projetos Claude Code disponíveis",
    response_description="Lista de projetos com estatísticas"
)
async def discover_projects():
    """Descobre todos os projetos Claude Code no sistema."""
    import json
    from pathlib import Path
    
    claude_projects = Path.home() / ".claude" / "projects"
    
    if not claude_projects.exists():
        return {"projects": [], "count": 0, "error": "Diretório ~/.claude/projects/ não encontrado"}
    
    projects = []
    
    for project_dir in claude_projects.iterdir():
        if project_dir.is_dir():
            jsonl_files = list(project_dir.glob("*.jsonl"))
            
            if jsonl_files:
                # Calcula estatísticas do projeto
                total_messages = 0
                total_sessions = len(jsonl_files)
                last_activity = None
                
                for jsonl_file in jsonl_files:
                    try:
                        # Lê primeira e última linha para estatísticas básicas
                        with open(jsonl_file, 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                            total_messages += len(lines)
                            
                            # Pega timestamp da última linha
                            if lines:
                                try:
                                    last_line = json.loads(lines[-1])
                                    if 'timestamp' in last_line:
                                        file_time = last_line['timestamp']
                                        if not last_activity or file_time > last_activity:
                                            last_activity = file_time
                                except:
                                    pass
                    except:
                        continue
                
                projects.append({
                    "name": project_dir.name,
                    "path": str(project_dir),
                    "sessions_count": total_sessions,
                    "total_messages": total_messages,
                    "last_activity": last_activity,
                    "url_path": project_dir.name
                })
    
    # Ordena por última atividade
    projects.sort(key=lambda p: p['last_activity'] or '', reverse=True)
    
    return {
        "projects": projects,
        "count": len(projects),
        "message": f"Encontrados {len(projects)} projetos Claude Code"
    }

@app.get(
    "/api/web-sessions",
    tags=["Sessões"],
    summary="Listar Sessões Web",
    description="Lista apenas sessões criadas via SDK Web (não Terminal)",
    response_description="Lista de sessões Web com estatísticas"
)
async def get_web_sessions():
    """Lista apenas sessões criadas via interface Web."""
    import json
    from pathlib import Path
    
    claude_projects = Path.home() / ".claude" / "projects"
    
    if not claude_projects.exists():
        return {"sessions": [], "count": 0, "error": "Diretório ~/.claude/projects/ não encontrado"}
    
    web_sessions = []
    
    for project_dir in claude_projects.iterdir():
        if project_dir.is_dir():
            for jsonl_file in project_dir.glob("*.jsonl"):
                try:
                    with open(jsonl_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        
                    if not lines:
                        continue
                        
                    # Verifica se é sessão Web (não Terminal)
                    is_web_session = False
                    total_messages = len(lines)
                    first_message = None
                    last_message = None
                    
                    for line in lines:
                        try:
                            data = json.loads(line)
                            
                            # Detecta origem Web
                            if (data.get('type') == 'summary' or 
                                data.get('userType') != 'external'):
                                is_web_session = True
                            
                            # Pega primeira mensagem
                            if data.get('type') in ['user', 'assistant'] and not first_message:
                                first_message = data.get('timestamp')
                            
                            # Atualiza última mensagem
                            if data.get('timestamp'):
                                last_message = data.get('timestamp')
                                
                        except:
                            continue
                    
                    if is_web_session:
                        session_id = jsonl_file.stem
                        web_sessions.append({
                            "id": session_id,
                            "project": project_dir.name,
                            "total_messages": total_messages,
                            "first_message": first_message,
                            "last_activity": last_message,
                            "url": f"/{project_dir.name}/{session_id}"
                        })
                        
                except Exception as e:
                    continue
    
    # Ordena por última atividade
    web_sessions.sort(key=lambda s: s['last_activity'] or '', reverse=True)
    
    return {
        "sessions": web_sessions,
        "count": len(web_sessions),
        "message": f"Encontradas {len(web_sessions)} sessões Web"
    }

@app.post(
    "/api/load-project-history",
    tags=["Sessões"],
    summary="Carregar Histórico do Projeto",
    description="Carrega histórico completo de todas as sessões do projeto",
    response_description="Histórico unificado do projeto"
)
async def load_project_history(request: dict):
    """Carrega histórico completo do projeto com todas as sessões."""
    try:
        project_path = request.get('projectPath')
        primary_session_id = request.get('primarySessionId')
        
        # Busca todas as sessões reais no projeto
        real_sessions = session_validator.get_real_session_ids()
        sessions_data = []
        
        for session_id in real_sessions:
            try:
                # Usa o endpoint existente para carregar histórico da sessão
                session_history = await get_session_history(session_id)
                
                if 'error' not in session_history and session_history.get('messages'):
                    sessions_data.append({
                        'id': session_id,
                        'messages': session_history['messages'],
                        'origin': 'Claude Code',
                        'createdAt': session_history.get('first_message_time'),
                        'cwd': project_path
                    })
            except Exception as e:
                print(f"⚠️ Erro ao carregar sessão {session_id}: {e}")
                continue
        
        return {
            "sessions": sessions_data,
            "isSingleSession": len(sessions_data) == 1,
            "continuationMode": primary_session_id in real_sessions,
            "projectPath": project_path,
            "totalSessions": len(sessions_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar histórico: {str(e)}")

@app.get(
    "/api/security/session-validation/{session_id}",
    tags=["Segurança"],
    summary="Validação de Segurança de Sessão",
    description="""Executa validação completa de segurança para uma sessão específica.
    
    Retorna score de segurança, issues encontradas e recomendações.
    """,
    response_description="Relatório de segurança da sessão"
)
async def validate_session_security(session_id: str = Path(..., description="ID da sessão")) -> Dict[str, Any]:
    """Valida segurança completa de uma sessão."""
    try:
        validation_result = session_validator.validate_session_security(session_id)
        
        logger.info(
            "Validação de segurança de sessão executada",
            extra={
                "event": "security_validation",
                "session_id": session_id,
                "risk_level": validation_result["risk_level"],
                "security_score": validation_result["security_score"],
                "allowed": validation_result["allowed"]
            }
        )
        
        return validation_result
        
    except Exception as e:
        logger.error(
            "Erro na validação de segurança",
            extra={
                "event": "security_validation_error",
                "session_id": session_id,
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro na validação de segurança: {str(e)}"
        )

@app.get(
    "/api/security/suspicious-sessions",
    tags=["Segurança"],
    summary="Escanear Sessões Suspeitas",
    description="""Escaneia sistema em busca de sessões suspeitas ou com problemas de segurança.
    
    Identifica sessões com formato inválido, arquivos corrompidos, etc.
    """,
    response_description="Relatório de sessões suspeitas"
)
async def scan_suspicious_sessions() -> Dict[str, Any]:
    """Escaneia por sessões suspeitas no sistema."""
    try:
        suspicious = session_validator.scan_for_suspicious_sessions()
        
        total_suspicious = sum(len(sessions) for sessions in suspicious.values())
        
        logger.info(
            "Scan de sessões suspeitas executado",
            extra={
                "event": "suspicious_sessions_scan",
                "total_suspicious": total_suspicious,
                "categories": {k: len(v) for k, v in suspicious.items()}
            }
        )
        
        return {
            "summary": {
                "total_suspicious": total_suspicious,
                "categories_found": len([k for k, v in suspicious.items() if v]),
                "scan_timestamp": datetime.now().isoformat()
            },
            "details": suspicious,
            "recommendations": [
                "Execute limpeza das sessões com formato inválido" if suspicious["invalid_format"] else None,
                "Verifique sessões com arquivos grandes" if suspicious["large_files"] else None,
                "Considere arquivar sessões antigas" if suspicious["old_sessions"] else None,
                "Remove sessões vazias" if suspicious["empty_sessions"] else None,
            ]
        }
        
    except Exception as e:
        logger.error(
            "Erro no scan de sessões suspeitas",
            extra={
                "event": "suspicious_scan_error",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro no scan: {str(e)}"
        )

@app.post(
    "/api/security/cleanup-sessions",
    tags=["Segurança"],
    summary="Limpeza de Sessões Inválidas",
    description="""Remove sessões inválidas ou suspeitas do sistema.
    
    Por padrão executa em dry-run. Use 'execute=true' para executar de fato.
    """,
    response_description="Resultado da limpeza"
)
async def cleanup_invalid_sessions(execute: bool = False) -> Dict[str, Any]:
    """Limpa sessões inválidas do sistema."""
    try:
        result = session_validator.cleanup_invalid_sessions(dry_run=not execute)
        
        logger.info(
            "Limpeza de sessões executada",
            extra={
                "event": "session_cleanup",
                "dry_run": result["dry_run"],
                "removed_count": result["removed_count"],
                "size_recovered": result["size_recovered"],
                "errors_count": len(result["errors"])
            }
        )
        
        # Adiciona informações úteis
        result["size_recovered_mb"] = round(result["size_recovered"] / (1024 * 1024), 2)
        result["timestamp"] = datetime.now().isoformat()
        
        return result
        
    except Exception as e:
        logger.error(
            "Erro na limpeza de sessões",
            extra={
                "event": "cleanup_error",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro na limpeza: {str(e)}"
        )

@app.get(
    "/api/security/rate-limit-status",
    tags=["Segurança"],
    summary="Status de Rate Limiting",
    description="""Retorna status atual de rate limiting para o cliente.
    
    Mostra quantas requisições restam e quando o limite reseta.
    """,
    response_description="Status do rate limiting"
)
async def get_rate_limit_status(request: Request) -> Dict[str, Any]:
    """Obtém status de rate limiting para o cliente atual."""
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Simula verificação de rate limit (sem consumir)
        status = await rate_limiter.get_client_status(client_ip, str(request.url.path))
        
        return {
            "client_ip": client_ip,
            "timestamp": datetime.now().isoformat(),
            **status
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter status de rate limiting: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Usa variáveis de ambiente para configuração flexível
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8989"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    uvicorn.run(
        app, 
        host=host, 
        port=port, 
        log_level=log_level,
        reload=False,
        access_log=True
    )