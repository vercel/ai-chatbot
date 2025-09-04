"""Sistema de fallbacks para operações críticas da API Claude SDK."""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional, Callable, Union
from datetime import datetime
from dataclasses import dataclass
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class FallbackStrategy(Enum):
    """Estratégias de fallback disponíveis."""
    CACHED_RESPONSE = "cached_response"
    MOCK_RESPONSE = "mock_response"
    DEGRADED_SERVICE = "degraded_service"
    QUEUE_FOR_RETRY = "queue_for_retry"
    ALTERNATIVE_PROVIDER = "alternative_provider"


@dataclass
class FallbackConfig:
    """Configuração de fallback para uma operação."""
    strategy: FallbackStrategy
    priority: int = 1  # Ordem de execução (menor = maior prioridade)
    timeout_seconds: float = 10.0
    max_retries: int = 3
    cache_ttl_seconds: int = 300  # 5 minutos
    enabled: bool = True


class CacheManager:
    """Gerenciador de cache para respostas."""
    
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        
    def get_cache_key(self, operation: str, params: Dict[str, Any]) -> str:
        """Gera chave de cache baseada na operação e parâmetros."""
        # Simplifica parâmetros para criar chave estável
        key_params = {k: v for k, v in params.items() if isinstance(v, (str, int, float, bool))}
        return f"{operation}:{hash(str(sorted(key_params.items())))}"
    
    def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Obtém item do cache se ainda válido."""
        if cache_key not in self.cache:
            return None
            
        item = self.cache[cache_key]
        if time.time() - item["timestamp"] > item["ttl"]:
            del self.cache[cache_key]
            return None
            
        logger.info(f"Cache hit para {cache_key}")
        return item["data"]
    
    def set(self, cache_key: str, data: Any, ttl_seconds: int = 300):
        """Armazena item no cache."""
        if len(self.cache) >= self.max_size:
            # Remove item mais antigo
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        
        self.cache[cache_key] = {
            "data": data,
            "timestamp": time.time(),
            "ttl": ttl_seconds
        }
        logger.info(f"Item cacheado: {cache_key}")
    
    def clear(self):
        """Limpa todo o cache."""
        self.cache.clear()
        logger.info("Cache limpo")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache."""
        now = time.time()
        valid_items = sum(1 for item in self.cache.values() 
                         if now - item["timestamp"] <= item["ttl"])
        
        return {
            "total_items": len(self.cache),
            "valid_items": valid_items,
            "expired_items": len(self.cache) - valid_items,
            "max_size": self.max_size,
            "usage_percent": round(len(self.cache) / self.max_size * 100, 2)
        }


