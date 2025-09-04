"""
Configuração de logging estruturado para API Claude Code SDK.

Sistema de logging com formatação JSON, rotação automática e níveis apropriados.
"""

import logging
import logging.handlers
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import traceback
import uuid
from contextvars import ContextVar

# Context variables para rastreamento de requests
request_id: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
session_id: ContextVar[Optional[str]] = ContextVar('session_id', default=None)
user_ip: ContextVar[Optional[str]] = ContextVar('user_ip', default=None)

class StructuredFormatter(logging.Formatter):
    """Formatter personalizado que produz logs em formato JSON estruturado."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Formata o log record em JSON estruturado."""
        
        # Dados básicos do log
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process_id': record.process,
            'thread_id': record.thread,
        }
        
        # Adiciona contexto da request se disponível
        req_id = request_id.get()
        if req_id:
            log_data['request_id'] = req_id
            
        sess_id = session_id.get()
        if sess_id:
            log_data['session_id'] = sess_id
            
        ip = user_ip.get()
        if ip:
            log_data['client_ip'] = ip
        
        # Adiciona dados extras do record
        if hasattr(record, 'extra_data') and record.extra_data:
            log_data['extra'] = record.extra_data
            
        # Adiciona informações de erro se houver
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info)
            }
            
        # Adiciona dados de performance se disponível
        if hasattr(record, 'duration'):
            log_data['duration_ms'] = record.duration
            
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
            
        return json.dumps(log_data, ensure_ascii=False)

class ContextualLogger:
    """Logger que inclui automaticamente informações de contexto."""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
    def _add_context(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Adiciona informações de contexto ao log."""
        context = extra or {}
        
        # Adiciona request_id se não estiver presente
        if 'request_id' not in context:
            req_id = request_id.get()
            if req_id:
                context['request_id'] = req_id
                
        return context
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log de debug com contexto."""
        extra_data = self._add_context(extra)
        self.logger.debug(message, extra={'extra_data': extra_data}, **kwargs)
        
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log de info com contexto."""
        extra_data = self._add_context(extra)
        self.logger.info(message, extra={'extra_data': extra_data}, **kwargs)
        
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log de warning com contexto."""
        extra_data = self._add_context(extra)
        self.logger.warning(message, extra={'extra_data': extra_data}, **kwargs)
        
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info: bool = True, **kwargs):
        """Log de erro com contexto e stack trace."""
        extra_data = self._add_context(extra)
        self.logger.error(message, extra={'extra_data': extra_data}, exc_info=exc_info, **kwargs)
        
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info: bool = True, **kwargs):
        """Log crítico com contexto."""
        extra_data = self._add_context(extra)
        self.logger.critical(message, extra={'extra_data': extra_data}, exc_info=exc_info, **kwargs)

def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> None:
    """
    Configura sistema de logging estruturado.
    
    Args:
        level: Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Caminho para arquivo de log (opcional)
        max_bytes: Tamanho máximo do arquivo antes da rotação
        backup_count: Número de arquivos de backup a manter
    """
    
    # Remove handlers existentes
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Define nível de logging
    log_level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(log_level)
    
    # Formatter estruturado
    formatter = StructuredFormatter()
    
    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    root_logger.addHandler(console_handler)
    
    # Handler para arquivo com rotação (se especificado)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        root_logger.addHandler(file_handler)
    
    # Configura loggers específicos
    _configure_specific_loggers()

def _configure_specific_loggers():
    """Configura loggers para módulos específicos."""
    
    # Logger do uvicorn mais verboso em debug
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_access = logging.getLogger("uvicorn.access")
    
    # Logger do FastAPI
    fastapi_logger = logging.getLogger("fastapi")
    
    # Logger do Claude SDK
    claude_logger = logging.getLogger("claude_handler")
    claude_logger.setLevel(logging.DEBUG)
    
    # Logger de sessões
    session_logger = logging.getLogger("session_manager")
    session_logger.setLevel(logging.DEBUG)
    
    # Logger de analytics
    analytics_logger = logging.getLogger("analytics_service")
    analytics_logger.setLevel(logging.INFO)

def get_contextual_logger(name: str) -> ContextualLogger:
    """
    Obtém logger contextual para um módulo específico.
    
    Args:
        name: Nome do módulo/logger
        
    Returns:
        ContextualLogger configurado
    """
    return ContextualLogger(name)

def set_request_context(req_id: str, sess_id: Optional[str] = None, client_ip: Optional[str] = None):
    """
    Define contexto da request atual.
    
    Args:
        req_id: ID único da request
        sess_id: ID da sessão (opcional)
        client_ip: IP do cliente (opcional)
    """
    request_id.set(req_id)
    if sess_id:
        session_id.set(sess_id)
    if client_ip:
        user_ip.set(client_ip)

def clear_request_context():
    """Limpa contexto da request."""
    request_id.set(None)
    session_id.set(None)
    user_ip.set(None)

def generate_request_id() -> str:
    """Gera ID único para a request."""
    return str(uuid.uuid4())

# Configuração padrão se executado diretamente
if __name__ == "__main__":
    setup_logging(
        level="DEBUG",
        log_file="/tmp/claude_api_test.log"
    )
    
    logger = get_contextual_logger(__name__)
    
    # Testes de logging
    set_request_context("test-123", "session-456", "127.0.0.1")
    
    logger.info("Teste de logging estruturado", extra={"test_data": {"key": "value"}})
    logger.warning("Aviso de teste")
    
    try:
        raise ValueError("Erro de teste")
    except Exception:
        logger.error("Erro capturado durante teste")
    
    clear_request_context()
    logger.info("Log sem contexto")