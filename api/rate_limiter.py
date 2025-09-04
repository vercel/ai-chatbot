"""Sistema de rate limiting robusto com suporte a Redis e fallback in-memory."""

import time
import asyncio
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import redis.asyncio as redis
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


@dataclass
class RateLimitRule:
    """Configuração de uma regra de rate limiting."""
    requests_per_minute: int = 60
    burst_limit: int = 10  # Rajadas permitidas
    window_size_seconds: int = 60
    block_duration_seconds: int = 300  # 5 minutos de bloqueio


@dataclass
class RateLimitResult:
    """Resultado de uma verificação de rate limiting."""
    allowed: bool
    requests_remaining: int
    reset_time: datetime
    retry_after_seconds: Optional[int] = None
    limit_per_minute: int = 60
    current_usage: int = 0
    window_start: datetime = field(default_factory=datetime.now)


class InMemoryRateLimiter:
    """Rate limiter em memória como fallback."""
    
    def __init__(self, rule: RateLimitRule):
        self.rule = rule
        self.clients: Dict[str, deque] = defaultdict(deque)
        self.blocked_clients: Dict[str, datetime] = {}
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(self, client_id: str) -> RateLimitResult:
        """Verifica rate limit para um cliente."""
        async with self.lock:
            now = datetime.now()
            
            # Verifica se cliente está bloqueado
            if client_id in self.blocked_clients:
                blocked_until = self.blocked_clients[client_id]
                if now < blocked_until:
                    retry_after = int((blocked_until - now).total_seconds())
                    return RateLimitResult(
                        allowed=False,
                        requests_remaining=0,
                        reset_time=blocked_until,
                        retry_after_seconds=retry_after,
                        current_usage=self.rule.requests_per_minute
                    )
                else:
                    # Desbloqueio automático
                    del self.blocked_clients[client_id]
            
            # Limpa requests antigos da janela
            window_start = now - timedelta(seconds=self.rule.window_size_seconds)
            client_requests = self.clients[client_id]
            
            while client_requests and client_requests[0] < window_start:
                client_requests.popleft()
            
            current_count = len(client_requests)
            
            # Verifica se excedeu limite
            if current_count >= self.rule.requests_per_minute:
                # Bloqueia cliente temporariamente
                self.blocked_clients[client_id] = now + timedelta(
                    seconds=self.rule.block_duration_seconds
                )
                
                return RateLimitResult(
                    allowed=False,
                    requests_remaining=0,
                    reset_time=self.blocked_clients[client_id],
                    retry_after_seconds=self.rule.block_duration_seconds,
                    current_usage=current_count
                )
            
            # Adiciona request atual
            client_requests.append(now)
            
            # Calcula quando janela reseta
            next_reset = window_start + timedelta(seconds=self.rule.window_size_seconds)
            if client_requests:
                oldest_request = client_requests[0]
                next_reset = oldest_request + timedelta(seconds=self.rule.window_size_seconds)
            
            return RateLimitResult(
                allowed=True,
                requests_remaining=self.rule.requests_per_minute - current_count - 1,
                reset_time=next_reset,
                current_usage=current_count + 1,
                window_start=window_start
            )
    
    async def cleanup_old_data(self):
        """Limpa dados antigos periodicamente."""
        now = datetime.now()
        
        async with self.lock:
            # Remove clientes desbloqueados
            expired_blocks = [
                client_id for client_id, blocked_until in self.blocked_clients.items()
                if now >= blocked_until
            ]
            for client_id in expired_blocks:
                del self.blocked_clients[client_id]
            
            # Limpa requests muito antigos
            cutoff = now - timedelta(seconds=self.rule.window_size_seconds * 2)
            for client_id, requests in list(self.clients.items()):
                while requests and requests[0] < cutoff:
                    requests.popleft()
                
                # Remove clientes sem requests recentes
                if not requests:
                    del self.clients[client_id]


class RedisRateLimiter:
    """Rate limiter usando Redis para ambiente distribuído."""
    
    def __init__(self, rule: RateLimitRule, redis_url: str = "redis://localhost:6379"):
        self.rule = rule
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.prefix = "rate_limit:"
    
    async def connect(self):
        """Conecta ao Redis."""
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            logger.info("✅ Conectado ao Redis para rate limiting")
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao Redis: {e}")
            raise
    
    async def check_rate_limit(self, client_id: str) -> RateLimitResult:
        """Verifica rate limit usando Redis."""
        if not self.redis_client:
            raise RuntimeError("Redis não conectado")
        
        now = datetime.now()
        window_start = now - timedelta(seconds=self.rule.window_size_seconds)
        
        # Chave para controle de rate limit
        key = f"{self.prefix}{client_id}"
        block_key = f"{self.prefix}blocked:{client_id}"
        
        # Verifica se cliente está bloqueado
        blocked_until_str = await self.redis_client.get(block_key)
        if blocked_until_str:
            blocked_until = datetime.fromisoformat(blocked_until_str.decode())
            if now < blocked_until:
                retry_after = int((blocked_until - now).total_seconds())
                return RateLimitResult(
                    allowed=False,
                    requests_remaining=0,
                    reset_time=blocked_until,
                    retry_after_seconds=retry_after,
                    current_usage=self.rule.requests_per_minute
                )
            else:
                # Remove bloqueio expirado
                await self.redis_client.delete(block_key)
        
        # Pipeline para operações atômicas
        async with self.redis_client.pipeline() as pipe:
            # Remove requests antigos da janela
            pipe.zremrangebyscore(key, 0, window_start.timestamp())
            
            # Conta requests na janela atual
            pipe.zcard(key)
            
            # Executa pipeline
            results = await pipe.execute()
            current_count = results[1]
        
        # Verifica limite
        if current_count >= self.rule.requests_per_minute:
            # Bloqueia cliente
            blocked_until = now + timedelta(seconds=self.rule.block_duration_seconds)
            await self.redis_client.setex(
                block_key, 
                self.rule.block_duration_seconds,
                blocked_until.isoformat()
            )
            
            return RateLimitResult(
                allowed=False,
                requests_remaining=0,
                reset_time=blocked_until,
                retry_after_seconds=self.rule.block_duration_seconds,
                current_usage=current_count
            )
        
        # Adiciona request atual
        await self.redis_client.zadd(key, {str(now.timestamp()): now.timestamp()})
        await self.redis_client.expire(key, self.rule.window_size_seconds * 2)
        
        # Calcula próximo reset
        oldest_score = await self.redis_client.zrange(key, 0, 0, withscores=True)
        if oldest_score:
            oldest_timestamp = oldest_score[0][1]
            next_reset = datetime.fromtimestamp(oldest_timestamp) + timedelta(
                seconds=self.rule.window_size_seconds
            )
        else:
            next_reset = now + timedelta(seconds=self.rule.window_size_seconds)
        
        return RateLimitResult(
            allowed=True,
            requests_remaining=self.rule.requests_per_minute - current_count - 1,
            reset_time=next_reset,
            current_usage=current_count + 1,
            window_start=window_start
        )


