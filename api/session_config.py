"""
Configurações centralizadas para o sistema otimizado de gerenciamento de sessões.

Este módulo centraliza todas as configurações relacionadas ao gerenciamento
de sessões, pool de conexões, timeouts e limites do sistema.
"""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class SessionManagerConfig:
    """Configurações do SessionManager."""
    
    # Limites de sessão
    MAX_SESSIONS: int = 50
    SESSION_TIMEOUT_MINUTES: int = 30
    
    # Limpeza automática
    CLEANUP_INTERVAL_MINUTES: int = 5
    ORPHAN_DETECTION_ENABLED: bool = True
    
    # Pool de conexões
    MAX_CONNECTION_POOL_SIZE: int = 10
    CONNECTION_REUSE_ENABLED: bool = True


@dataclass  
class ConnectionPoolConfig:
    """Configurações do pool de conexões."""
    
    # Tamanhos do pool
    MAX_SIZE: int = 10
    MIN_SIZE: int = 2
    INITIAL_SIZE: int = 2
    
    # Limites de idade e uso
    CONNECTION_MAX_AGE_MINUTES: int = 60
    CONNECTION_MAX_USES: int = 100
    
    # Health checks
    HEALTH_CHECK_INTERVAL: int = 300  # 5 minutos
    HEALTH_CHECK_TIMEOUT: int = 10    # 10 segundos
    
    # Timeouts de conexão
    CONNECT_TIMEOUT: float = 20.0
    DISCONNECT_TIMEOUT: float = 10.0


@dataclass
class SessionOptimizationConfig:
    """Configurações de otimização de sessão."""
    
    # Timeouts de operação
    SESSION_CREATE_TIMEOUT: float = 30.0
    SESSION_DESTROY_TIMEOUT: float = 15.0
    MESSAGE_SEND_TIMEOUT: float = 300.0  # 5 minutos
    
    # Retry e backoff
    MAX_RETRIES: int = 3
    RETRY_DELAY_BASE: float = 1.0
    RETRY_DELAY_MAX: float = 10.0
    
    # Métricas
    METRICS_ENABLED: bool = True
    METRICS_RETENTION_HOURS: int = 24


@dataclass
class SystemConfig:
    """Configuração geral do sistema."""
    
    def __init__(self):
        self.session_manager = SessionManagerConfig()
        self.connection_pool = ConnectionPoolConfig()
        self.optimization = SessionOptimizationConfig()
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte configuração para dicionário."""
        return {
            'session_manager': {
                'max_sessions': self.session_manager.MAX_SESSIONS,
                'timeout_minutes': self.session_manager.SESSION_TIMEOUT_MINUTES,
                'cleanup_interval': self.session_manager.CLEANUP_INTERVAL_MINUTES,
                'orphan_detection': self.session_manager.ORPHAN_DETECTION_ENABLED,
                'connection_reuse': self.session_manager.CONNECTION_REUSE_ENABLED
            },
            'connection_pool': {
                'max_size': self.connection_pool.MAX_SIZE,
                'min_size': self.connection_pool.MIN_SIZE,
                'initial_size': self.connection_pool.INITIAL_SIZE,
                'max_age_minutes': self.connection_pool.CONNECTION_MAX_AGE_MINUTES,
                'max_uses': self.connection_pool.CONNECTION_MAX_USES,
                'health_check_interval': self.connection_pool.HEALTH_CHECK_INTERVAL,
                'connect_timeout': self.connection_pool.CONNECT_TIMEOUT,
                'disconnect_timeout': self.connection_pool.DISCONNECT_TIMEOUT
            },
            'optimization': {
                'session_create_timeout': self.optimization.SESSION_CREATE_TIMEOUT,
                'session_destroy_timeout': self.optimization.SESSION_DESTROY_TIMEOUT,
                'message_send_timeout': self.optimization.MESSAGE_SEND_TIMEOUT,
                'max_retries': self.optimization.MAX_RETRIES,
                'metrics_enabled': self.optimization.METRICS_ENABLED,
                'metrics_retention_hours': self.optimization.METRICS_RETENTION_HOURS
            }
        }
    
    @classmethod
    def from_env(cls) -> 'SystemConfig':
        """Cria configuração a partir de variáveis de ambiente."""
        import os
        
        config = cls()
        
        # Session Manager
        config.session_manager.MAX_SESSIONS = int(os.getenv('SM_MAX_SESSIONS', '50'))
        config.session_manager.SESSION_TIMEOUT_MINUTES = int(os.getenv('SM_TIMEOUT_MINUTES', '30'))
        config.session_manager.CLEANUP_INTERVAL_MINUTES = int(os.getenv('SM_CLEANUP_INTERVAL', '5'))
        
        # Connection Pool
        config.connection_pool.MAX_SIZE = int(os.getenv('CP_MAX_SIZE', '10'))
        config.connection_pool.MIN_SIZE = int(os.getenv('CP_MIN_SIZE', '2'))
        config.connection_pool.CONNECTION_MAX_AGE_MINUTES = int(os.getenv('CP_MAX_AGE_MINUTES', '60'))
        config.connection_pool.CONNECTION_MAX_USES = int(os.getenv('CP_MAX_USES', '100'))
        
        # Optimization
        config.optimization.SESSION_CREATE_TIMEOUT = float(os.getenv('OPT_CREATE_TIMEOUT', '30.0'))
        config.optimization.SESSION_DESTROY_TIMEOUT = float(os.getenv('OPT_DESTROY_TIMEOUT', '15.0'))
        config.optimization.MESSAGE_SEND_TIMEOUT = float(os.getenv('OPT_MESSAGE_TIMEOUT', '300.0'))
        
        return config


# Instância global de configuração
system_config = SystemConfig()