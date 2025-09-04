"""Sistema de monitoramento de estabilidade e circuit breaker para a API Claude SDK."""

import asyncio
import time
from typing import Dict, Any, Optional, Callable, List
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
import logging
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Estados do Circuit Breaker."""
    CLOSED = "closed"          # Normal - permite requisições
    OPEN = "open"              # Erro - bloqueia requisições  
    HALF_OPEN = "half_open"    # Teste - permite requisições limitadas


@dataclass
class CircuitBreakerConfig:
    """Configuração do Circuit Breaker."""
    failure_threshold: int = 5           # Falhas consecutivas para abrir
    success_threshold: int = 3           # Sucessos para fechar
    timeout_seconds: int = 60            # Tempo para tentar half-open
    max_requests_half_open: int = 3      # Máx requests em half-open


class CircuitBreaker:
    """Circuit Breaker para proteger operações críticas."""
    
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_requests = 0
        
    def can_execute(self) -> bool:
        """Verifica se a operação pode ser executada."""
        now = time.time()
        
        if self.state == CircuitState.CLOSED:
            return True
            
        elif self.state == CircuitState.OPEN:
            if (self.last_failure_time and 
                now - self.last_failure_time >= self.config.timeout_seconds):
                self.state = CircuitState.HALF_OPEN
                self.half_open_requests = 0
                logger.info(f"Circuit breaker {self.name} mudou para HALF_OPEN")
                return True
            return False
            
        elif self.state == CircuitState.HALF_OPEN:
            return self.half_open_requests < self.config.max_requests_half_open
        
        return False
    
    def on_success(self):
        """Registra sucesso na operação."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info(f"Circuit breaker {self.name} FECHADO (funcionando)")
        else:
            self.failure_count = 0
    
    def on_failure(self):
        """Registra falha na operação."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker {self.name} ABERTO novamente")
        elif self.failure_count >= self.config.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker {self.name} ABERTO por falhas consecutivas")
    
    async def execute(self, func: Callable, *args, **kwargs):
        """Executa função protegida pelo circuit breaker."""
        if not self.can_execute():
            raise CircuitBreakerOpenException(f"Circuit breaker {self.name} está aberto")
        
        if self.state == CircuitState.HALF_OPEN:
            self.half_open_requests += 1
        
        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do circuit breaker."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
            "can_execute": self.can_execute()
        }


class CircuitBreakerOpenException(Exception):
    """Exceção lançada quando circuit breaker está aberto."""
    pass


class ReconnectionManager:
    """Gerenciador de reconexão automática."""
    
    def __init__(self):
        self.retry_delays = [1, 2, 5, 10, 30, 60]  # Backoff exponencial
        self.max_retries = len(self.retry_delays)
        
    async def retry_with_backoff(
        self, 
        func: Callable, 
        *args, 
        max_retries: Optional[int] = None,
        **kwargs
    ) -> Any:
        """Executa função com retry e backoff exponencial."""
        max_retries = max_retries or self.max_retries
        
        for attempt in range(max_retries + 1):
            try:
                result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
                if attempt > 0:
                    logger.info(f"Reconexão bem-sucedida após {attempt} tentativa(s)")
                return result
                
            except Exception as e:
                if attempt >= max_retries:
                    logger.error(f"Falhou após {max_retries} tentativas: {e}")
                    raise
                
                delay = self.retry_delays[min(attempt, len(self.retry_delays) - 1)]
                logger.warning(f"Tentativa {attempt + 1} falhou: {e}. Tentando novamente em {delay}s...")
                await asyncio.sleep(delay)


class StabilityMonitor:
    """Monitor geral de estabilidade do sistema."""
    
    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.reconnection_manager = ReconnectionManager()
        self.health_checks: Dict[str, Callable] = {}
        self.last_health_check: Optional[datetime] = None
        self.health_check_interval = 300  # 5 minutos
        
    def register_circuit_breaker(
        self, 
        name: str, 
        config: Optional[CircuitBreakerConfig] = None
    ) -> CircuitBreaker:
        """Registra um novo circuit breaker."""
        cb = CircuitBreaker(name, config)
        self.circuit_breakers[name] = cb
        logger.info(f"Circuit breaker '{name}' registrado")
        return cb
    
    def get_circuit_breaker(self, name: str) -> Optional[CircuitBreaker]:
        """Obtém circuit breaker por nome."""
        return self.circuit_breakers.get(name)
    
    def register_health_check(self, name: str, check_func: Callable):
        """Registra função de health check."""
        self.health_checks[name] = check_func
        logger.info(f"Health check '{name}' registrado")
    
    async def run_health_checks(self) -> Dict[str, Any]:
        """Executa todos os health checks."""
        results = {}
        overall_healthy = True
        
        for name, check_func in self.health_checks.items():
            try:
                if asyncio.iscoroutinefunction(check_func):
                    result = await asyncio.wait_for(check_func(), timeout=30.0)
                else:
                    result = check_func()
                    
                results[name] = {"status": "healthy", "result": result}
                
            except asyncio.TimeoutError:
                results[name] = {"status": "timeout", "error": "Health check timeout"}
                overall_healthy = False
                
            except Exception as e:
                results[name] = {"status": "error", "error": str(e)}
                overall_healthy = False
                logger.error(f"Health check '{name}' falhou: {e}")
        
        self.last_health_check = datetime.now()
        
        return {
            "timestamp": self.last_health_check.isoformat(),
            "overall_status": "healthy" if overall_healthy else "degraded",
            "checks": results
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Retorna status geral do sistema."""
        circuit_stats = {}
        for name, cb in self.circuit_breakers.items():
            circuit_stats[name] = cb.get_stats()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "circuit_breakers": circuit_stats,
            "health_checks": {
                "last_check": self.last_health_check.isoformat() if self.last_health_check else None,
                "registered_checks": list(self.health_checks.keys())
            }
        }
    
    async def protected_execute(
        self, 
        circuit_name: str, 
        func: Callable, 
        *args, 
        **kwargs
    ) -> Any:
        """Executa função protegida por circuit breaker."""
        cb = self.circuit_breakers.get(circuit_name)
        if not cb:
            # Se não tem circuit breaker, executa normalmente
            return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        
        return await cb.execute(func, *args, **kwargs)
    
    async def protected_execute_with_retry(
        self, 
        circuit_name: str, 
        func: Callable, 
        *args,
        max_retries: Optional[int] = None,
        **kwargs
    ) -> Any:
        """Executa função protegida com circuit breaker e retry."""
        async def execute_protected():
            return await self.protected_execute(circuit_name, func, *args, **kwargs)
        
        return await self.reconnection_manager.retry_with_backoff(
            execute_protected, 
            max_retries=max_retries
        )


# Instância global do monitor de estabilidade
stability_monitor = StabilityMonitor()


def circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None):
    """Decorator para proteção com circuit breaker."""
    def decorator(func):
        cb = stability_monitor.register_circuit_breaker(name, config)
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await cb.execute(func, *args, **kwargs)
        return wrapper
    return decorator


def retry_on_failure(max_retries: int = 3):
    """Decorator para retry automático."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await stability_monitor.reconnection_manager.retry_with_backoff(
                func, *args, max_retries=max_retries, **kwargs
            )
        return wrapper
    return decorator