class RateLimitManager:
    """Gerenciador principal de rate limiting com fallback automático."""
    
    def __init__(self, redis_url: Optional[str] = None):
        # Regras por endpoint
        self.rules = {
            "chat": RateLimitRule(requests_per_minute=30, burst_limit=5, block_duration_seconds=300),
            "session": RateLimitRule(requests_per_minute=60, burst_limit=10, block_duration_seconds=180),
            "api": RateLimitRule(requests_per_minute=100, burst_limit=20, block_duration_seconds=120),
            "analytics": RateLimitRule(requests_per_minute=20, burst_limit=5, block_duration_seconds=600)
        }
        
        self.redis_url = redis_url
        self.redis_limiter: Optional[RedisRateLimiter] = None
        self.memory_limiters: Dict[str, InMemoryRateLimiter] = {}
        self.use_redis = False
        
        # Cria limiters em memória como fallback
        for endpoint, rule in self.rules.items():
            self.memory_limiters[endpoint] = InMemoryRateLimiter(rule)
    
    async def initialize(self):
        """Inicializa o gerenciador de rate limiting."""
        if self.redis_url:
            try:
                # Tenta conectar ao Redis
                self.redis_limiter = RedisRateLimiter(
                    self.rules["api"],  # Regra padrão
                    self.redis_url
                )
                await self.redis_limiter.connect()
                self.use_redis = True
                logger.info("✅ Rate limiting usando Redis")
            except Exception as e:
                logger.warning(f"⚠️ Fallback para rate limiting em memória: {e}")
                self.use_redis = False
        else:
            logger.info("📝 Rate limiting em memória (sem Redis configurado)")
        
        # Inicia task de limpeza
        asyncio.create_task(self._cleanup_task())
    
    async def check_rate_limit(self, client_ip: str, endpoint: str = "api") -> RateLimitResult:
        """Verifica rate limit para um cliente e endpoint."""
        # Determina regra baseada no endpoint
        rule_key = self._get_rule_key(endpoint)
        
        # Gera ID único do cliente
        client_id = self._generate_client_id(client_ip, endpoint)
        
        if self.use_redis and self.redis_limiter:
            try:
                # Atualiza regra do Redis limiter
                self.redis_limiter.rule = self.rules[rule_key]
                return await self.redis_limiter.check_rate_limit(client_id)
            except Exception as e:
                logger.error(f"❌ Erro no Redis rate limiting: {e}")
                # Fallback para memória
                self.use_redis = False
        
        # Usa limiter em memória
        memory_limiter = self.memory_limiters[rule_key]
        return await memory_limiter.check_rate_limit(client_id)
    
    def _get_rule_key(self, endpoint: str) -> str:
        """Determina a regra a usar baseada no endpoint."""
        if "/api/chat" in endpoint:
            return "chat"
        elif "/api/session" in endpoint or "/api/new-session" in endpoint:
            return "session"
        elif "/api/analytics" in endpoint:
            return "analytics"
        else:
            return "api"
    
    def _generate_client_id(self, client_ip: str, endpoint: str) -> str:
        """Gera ID único para cliente e endpoint."""
        # Hash para privacidade
        data = f"{client_ip}:{endpoint}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    async def _cleanup_task(self):
        """Task periódica de limpeza."""
        while True:
            try:
                await asyncio.sleep(300)  # 5 minutos
                
                # Limpa dados em memória
                for limiter in self.memory_limiters.values():
                    await limiter.cleanup_old_data()
                
                logger.debug("🧹 Limpeza de rate limiting concluída")
                
            except Exception as e:
                logger.error(f"❌ Erro na limpeza de rate limiting: {e}")
    
    async def get_client_status(self, client_ip: str, endpoint: str = "api") -> Dict:
        """Obtém status atual de rate limiting para um cliente."""
        result = await self.check_rate_limit(client_ip, endpoint)
        
        return {
            "allowed": result.allowed,
            "requests_remaining": result.requests_remaining,
            "current_usage": result.current_usage,
            "limit_per_minute": result.limit_per_minute,
            "reset_time": result.reset_time.isoformat(),
            "retry_after_seconds": result.retry_after_seconds,
            "backend": "redis" if self.use_redis else "memory"
        }