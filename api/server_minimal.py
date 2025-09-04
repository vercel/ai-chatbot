"""Servidor FastAPI mínimo para demonstração das melhorias de estabilidade."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
import json
import uuid
import psutil
import time
import logging
from datetime import datetime

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

# Mock de sessões para demonstração
mock_sessions = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação com inicialização e shutdown limpos."""
    # Inicialização
    logger.info("🚀 Iniciando Claude Chat API (Versão Mínima)...")
    health_status['status'] = 'healthy'
    health_status['last_check'] = datetime.now().isoformat()
    
    logger.info("✅ Claude Chat API iniciada com sucesso")
    
    yield
    
    # Shutdown limpo
    logger.info("🔄 Iniciando shutdown graceful...")
    health_status['status'] = 'shutting_down'
    
    # Limpa sessões mock
    mock_sessions.clear()
    
    logger.info("✅ Shutdown concluído")

app = FastAPI(
    title="Claude Chat API",
    lifespan=lifespan,
    description="""
    ## API de Chat com Claude Code SDK - Versão de Demonstração
    
    Esta versão demonstra as melhorias de estabilidade implementadas:
    
    * **Health Check Detalhado** - `/health/detailed` com métricas completas
    * **Métricas Básicas** - `/metrics` para monitoramento
    * **Heartbeat** - `/heartbeat` para verificação simples
    * **Graceful Shutdown** - Shutdown limpo usando lifespan events
    * **Logging Estruturado** - Logs detalhados para auditoria
    """,
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    """Simula verificação de status do Claude SDK."""
    try:
        # Simula teste de conectividade
        start_time = time.time()
        # Simula delay de conexão
        import asyncio
        await asyncio.sleep(0.1)
        connection_time = time.time() - start_time
        
        return {
            "status": "connected",
            "connection_time_ms": round(connection_time * 1000, 2),
            "last_check": datetime.now().isoformat(),
            "mock_mode": True  # Indica que é uma simulação
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
        logger.error(f"Erro no request: {e}")
        raise
    finally:
        metrics['requests_in_progress'] -= 1

# Models
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

# Endpoints

@app.get("/", response_model=HealthResponse)
async def root() -> HealthResponse:
    """Health check endpoint para verificar o status da API."""
    return HealthResponse(status="ok", service="Claude Chat API (Minimal)")

@app.get("/health/detailed", response_model=DetailedHealthResponse)
async def detailed_health() -> DetailedHealthResponse:
    """Health check detalhado com métricas completas."""
    current_time = datetime.now()
    uptime = time.time() - app_start_time
    
    # Atualiza status global
    health_status['last_check'] = current_time.isoformat()
    
    # Coleta informações de sessões (mock)
    session_info = {
        "active_count": len(mock_sessions),
        "total_created": metrics['sessions_created'],
        "active_sessions": list(mock_sessions.keys())[:10],  # Mostra apenas 10 primeiras
        "session_configs": len(mock_sessions)
    }
    
    # Métricas do sistema
    system_metrics = get_system_metrics()
    
    # Status do Claude SDK (simulado)
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
        service="Claude Chat API (Minimal)",
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
    metrics['sessions_active'] = len(mock_sessions)
    
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

# Endpoints de demonstração com fallbacks

@app.post("/api/session-demo")
async def create_demo_session(config: Dict[str, Any] = {}):
    """Cria uma sessão de demonstração com fallbacks."""
    session_id = str(uuid.uuid4())
    
    try:
        # Simula criação de sessão com possível falha
        if "force_error" in config:
            raise Exception("Erro simulado na criação de sessão")
        
        # Simula configuração da sessão
        mock_sessions[session_id] = {
            "created_at": datetime.now().isoformat(),
            "config": config,
            "active": True,
            "retry_count": 0
        }
        
        # Atualiza métricas
        metrics['sessions_created'] += 1
        
        logger.info(f"✅ Sessão demo criada: {session_id}")
        return {"session_id": session_id, "status": "created"}
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar sessão demo: {e}")
        
        # Fallback: retorna sessão temporária
        temp_session_id = f"temp_{int(time.time())}"
        mock_sessions[temp_session_id] = {
            "created_at": datetime.now().isoformat(),
            "config": {"fallback": True},
            "active": True,
            "temporary": True
        }
        
        logger.info(f"🔄 Sessão temporária criada como fallback: {temp_session_id}")
        return {
            "session_id": temp_session_id, 
            "status": "fallback_created",
            "warning": "Sessão temporária criada devido a falha"
        }

@app.get("/api/session-demo/{session_id}/status")
async def get_demo_session_status(session_id: str):
    """Obtém status de uma sessão demo com reconexão automática."""
    
    if session_id not in mock_sessions:
        # Simula tentativa de reconexão
        logger.info(f"🔄 Tentando reconectar sessão: {session_id}")
        
        # Simula falha/sucesso na reconexão
        import random
        if random.random() > 0.3:  # 70% chance de sucesso
            # Reconexão bem-sucedida
            mock_sessions[session_id] = {
                "created_at": datetime.now().isoformat(),
                "config": {"reconnected": True},
                "active": True,
                "reconnect_count": 1
            }
            logger.info(f"✅ Sessão reconectada com sucesso: {session_id}")
            return {
                "session_id": session_id,
                "status": "reconnected",
                "active": True
            }
        else:
            # Falha na reconexão
            logger.warning(f"⚠️ Falha na reconexão da sessão: {session_id}")
            raise HTTPException(
                status_code=404, 
                detail="Session not found and reconnection failed"
            )
    
    session = mock_sessions[session_id]
    return {
        "session_id": session_id,
        "status": "active" if session["active"] else "inactive",
        **session
    }

@app.delete("/api/session-demo/{session_id}")
async def delete_demo_session(session_id: str):
    """Deleta uma sessão demo com shutdown graceful."""
    if session_id not in mock_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = mock_sessions[session_id]
    
    try:
        # Simula shutdown graceful
        logger.info(f"🔄 Iniciando shutdown graceful da sessão: {session_id}")
        
        # Simula cleanup de recursos
        import asyncio
        await asyncio.sleep(0.1)
        
        # Remove sessão
        del mock_sessions[session_id]
        
        logger.info(f"✅ Sessão removida com sucesso: {session_id}")
        return {"status": "deleted", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"❌ Erro ao deletar sessão: {e}")
        
        # Fallback: marca como inativa
        session["active"] = False
        session["error"] = str(e)
        
        logger.warning(f"⚠️ Sessão marcada como inativa devido a erro: {session_id}")
        return {
            "status": "marked_inactive",
            "session_id": session_id,
            "warning": "Sessão marcada como inativa devido a erro no shutdown"
        }

@app.get("/api/demo/force-error")
async def force_error():
    """Endpoint para testar tratamento de erros."""
    logger.error("❌ Erro forçado para teste")
    raise HTTPException(status_code=500, detail="Erro simulado para teste")

@app.get("/api/demo/system-stress")  
async def system_stress():
    """Simula stress no sistema para testar degradação graceful."""
    import random
    
    # Simula alto uso de CPU/memória
    stress_level = random.uniform(0.7, 0.95)
    
    if stress_level > 0.9:
        logger.warning(f"⚠️ Sistema sob stress alto: {stress_level:.2%}")
        return {
            "status": "degraded",
            "system_load": stress_level,
            "recommendation": "Considere reduzir carga ou escalar recursos"
        }
    else:
        return {
            "status": "normal",
            "system_load": stress_level
        }

if __name__ == "__main__":
    import uvicorn
    import os
    
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8989"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    print(f"""
🚀 Iniciando Claude Chat API - Versão de Demonstração
📍 URL: http://{host}:{port}
📊 Health Check Detalhado: http://{host}:{port}/health/detailed
📈 Métricas: http://{host}:{port}/metrics  
💓 Heartbeat: http://{host}:{port}/heartbeat
📖 Documentação: http://{host}:{port}/docs
    """)
    
    uvicorn.run(
        app, 
        host=host, 
        port=port, 
        log_level=log_level,
        reload=False,
        access_log=True
    )