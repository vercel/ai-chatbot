"""Modelos Pydantic para validação de segurança robusta."""

import re
import uuid
import html
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator, root_validator
from datetime import datetime


class SecureChatMessage(BaseModel):
    """Modelo seguro para mensagens de chat com validação robusta."""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=50000,  # 50KB limit
        description="Conteúdo da mensagem sanitizada",
        example="Como posso criar uma função em Python?"
    )
    session_id: Optional[str] = Field(
        None,
        description="ID da sessão (UUID válido)",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    
    @validator('message')
    def sanitize_message(cls, v):
        """Sanitiza a mensagem para prevenir XSS/injection."""
        if not v or not v.strip():
            raise ValueError('Mensagem não pode estar vazia')
        
        # Remove apenas caracteres de controle perigosos (não imprimíveis)
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v)
        
        # Não escapa HTML - deixa o texto como está para chat normal
        # Apenas remove tags script diretas se existirem
        v = v.strip()
        
        # Remove apenas scripts realmente perigosos (tags script completas)
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'<iframe[^>]*>.*?</iframe>',
            r'javascript:alert\(',
            r'data:text/html;base64',
            r'vbscript:',
        ]
        
        for pattern in dangerous_patterns:
            v = re.sub(pattern, '', v, flags=re.IGNORECASE | re.DOTALL)
        
        # Limita tamanho final após sanitização
        if len(v.encode('utf-8')) > 50000:
            raise ValueError('Mensagem muito longa após sanitização (máximo 50KB)')
            
        return v
    
    @validator('session_id')
    def validate_session_id(cls, v):
        """Valida formato UUID do session_id."""
        if v is None:
            return v
            
        if not isinstance(v, str):
            raise ValueError('Session ID deve ser string')
        
        # Remove espaços e verifica se não está vazio após trim
        v = v.strip()
        if not v:
            return None
            
        # Valida formato UUID
        try:
            uuid_obj = uuid.UUID(v)
            # Garante que retorna string canônica
            return str(uuid_obj)
        except ValueError:
            raise ValueError('Session ID deve ser UUID válido')
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
        schema_extra = {
            "example": {
                "message": "Como posso otimizar este código Python?",
                "session_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class SecureSessionAction(BaseModel):
    """Modelo seguro para ações em sessões."""
    
    session_id: str = Field(
        ...,
        description="ID único da sessão (UUID válido)",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    
    @validator('session_id')
    def validate_session_id(cls, v):
        """Valida rigorosamente o session_id."""
        if not v or not isinstance(v, str):
            raise ValueError('Session ID é obrigatório e deve ser string')
        
        v = v.strip()
        if not v:
            raise ValueError('Session ID não pode estar vazio')
            
        try:
            uuid_obj = uuid.UUID(v)
            return str(uuid_obj)
        except ValueError:
            raise ValueError('Session ID deve ser UUID válido no formato correto')


class SecureSessionConfigRequest(BaseModel):
    """Configuração segura para sessões."""
    
    system_prompt: Optional[str] = Field(
        None,
        max_length=10000,
        description="System prompt sanitizado"
    )
    allowed_tools: Optional[List[str]] = Field(
        default_factory=list,
        description="Lista de ferramentas permitidas"
    )
    max_turns: Optional[int] = Field(
        None,
        ge=1,
        le=1000,
        description="Número máximo de turnos (1-1000)"
    )
    permission_mode: str = Field(
        'acceptEdits',
        description="Modo de permissão"
    )
    cwd: Optional[str] = Field(
        None,
        max_length=4096,
        description="Diretório de trabalho"
    )
    
    @validator('system_prompt')
    def sanitize_system_prompt(cls, v):
        """Sanitiza system prompt."""
        if v is None:
            return v
            
        # Remove caracteres de controle
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v)
        
        # Escapa HTML básico
        v = html.escape(v.strip())
        
        return v if v else None
    
    @validator('allowed_tools')
    def validate_allowed_tools(cls, v):
        """Valida lista de ferramentas permitidas."""
        if not v:
            return []
            
        # Lista whitelist de ferramentas conhecidas
        ALLOWED_TOOLS = {
            'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 
            'Grep', 'Glob', 'WebFetch', 'WebSearch',
            'Task', 'TodoWrite', 'NotebookEdit'
        }
        
        validated_tools = []
        for tool in v:
            if isinstance(tool, str) and tool.strip() in ALLOWED_TOOLS:
                validated_tools.append(tool.strip())
        
        return validated_tools
    
    @validator('permission_mode')
    def validate_permission_mode(cls, v):
        """Valida modo de permissão."""
        allowed_modes = {'acceptEdits', 'rejectEdits', 'askUser'}
        if v not in allowed_modes:
            raise ValueError(f'permission_mode deve ser um de: {allowed_modes}')
        return v
    
    @validator('cwd')
    def validate_cwd(cls, v):
        """Valida diretório de trabalho."""
        if v is None:
            return v
            
        v = v.strip()
        if not v:
            return None
            
        # Remove caracteres potencialmente perigosos
        dangerous_chars = ['../', '\\', '|', '&', ';', '`', '$', '(', ')']
        for char in dangerous_chars:
            if char in v:
                raise ValueError(f'Caractere perigoso detectado no cwd: {char}')
        
        # Verifica caminhos sensíveis do sistema
        sensitive_paths = ['/etc/', '/proc/', '/sys/', '/root/', '/boot/', '/dev/']
        for sensitive in sensitive_paths:
            if v.startswith(sensitive):
                raise ValueError(f'Acesso negado ao diretório sensível: {sensitive}')
        
        # Valida que é um caminho absoluto válido
        if not v.startswith('/'):
            raise ValueError('cwd deve ser um caminho absoluto')
            
        return v


class RateLimitInfo(BaseModel):
    """Informações de rate limiting."""
    
    requests_remaining: int = Field(..., description="Requisições restantes")
    reset_time: datetime = Field(..., description="Quando o limite reseta")
    limit_per_minute: int = Field(..., description="Limite por minuto")
    window_start: datetime = Field(..., description="Início da janela atual")


class SecurityValidationError(BaseModel):
    """Erro de validação de segurança."""
    
    type: str = Field(..., description="Tipo do erro de validação")
    field: str = Field(..., description="Campo que falhou na validação")
    message: str = Field(..., description="Mensagem detalhada do erro")
    code: str = Field(..., description="Código de erro para o frontend")


class SecurityHeaders(BaseModel):
    """Headers de segurança para aplicar nas respostas."""
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Retorna headers de segurança padrão."""
        return {
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob: https:; "
                "connect-src 'self' ws: wss:; "
                "font-src 'self' data:; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
            
            # Prevent XSS
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # HSTS para HTTPS
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Feature policy
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "accelerometer=(), "
                "gyroscope=()"
            ),
            
            # API específicos
            "X-API-Version": "1.0.0",
            "X-Rate-Limit-Policy": "60/minute",
        }