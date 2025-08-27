"""Bridge para validação de autenticação com Auth.js/Next-Auth."""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

try:
    from jose import jwt, JWTError
except ImportError:
    # Fallback simples para desenvolvimento
    jwt = None
    JWTError = Exception

logger = logging.getLogger(__name__)

class AuthBridge:
    """Valida tokens JWT do Auth.js."""
    
    def __init__(self):
        # Secret deve ser o mesmo usado no Auth.js (AUTH_SECRET)
        self.secret = os.getenv('AUTH_SECRET', 'development-secret-key')
        self.algorithm = 'HS256'
        
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decodifica e valida um token JWT."""
        # Em desenvolvimento sem JWT, usa mock
        if jwt is None:
            logger.warning("JWT library not available, using development mode")
            return {
                'sub': 'dev-user',
                'id': 'dev-user',
                'email': 'dev@test.com',
                'name': 'Dev User',
                'type': 'regular',
                'exp': (datetime.now() + timedelta(hours=24)).timestamp()
            }
            
        try:
            # Remove 'Bearer ' se presente
            if token.startswith('Bearer '):
                token = token[7:]
                
            # Decodifica o token
            payload = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm]
            )
            
            # Verifica expiração
            if 'exp' in payload:
                exp_timestamp = payload['exp']
                if datetime.fromtimestamp(exp_timestamp) < datetime.now():
                    logger.warning("Token expired")
                    return None
                    
            return payload
            
        except JWTError as e:
            logger.error(f"JWT decode error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error decoding token: {e}")
            return None
            
    def validate_session(self, token: str) -> Optional[Dict[str, Any]]:
        """Valida uma sessão do Auth.js."""
        payload = self.decode_token(token)
        
        if not payload:
            return None
            
        # Extrai informações do usuário
        user_info = {
            'id': payload.get('sub', payload.get('id')),
            'email': payload.get('email'),
            'name': payload.get('name'),
            'type': payload.get('type', 'regular')
        }
        
        # Verifica se tem as informações mínimas
        if not user_info['id']:
            logger.warning("Token missing user ID")
            return None
            
        return user_info
        
    def extract_user_id(self, token: str) -> Optional[str]:
        """Extrai apenas o ID do usuário do token."""
        user_info = self.validate_session(token)
        return user_info['id'] if user_info else None
        
    def create_test_token(self, user_id: str, email: str = None) -> str:
        """Cria um token de teste para desenvolvimento."""
        if jwt is None:
            return "dev-token-no-jwt-library"
            
        payload = {
            'sub': user_id,
            'id': user_id,
            'email': email or f'{user_id}@test.com',
            'name': f'Test User {user_id}',
            'type': 'regular',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
        
    def validate_request_auth(self, authorization_header: Optional[str]) -> Optional[Dict[str, Any]]:
        """Valida o header Authorization de uma requisição."""
        if not authorization_header:
            logger.warning("Missing Authorization header")
            return None
            
        return self.validate_session(authorization_header)