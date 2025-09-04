"""Servidor FastAPI simplificado para testes de estabilidade."""

from fastapi import FastAPI, HTTPException
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
import logging
from datetime import datetime

# Importações essenciais apenas
from claude_handler import ClaudeHandler, SessionConfig
from analytics_service import AnalyticsService
from session_manager import ClaudeCodeSessionManager
from session_validator import SessionValidator

# Configuração de logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Variáveis globais para monitoramento
app_start_time = time.time()
health_status = {'status': 'starting', 'last_check': None}
metrics = {
    'requests_total': 0,
    'requests_in_progress': 0,
    'errors_total': 0,
    'sessions_created': 0,
    'sessions_active': 0
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação com inicialização e shutdown limpos."""
    # Inicialização
    logger.info("🚀 Iniciando Claude Chat API...")
    health_status['status'] = 'healthy'
    health_status['last_check'] = datetime.now().isoformat()
    
    # Inicializa handlers
    try:
        # Teste de conectividade com Claude SDK
        logger.info("🔍 Verificando conectividade com Claude SDK...")
        test_client = claude_handler.clients.get('test')
        if not test_client:
            await claude_handler.create_session('test')
            await claude_handler.destroy_session('test')
        logger.info("✅ Claude SDK conectado com sucesso")
        
    except Exception as e:
        logger.error(f"⚠️ Problema na inicialização: {e}")
        health_status['status'] = 'degraded'
    
    logger.info("✅ Claude Chat API iniciada com sucesso")
    
    yield
    
    # Shutdown limpo
    logger.info("🔄 Iniciando shutdown graceful...")
    health_status['status'] = 'shutting_down'
    
    # Encerra todas as sessões ativas
    try:
        active_sessions = list(claude_handler.clients.keys())
        logger.info(f"🔌 Encerrando {len(active_sessions)} sessões ativas...")
        
        for session_id in active_sessions:
            try:
                await claude_handler.destroy_session(session_id)
            except Exception as e:
                logger.warning(f"⚠️ Erro ao encerrar sessão {session_id}: {e}")
        
        logger.info("✅ Sessões encerradas")
        
    except Exception as e:
        logger.error(f"❌ Erro durante shutdown: {e}")
    
    logger.info("✅ Shutdown concluído")

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
    * **Monitoramento Avançado** - Health checks detalhados e métricas
    """,
    version="1.0.0"
)

# Configuração CORS
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handlers globais
claude_handler = ClaudeHandler()
analytics_service = AnalyticsService()
session_manager = ClaudeCodeSessionManager()
session_validator = SessionValidator()

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

# Models
class ChatMessage(BaseModel):
    """Modelo para mensagem de chat."""
    message: str = Field(..., description="Conteúdo da mensagem")
    session_id: Optional[str] = Field(None, description="ID da sessão")

class SessionAction(BaseModel):
    """Modelo para ações em sessões."""
    session_id: str = Field(..., description="ID único da sessão")

class HealthResponse(BaseModel):
    """Resposta do health check."""
    status: str = Field(..., description="Status da API")
    service: str = Field(..., description="Nome do serviço")

class DetailedHealthResponse(BaseModel):
    """Resposta detalhada do health check."""
    status: str
    service: str 
    version: str
    uptime_seconds: float
    timestamp: str
    sessions: Dict[str, Any]
    system: Dict[str, Any]
    claude_sdk: Dict[str, Any]
    performance: Dict[str, Any]

class MetricsResponse(BaseModel):
    """Resposta com métricas básicas."""
    requests_total: int
    requests_in_progress: int
    errors_total: int
    sessions_created: int
    sessions_active: int
    uptime_seconds: float

class HeartbeatResponse(BaseModel):
    """Resposta do heartbeat."""
    alive: bool
    timestamp: str
    uptime: float

# Endpoints básicos

@app.get("/", response_model=HealthResponse)
async def root() -> HealthResponse:
    """Health check endpoint para verificar o status da API."""
    return HealthResponse(status="ok", service="Claude Chat API")

@app.get("/health/detailed", response_model=DetailedHealthResponse)
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
    
    # Determina status geral
    overall_status = "healthy"
    if claude_status["status"] == "error":
        overall_status = "degraded"
    elif system_metrics.get("memory", {}).get("usage_percent", 0) > 90:
        overall_status = "degraded"
    elif performance_metrics['error_rate'] > 10:
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
        performance=performance_metrics
    )

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    """Endpoint de métricas básicas para monitoramento."""
    uptime = time.time() - app_start_time
    metrics['sessions_active'] = len(claude_handler.clients)
    
    return MetricsResponse(
        requests_total=metrics['requests_total'],
        requests_in_progress=metrics['requests_in_progress'],
        errors_total=metrics['errors_total'],
        sessions_created=metrics['sessions_created'],
        sessions_active=metrics['sessions_active'],
        uptime_seconds=uptime
    )

@app.get("/heartbeat", response_model=HeartbeatResponse)
async def heartbeat() -> HeartbeatResponse:
    """Heartbeat simples para monitoramento externo."""
    return HeartbeatResponse(
        alive=True,
        timestamp=datetime.now().isoformat(),
        uptime=time.time() - app_start_time
    )

@app.post("/api/chat")
async def send_message(chat_message: ChatMessage) -> StreamingResponse:
    """Envia mensagem para Claude e retorna resposta em streaming."""
    
    session_id = chat_message.session_id
    
    async def generate():
        """Gera stream SSE."""
        real_session_id = session_id
        
        try:
            async for response in claude_handler.send_message(
                session_id, 
                chat_message.message
            ):
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
                
                # Formato SSE
                data = json.dumps(response)
                yield f"data: {data}\n\n"
                
        except Exception as e:
            error_data = json.dumps({
                "type": "error",
                "error": str(e),
                "session_id": real_session_id or "unknown"
            })
            yield f"data: {error_data}\n\n"
        finally:
            # Envia evento de fim com session_id real
            final_data = {
                'type': 'done', 
                'session_id': real_session_id or "unknown"
            }
            yield f"data: {json.dumps(final_data)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-ID": session_id or "pending"
        }
    )

@app.post("/api/session-with-config")
async def create_session_with_config(config: dict) -> dict:
    """Cria uma sessão com configurações específicas."""
    session_id = str(uuid.uuid4())
    
    session_config = SessionConfig(
        system_prompt=config.get('system_prompt'),
        allowed_tools=config.get('allowed_tools', []),
        max_turns=config.get('max_turns'),
        permission_mode=config.get('permission_mode', 'acceptEdits'),
        cwd=config.get('cwd')
    )
    
    await claude_handler.create_session(session_id, session_config)
    
    # Atualiza métricas
    metrics['sessions_created'] += 1
    
    logger.info(f"✅ Sessão criada: {session_id}")
    return {"session_id": session_id}

@app.post("/api/interrupt")
async def interrupt_session(action: SessionAction):
    """Interrompe a execução de uma sessão ativa."""
    success = await claude_handler.interrupt_session(action.session_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {"status": "interrupted", "session_id": action.session_id}

@app.post("/api/clear")
async def clear_session(action: SessionAction):
    """Limpa o contexto e histórico de uma sessão."""
    await claude_handler.clear_session(action.session_id)
    return {"status": "cleared", "session_id": action.session_id}

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Remove permanentemente uma sessão."""
    await claude_handler.destroy_session(session_id)
    return {"status": "deleted", "session_id": session_id}

if __name__ == "__main__":
    import uvicorn
    import os
    
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