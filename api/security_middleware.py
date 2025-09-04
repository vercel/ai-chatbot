"""Middleware de segurança robusto para validação e proteção da API."""

import re
import time
import uuid
import asyncio
from typing import Dict, Optional, Set, List, Any
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import json
from urllib.parse import urlparse

from rate_limiter import RateLimitManager
from security_models import SecurityHeaders, RateLimitInfo

logger = logging.getLogger(__name__)


class SecurityValidationError(Exception):
    """Exceção personalizada para erros de validação de segurança."""
    
    def __init__(self, message: str, code: str = "SECURITY_VALIDATION_ERROR", status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware principal de segurança."""
    
    def __init__(self, app, redis_url: Optional[str] = None):
        super().__init__(app)
        self.rate_limiter = RateLimitManager(redis_url)
        self.security_config = self._load_security_config()
        self.suspicious_ips: Set[str] = set()
        self.blocked_ips: Dict[str, datetime] = {}
        self.request_stats: Dict[str, Dict[str, int]] = {}
        
        # Headers de segurança padrão
        self.security_headers = SecurityHeaders.get_security_headers()
        
        # Padrões de detecção de ataques
        self.attack_patterns = self._load_attack_patterns()
        
        # Inicializa rate limiter
        asyncio.create_task(self._initialize())
    
    async def _initialize(self):
        """Inicialização assíncrona do middleware."""
        try:
            await self.rate_limiter.initialize()
            logger.info("✅ Security middleware inicializado")
        except Exception as e:
            logger.error(f"❌ Erro na inicialização do security middleware: {e}")
    
    def _load_security_config(self) -> Dict[str, Any]:
        """Carrega configurações de segurança."""
        return {
            "max_request_size": 50 * 1024 * 1024,  # 50MB
            "max_headers": 50,
            "max_header_size": 8192,  # 8KB por header
            "allowed_methods": {"GET", "POST", "PUT", "DELETE", "OPTIONS"},
            "blocked_user_agents": {
                "sqlmap", "nmap", "nikto", "burp", "w3af", 
                "acunetix", "nessus", "openvas", "zap"
            },
            "suspicious_patterns": {
                "sql_injection": [
                    r"(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)",
                    r"(\bor\b\s+\d+\s*=\s*\d+)|(\band\b\s+\d+\s*=\s*\d+)",
                    r"(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s+TABLE",
                    r"(\bexec\b|\bexecute\b)\s*\(",
                ],
                "xss": [
                    r"<script[^>]*>.*?</script>",
                    r"javascript\s*:",
                    r"on\w+\s*=",
                    r"<iframe[^>]*>",
                    r"<object[^>]*>",
                    r"<embed[^>]*>",
                ],
                "path_traversal": [
                    r"\.\./",
                    r"\.\.\\",
                    r"/etc/passwd",
                    r"/proc/",
                    r"\\windows\\system32",
                ],
                "command_injection": [
                    # Removido padrão muito agressivo que bloqueava caracteres comuns
                    # Agora detecta apenas comandos realmente perigosos em contexto
                    r"(;|\||&&)\s*(rm|del|format|shutdown|reboot|kill)\s+",
                    r"\b(nc|netcat)\s+-e\s+/bin/(bash|sh)",  # Reverse shell
                    r">\s*/dev/(null|tcp/)",  # Redirecionamento perigoso
                ]
            },
            "rate_limits": {
                "suspicious_threshold": 10,  # requests per minute
                "block_duration": 3600,  # 1 hora
                "max_concurrent_requests": 10,
            }
        }
    
    def _load_attack_patterns(self) -> Dict[str, List[re.Pattern]]:
        """Compila padrões regex para detecção de ataques."""
        compiled_patterns = {}
        
        for category, patterns in self.security_config["suspicious_patterns"].items():
            compiled_patterns[category] = [
                re.compile(pattern, re.IGNORECASE | re.DOTALL)
                for pattern in patterns
            ]
        
        return compiled_patterns
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Processa request através do pipeline de segurança."""
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        
        try:
            # 1. Verificações básicas de segurança
            await self._basic_security_checks(request, client_ip)
            
            # 2. Rate limiting
            await self._check_rate_limits(request, client_ip)
            
            # 3. Validação de conteúdo
            await self._validate_request_content(request)
            
            # 4. Detecção de ataques
            await self._detect_attacks(request)
            
            # 5. Processa request
            response = await call_next(request)
            
            # 6. Adiciona headers de segurança
            self._add_security_headers(response)
            
            # 7. Log da request
            await self._log_request(request, response, time.time() - start_time)
            
            return response
            
        except SecurityValidationError as e:
            logger.warning(f"🔒 Blocked request from {client_ip}: {e.message}")
            await self._handle_security_violation(client_ip, str(e))
            
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "Security validation failed",
                    "message": e.message,
                    "code": e.code,
                    "timestamp": datetime.now().isoformat(),
                    "request_id": str(uuid.uuid4())
                },
                headers=self.security_headers
            )
            
        except HTTPException as e:
            # Pass through HTTP exceptions
            response = JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail},
                headers=self.security_headers
            )
            return response
            
        except Exception as e:
            logger.error(f"❌ Erro no security middleware: {e}")
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal security error",
                    "message": "Request could not be processed securely"
                },
                headers=self.security_headers
            )
    
    async def _basic_security_checks(self, request: Request, client_ip: str):
        """Verificações básicas de segurança."""
        # Verifica se IP está bloqueado
        if client_ip in self.blocked_ips:
            block_expires = self.blocked_ips[client_ip]
            if datetime.now() < block_expires:
                raise SecurityValidationError(
                    f"IP {client_ip} blocked until {block_expires.isoformat()}",
                    "IP_BLOCKED",
                    status.HTTP_429_TOO_MANY_REQUESTS
                )
            else:
                # Remove bloqueio expirado
                del self.blocked_ips[client_ip]
        
        # Valida método HTTP
        if request.method not in self.security_config["allowed_methods"]:
            raise SecurityValidationError(
                f"HTTP method {request.method} not allowed",
                "METHOD_NOT_ALLOWED",
                status.HTTP_405_METHOD_NOT_ALLOWED
            )
        
        # Valida User-Agent
        user_agent = request.headers.get("user-agent", "").lower()
        for blocked_ua in self.security_config["blocked_user_agents"]:
            if blocked_ua in user_agent:
                raise SecurityValidationError(
                    f"Blocked user agent: {blocked_ua}",
                    "BLOCKED_USER_AGENT",
                    status.HTTP_403_FORBIDDEN
                )
        
        # Valida número de headers
        if len(request.headers) > self.security_config["max_headers"]:
            raise SecurityValidationError(
                f"Too many headers: {len(request.headers)}",
                "TOO_MANY_HEADERS",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Valida tamanho dos headers
        for name, value in request.headers.items():
            if len(value) > self.security_config["max_header_size"]:
                raise SecurityValidationError(
                    f"Header too large: {name}",
                    "HEADER_TOO_LARGE",
                    status.HTTP_400_BAD_REQUEST
                )
    
    async def _check_rate_limits(self, request: Request, client_ip: str):
        """Verifica rate limiting."""
        endpoint = str(request.url.path)
        
        # Verifica rate limit
        result = await self.rate_limiter.check_rate_limit(client_ip, endpoint)
        
        if not result.allowed:
            # Adiciona headers de rate limit
            headers = {
                **self.security_headers,
                "X-RateLimit-Limit": str(result.limit_per_minute),
                "X-RateLimit-Remaining": str(result.requests_remaining),
                "X-RateLimit-Reset": result.reset_time.isoformat(),
            }
            
            if result.retry_after_seconds:
                headers["Retry-After"] = str(result.retry_after_seconds)
            
            raise SecurityValidationError(
                f"Rate limit exceeded. Try again in {result.retry_after_seconds}s",
                "RATE_LIMIT_EXCEEDED",
                status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Adiciona headers informativos
        request.state.rate_limit_info = RateLimitInfo(
            requests_remaining=result.requests_remaining,
            reset_time=result.reset_time,
            limit_per_minute=result.limit_per_minute,
            window_start=result.window_start
        )
    
    async def _validate_request_content(self, request: Request):
        """Valida conteúdo da request."""
        # Verifica tamanho da request
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.security_config["max_request_size"]:
                    raise SecurityValidationError(
                        f"Request too large: {size} bytes",
                        "REQUEST_TOO_LARGE",
                        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )
            except ValueError:
                raise SecurityValidationError(
                    "Invalid Content-Length header",
                    "INVALID_CONTENT_LENGTH",
                    status.HTTP_400_BAD_REQUEST
                )
        
        # Valida Content-Type para requests POST/PUT
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("content-type", "")
            
            if not content_type:
                raise SecurityValidationError(
                    "Missing Content-Type header",
                    "MISSING_CONTENT_TYPE",
                    status.HTTP_400_BAD_REQUEST
                )
            
            # Lista de Content-Types permitidos
            allowed_types = {
                "application/json",
                "application/x-www-form-urlencoded",
                "multipart/form-data",
                "text/plain"
            }
            
            if not any(ct in content_type.lower() for ct in allowed_types):
                raise SecurityValidationError(
                    f"Invalid Content-Type: {content_type}",
                    "INVALID_CONTENT_TYPE",
                    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
                )
    
    async def _detect_attacks(self, request: Request):
        """Detecta padrões de ataques comuns."""
        # Pula verificação para endpoint /api/chat - mensagens de chat normais
        if request.url.path == "/api/chat":
            return  # Não aplica detecção de ataques em mensagens de chat
        
        # Coleta dados da request para análise
        request_data = {
            "url": str(request.url),
            "query_params": str(request.query_params),
            "headers": dict(request.headers),
            "path": request.url.path,
        }
        
        # Tenta ler body se existir
        if request.method in {"POST", "PUT", "PATCH"}:
            try:
                # Note: Isso pode ser problemático se o body for muito grande
                # Em produção, considere streaming ou limites
                body = await request.body()
                if body:
                    try:
                        request_data["body"] = body.decode('utf-8')
                    except UnicodeDecodeError:
                        request_data["body"] = "<binary_data>"
            except Exception:
                request_data["body"] = "<could_not_read>"
        
        # Verifica cada categoria de ataque
        for category, patterns in self.attack_patterns.items():
            for field_name, field_value in request_data.items():
                if isinstance(field_value, str):
                    for pattern in patterns:
                        if pattern.search(field_value):
                            logger.warning(
                                f"🚨 {category.upper()} attack detected from "
                                f"{self._get_client_ip(request)} in {field_name}"
                            )
                            raise SecurityValidationError(
                                f"Suspicious {category} pattern detected",
                                f"ATTACK_{category.upper()}",
                                status.HTTP_400_BAD_REQUEST
                            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtém IP real do cliente considerando proxies."""
        # Prioridade de headers para detectar IP real
        ip_headers = [
            "x-forwarded-for",
            "x-real-ip",
            "cf-connecting-ip",  # Cloudflare
            "x-forwarded",
            "forwarded-for",
            "forwarded",
        ]
        
        for header in ip_headers:
            if header in request.headers:
                ip = request.headers[header].split(",")[0].strip()
                if self._is_valid_ip(ip):
                    return ip
        
        # Fallback para IP da conexão
        return request.client.host if request.client else "unknown"
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Valida formato de IP."""
        import ipaddress
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    def _add_security_headers(self, response: Response):
        """Adiciona headers de segurança à resposta."""
        for header, value in self.security_headers.items():
            response.headers[header] = value
        
        # Headers dinâmicos
        response.headers["X-Request-ID"] = str(uuid.uuid4())
        response.headers["X-Timestamp"] = datetime.now().isoformat()
    
    async def _handle_security_violation(self, client_ip: str, violation: str):
        """Processa violação de segurança."""
        # Adiciona IP à lista de suspeitos
        self.suspicious_ips.add(client_ip)
        
        # Atualiza estatísticas
        if client_ip not in self.request_stats:
            self.request_stats[client_ip] = {"violations": 0, "last_violation": datetime.now()}
        
        self.request_stats[client_ip]["violations"] += 1
        self.request_stats[client_ip]["last_violation"] = datetime.now()
        
        # Bloqueia IP se muitas violações
        if self.request_stats[client_ip]["violations"] >= 5:
            block_duration = timedelta(seconds=self.security_config["rate_limits"]["block_duration"])
            self.blocked_ips[client_ip] = datetime.now() + block_duration
            
            logger.warning(f"🔒 IP {client_ip} blocked for {block_duration} due to repeated violations")
    
    async def _log_request(self, request: Request, response: Response, duration: float):
        """Log estruturado da request."""
        client_ip = self._get_client_ip(request)
        
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "client_ip": client_ip,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "user_agent": request.headers.get("user-agent", ""),
            "referer": request.headers.get("referer", ""),
        }
        
        # Log com nível baseado no status
        if response.status_code >= 500:
            logger.error(f"Request error: {json.dumps(log_data)}")
        elif response.status_code >= 400:
            logger.warning(f"Request warning: {json.dumps(log_data)}")
        else:
            logger.info(f"Request ok: {json.dumps(log_data)}")


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """Middleware específico para configuração segura de CORS."""
    
    def __init__(self, app):
        super().__init__(app)
        self.allowed_origins = {
            "http://localhost:3082",
            "http://localhost:3000",
            "http://127.0.0.1:3082",
            "https://suthub.agentesintegrados.com",
            "http://suthub.agentesintegrados.com"
        }
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Processa CORS com validação de origem."""
        origin = request.headers.get("origin")
        
        # Valida origem para requests cross-origin
        if origin and origin not in self.allowed_origins:
            logger.warning(f"🚨 Blocked CORS request from unauthorized origin: {origin}")
            
            return JSONResponse(
                status_code=403,
                content={
                    "error": "CORS policy violation",
                    "message": f"Origin {origin} not allowed"
                }
            )
        
        response = await call_next(request)
        
        # Adiciona headers CORS seguros
        if origin and origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = (
                "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With"
            )
            response.headers["Access-Control-Max-Age"] = "86400"  # 24 horas
        
        return response