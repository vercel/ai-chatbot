"""
Middleware global de tratamento de exceções para FastAPI.

Sistema robusto de captura e tratamento de erros com logging estruturado.
"""

import time
import asyncio
import traceback
from typing import Callable, Any
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from logging_config import (
    get_contextual_logger, 
    set_request_context, 
    clear_request_context,
    generate_request_id
)

logger = get_contextual_logger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware para tratamento global de exceções e logging de requests."""
    
    def __init__(
        self, 
        app: ASGIApp,
        timeout_seconds: float = 300.0  # 5 minutos default
    ):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Processa request com tratamento de erros e timeout."""
        
        # Gera ID único para a request
        req_id = generate_request_id()
        client_ip = self._get_client_ip(request)
        
        # Configura contexto da request
        set_request_context(req_id, client_ip=client_ip)
        
        start_time = time.time()
        
        # Log inicial da request
        logger.info(
            f"REQUEST_START: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
                "client_ip": client_ip,
                "user_agent": request.headers.get("user-agent")
            }
        )
        
        try:
            # Executa request com timeout
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout_seconds
            )
            
            # Calcula duração
            duration = (time.time() - start_time) * 1000  # em ms
            
            # Log de sucesso
            logger.info(
                f"REQUEST_SUCCESS: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "status_code": response.status_code,
                    "duration_ms": duration,
                    "response_size": response.headers.get("content-length")
                }
            )
            
            # Adiciona headers de debug
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Response-Time"] = f"{duration:.2f}ms"
            
            return response
            
        except asyncio.TimeoutError:
            duration = (time.time() - start_time) * 1000
            
            logger.error(
                f"REQUEST_TIMEOUT: {request.method} {request.url.path}",
                extra={
                    "timeout_seconds": self.timeout_seconds,
                    "duration_ms": duration,
                    "error_type": "TimeoutError"
                }
            )
            
            return JSONResponse(
                status_code=408,
                content={
                    "error": "Request Timeout",
                    "message": f"Request excedeu o limite de {self.timeout_seconds} segundos",
                    "request_id": req_id,
                    "type": "timeout_error"
                },
                headers={"X-Request-ID": req_id}
            )
            
        except HTTPException as e:
            duration = (time.time() - start_time) * 1000
            
            # HTTPException é um erro controlado
            logger.warning(
                f"REQUEST_HTTP_ERROR: {request.method} {request.url.path} - {e.status_code}",
                extra={
                    "status_code": e.status_code,
                    "detail": e.detail,
                    "duration_ms": duration,
                    "error_type": "HTTPException"
                }
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "HTTP Error",
                    "message": str(e.detail),
                    "status_code": e.status_code,
                    "request_id": req_id,
                    "type": "http_error"
                },
                headers={"X-Request-ID": req_id}
            )
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            
            # Erro não tratado - crítico
            logger.critical(
                f"REQUEST_UNHANDLED_ERROR: {request.method} {request.url.path}",
                extra={
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "duration_ms": duration,
                    "traceback": traceback.format_exc()
                }
            )
            
            # Em produção, não expor detalhes internos
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "Ocorreu um erro interno no servidor",
                    "request_id": req_id,
                    "type": "internal_error"
                },
                headers={"X-Request-ID": req_id}
            )
            
        finally:
            # Sempre limpa contexto
            clear_request_context()
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrai IP do cliente considerando proxies."""
        
        # Verifica headers de proxy comuns
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
            
        # IP direto
        return request.client.host if request.client else "unknown"

class StreamingErrorHandler:
    """Handler específico para erros em endpoints de streaming."""
    
    @staticmethod
    async def handle_streaming_error(
        error: Exception, 
        session_id: str = "unknown"
    ) -> str:
        """
        Formata erro para streaming SSE.
        
        Args:
            error: Exceção ocorrida
            session_id: ID da sessão afetada
            
        Returns:
            Evento SSE formatado com erro
        """
        
        logger.error(
            f"STREAMING_ERROR: {type(error).__name__}",
            extra={
                "session_id": session_id,
                "error_type": type(error).__name__,
                "error_message": str(error)
            }
        )
        
        error_event = {
            "type": "error",
            "error": str(error),
            "error_type": type(error).__name__,
            "session_id": session_id,
            "recoverable": _is_recoverable_error(error)
        }
        
        import json
        return f"data: {json.dumps(error_event)}\n\n"

def _is_recoverable_error(error: Exception) -> bool:
    """Determina se um erro pode ser recuperado pelo cliente."""
    
    # Erros de timeout ou rede são recuperáveis
    if isinstance(error, (asyncio.TimeoutError, ConnectionError)):
        return True
        
    # Erros de validação podem ser corrigidos
    if "validation" in str(error).lower():
        return True
        
    # Outros erros geralmente não são recuperáveis
    return False

# Decorador para adicionar tratamento de erro a funções individuais
def handle_errors(
    logger_name: str = None,
    timeout_seconds: float = None,
    reraise: bool = False
):
    """
    Decorador para tratamento de erros em funções específicas.
    
    Args:
        logger_name: Nome do logger a usar (default: nome da função)
        timeout_seconds: Timeout específico para a função
        reraise: Se deve re-lançar a exceção após logar
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            func_logger = get_contextual_logger(logger_name or func.__name__)
            
            start_time = time.time()
            
            func_logger.debug(
                f"FUNCTION_START: {func.__name__}",
                extra={"args_count": len(args), "kwargs_keys": list(kwargs.keys())}
            )
            
            try:
                if timeout_seconds:
                    result = await asyncio.wait_for(
                        func(*args, **kwargs),
                        timeout=timeout_seconds
                    )
                else:
                    result = await func(*args, **kwargs)
                    
                duration = (time.time() - start_time) * 1000
                
                func_logger.debug(
                    f"FUNCTION_SUCCESS: {func.__name__}",
                    extra={"duration_ms": duration}
                )
                
                return result
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                
                func_logger.error(
                    f"FUNCTION_ERROR: {func.__name__}",
                    extra={
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "duration_ms": duration
                    }
                )
                
                if reraise:
                    raise
                    
                return None
                
        return wrapper
    return decorator