class FallbackSystem:
    """Sistema principal de fallbacks."""
    
    def __init__(self):
        self.fallback_configs: Dict[str, List[FallbackConfig]] = {}
        self.cache_manager = CacheManager()
        self.fallback_stats: Dict[str, Dict[str, int]] = {}
        
    def register_fallback(self, operation: str, config: FallbackConfig):
        """Registra configuração de fallback para uma operação."""
        if operation not in self.fallback_configs:
            self.fallback_configs[operation] = []
            self.fallback_stats[operation] = {
                "total_calls": 0,
                "primary_success": 0,
                "fallback_used": 0,
                "cache_hits": 0,
                "total_failures": 0
            }
        
        self.fallback_configs[operation].append(config)
        # Ordena por prioridade
        self.fallback_configs[operation].sort(key=lambda x: x.priority)
        
        logger.info(f"Fallback registrado para '{operation}': {config.strategy.value}")
    
    async def execute_with_fallback(
        self, 
        operation: str,
        primary_func: Callable,
        params: Dict[str, Any] = None,
        *args,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executa operação com fallbacks automáticos.
        
        Returns:
            Dict com 'result', 'fallback_used', 'strategy' e 'execution_time'
        """
        params = params or {}
        start_time = time.time()
        
        # Incrementa estatísticas
        if operation in self.fallback_stats:
            self.fallback_stats[operation]["total_calls"] += 1
        
        # Tenta execução primária primeiro
        try:
            result = await self._execute_primary(primary_func, *args, **kwargs)
            
            # Sucesso - atualiza cache e estatísticas
            cache_key = self.cache_manager.get_cache_key(operation, params)
            self.cache_manager.set(cache_key, result)
            
            if operation in self.fallback_stats:
                self.fallback_stats[operation]["primary_success"] += 1
            
            return {
                "result": result,
                "fallback_used": False,
                "strategy": "primary",
                "execution_time": time.time() - start_time
            }
            
        except Exception as primary_error:
            logger.warning(f"Operação primária '{operation}' falhou: {primary_error}")
            
            # Executa fallbacks em ordem de prioridade
            if operation in self.fallback_configs:
                for config in self.fallback_configs[operation]:
                    if not config.enabled:
                        continue
                    
                    try:
                        result = await self._execute_fallback(
                            operation, config, params, primary_error, *args, **kwargs
                        )
                        
                        if operation in self.fallback_stats:
                            self.fallback_stats[operation]["fallback_used"] += 1
                        
                        return {
                            "result": result,
                            "fallback_used": True,
                            "strategy": config.strategy.value,
                            "execution_time": time.time() - start_time,
                            "primary_error": str(primary_error)
                        }
                        
                    except Exception as fallback_error:
                        logger.warning(
                            f"Fallback '{config.strategy.value}' para '{operation}' falhou: {fallback_error}"
                        )
                        continue
            
            # Todos os fallbacks falharam
            if operation in self.fallback_stats:
                self.fallback_stats[operation]["total_failures"] += 1
                
            raise Exception(f"Operação '{operation}' falhou e nenhum fallback funcionou. Erro original: {primary_error}")
    
    async def _execute_primary(self, func: Callable, *args, **kwargs) -> Any:
        """Executa função primária."""
        if asyncio.iscoroutinefunction(func):
            return await func(*args, **kwargs)
        else:
            return func(*args, **kwargs)
    
    async def _execute_fallback(
        self, 
        operation: str, 
        config: FallbackConfig, 
        params: Dict[str, Any],
        primary_error: Exception,
        *args, 
        **kwargs
    ) -> Any:
        """Executa estratégia de fallback específica."""
        
        if config.strategy == FallbackStrategy.CACHED_RESPONSE:
            return await self._fallback_cached_response(operation, params)
            
        elif config.strategy == FallbackStrategy.MOCK_RESPONSE:
            return await self._fallback_mock_response(operation, params)
            
        elif config.strategy == FallbackStrategy.DEGRADED_SERVICE:
            return await self._fallback_degraded_service(operation, params)
            
        elif config.strategy == FallbackStrategy.QUEUE_FOR_RETRY:
            return await self._fallback_queue_retry(operation, params, primary_error)
            
        elif config.strategy == FallbackStrategy.ALTERNATIVE_PROVIDER:
            return await self._fallback_alternative_provider(operation, params)
        
        else:
            raise ValueError(f"Estratégia de fallback não implementada: {config.strategy}")
    
    async def _fallback_cached_response(self, operation: str, params: Dict[str, Any]) -> Any:
        """Fallback usando resposta cacheada."""
        cache_key = self.cache_manager.get_cache_key(operation, params)
        cached_result = self.cache_manager.get(cache_key)
        
        if cached_result is None:
            raise Exception("Nenhuma resposta cacheada disponível")
        
        if operation in self.fallback_stats:
            self.fallback_stats[operation]["cache_hits"] += 1
            
        return cached_result
    
    async def _fallback_mock_response(self, operation: str, params: Dict[str, Any]) -> Any:
        """Fallback com resposta mock baseada na operação."""
        mock_responses = {
            "chat": {
                "type": "content",
                "content": "Desculpe, estou temporariamente indisponível. Tente novamente em alguns minutos.",
                "session_id": params.get("session_id", "mock_session"),
                "mock": True
            },
            "create_session": {
                "session_id": f"mock_session_{int(time.time())}",
                "mock": True
            },
            "session_info": {
                "session_id": params.get("session_id", "mock_session"),
                "active": False,
                "config": {"mock": True},
                "history": {"message_count": 0, "mock": True},
                "mock": True
            }
        }
        
        return mock_responses.get(operation, {
            "mock": True,
            "message": f"Serviço temporariamente indisponível para operação: {operation}",
            "timestamp": datetime.now().isoformat()
        })
    
    async def _fallback_degraded_service(self, operation: str, params: Dict[str, Any]) -> Any:
        """Fallback com serviço degradado (funcionalidade limitada)."""
        if operation == "chat":
            return {
                "type": "content", 
                "content": "⚠️ Modo degradado ativo. Funcionalidades limitadas. Resposta automática gerada.",
                "session_id": params.get("session_id", "degraded_session"),
                "degraded": True
            }
        
        return {
            "degraded": True,
            "message": f"Operação '{operation}' executada em modo degradado",
            "timestamp": datetime.now().isoformat(),
            "limited_functionality": True
        }
    
    async def _fallback_queue_retry(self, operation: str, params: Dict[str, Any], error: Exception) -> Any:
        """Fallback enfileirando para retry posterior."""
        # Em implementação real, seria enfileirado em sistema de filas (Redis, RabbitMQ, etc.)
        return {
            "queued": True,
            "operation": operation,
            "retry_in": "60 seconds",
            "message": "Operação enfileirada para retry automático",
            "original_error": str(error),
            "timestamp": datetime.now().isoformat()
        }
    
    async def _fallback_alternative_provider(self, operation: str, params: Dict[str, Any]) -> Any:
        """Fallback usando provedor alternativo."""
        # Placeholder para integração com provedores alternativos
        return {
            "alternative_provider": True,
            "provider": "backup_service",
            "message": f"Operação '{operation}' executada por provedor alternativo",
            "timestamp": datetime.now().isoformat()
        }
    
    def get_fallback_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas dos fallbacks."""
        return {
            "operations": self.fallback_stats.copy(),
            "cache_stats": self.cache_manager.get_stats(),
            "registered_operations": list(self.fallback_configs.keys()),
            "timestamp": datetime.now().isoformat()
        }
    
    def reset_stats(self):
        """Reseta todas as estatísticas."""
        for operation in self.fallback_stats:
            self.fallback_stats[operation] = {
                "total_calls": 0,
                "primary_success": 0,
                "fallback_used": 0,
                "cache_hits": 0,
                "total_failures": 0
            }
        logger.info("Estatísticas de fallback resetadas")


# Instância global do sistema de fallbacks
fallback_system = FallbackSystem()


def with_fallback(operation: str, configs: List[FallbackConfig] = None):
    """Decorator para adicionar fallbacks automáticos a funções."""
    def decorator(func):
        # Registra configurações padrão se não fornecidas
        if configs:
            for config in configs:
                fallback_system.register_fallback(operation, config)
        else:
            # Configuração padrão
            default_configs = [
                FallbackConfig(FallbackStrategy.CACHED_RESPONSE, priority=1),
                FallbackConfig(FallbackStrategy.MOCK_RESPONSE, priority=2)
            ]
            for config in default_configs:
                fallback_system.register_fallback(operation, config)
        
        async def wrapper(*args, **kwargs):
            return await fallback_system.execute_with_fallback(
                operation, func, {}, *args, **kwargs
            )
        return wrapper
    return decorator