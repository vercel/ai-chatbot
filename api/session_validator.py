"""Validador de sessões robusto com múltiplas verificações de segurança."""

import os
import glob
import re
from typing import List, Optional, Set, Dict, Any
import uuid
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class SessionValidator:
    """Valida e verifica a existência de sessões reais no sistema."""
    
    def __init__(self):
        self.project_path = '/home/suthub/.claude/projects/-home-suthub--claude-api-claude-code-app-cc-sdk-chat'
        
    def get_real_session_ids(self) -> Set[str]:
        """Retorna conjunto de IDs de sessão que realmente existem no sistema."""
        session_ids = set()
        
        # Verifica arquivos .jsonl no projeto
        if os.path.exists(self.project_path):
            pattern = os.path.join(self.project_path, '*.jsonl')
            jsonl_files = glob.glob(pattern)
            
            for file_path in jsonl_files:
                filename = os.path.basename(file_path)
                if filename.endswith('.jsonl'):
                    session_id = filename.replace('.jsonl', '')
                    # Valida se é um UUID válido
                    if self.is_valid_uuid(session_id):
                        session_ids.add(session_id)
        
        return session_ids
    
    def is_valid_uuid(self, uuid_string: str) -> bool:
        """Verifica se a string é um UUID válido com validação rigorosa."""
        if not uuid_string or not isinstance(uuid_string, str):
            return False
            
        # Remove espaços em branco
        uuid_string = uuid_string.strip()
        
        # Verifica comprimento básico (UUID tem 36 caracteres com hífens)
        if len(uuid_string) != 36:
            return False
        
        # Verifica formato UUID com regex mais rigoroso
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        
        if not uuid_pattern.match(uuid_string):
            return False
            
        try:
            # Validação final com biblioteca UUID
            uuid_obj = uuid.UUID(uuid_string)
            
            # Verifica se não é UUID nulo
            if str(uuid_obj) == '00000000-0000-0000-0000-000000000000':
                return False
                
            # Verifica versão do UUID (aceita versões 1, 3, 4, 5)
            if uuid_obj.version not in [1, 3, 4, 5]:
                return False
                
            return True
            
        except (ValueError, TypeError):
            return False
    
    def validate_session_id_format(self, session_id: str) -> Dict[str, Any]:
        """Validação detalhada do formato do session_id."""
        result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'normalized': None,
            'uuid_version': None,
            'uuid_variant': None
        }
        
        if not session_id:
            result['errors'].append('Session ID não pode estar vazio')
            return result
        
        if not isinstance(session_id, str):
            result['errors'].append('Session ID deve ser uma string')
            return result
        
        # Normaliza entrada
        normalized = session_id.strip().lower()
        result['normalized'] = normalized
        
        # Verifica caracteres permitidos
        if not re.match(r'^[0-9a-f-]+$', normalized):
            result['errors'].append('Session ID contém caracteres inválidos')
            return result
        
        # Verifica estrutura básica
        parts = normalized.split('-')
        if len(parts) != 5:
            result['errors'].append('Session ID deve ter 5 partes separadas por hífen')
            return result
        
        # Verifica tamanho de cada parte
        expected_lengths = [8, 4, 4, 4, 12]
        for i, (part, expected) in enumerate(zip(parts, expected_lengths)):
            if len(part) != expected:
                result['errors'].append(f'Parte {i+1} deve ter {expected} caracteres, tem {len(part)}')
        
        if result['errors']:
            return result
        
        # Validação com UUID library
        try:
            uuid_obj = uuid.UUID(normalized)
            result['uuid_version'] = uuid_obj.version
            result['uuid_variant'] = uuid_obj.variant
            
            # Validações específicas por versão
            if uuid_obj.version == 4:
                # UUID v4 deve ser aleatório
                if normalized == '00000000-0000-4000-8000-000000000000':
                    result['warnings'].append('UUID v4 parece ser um template, não aleatório')
            
            result['valid'] = True
            
        except ValueError as e:
            result['errors'].append(f'UUID inválido: {str(e)}')
        
        return result
    
    def session_exists(self, session_id: str) -> bool:
        """Verifica se uma sessão específica existe no sistema."""
        if not session_id or not self.is_valid_uuid(session_id):
            return False
            
        real_sessions = self.get_real_session_ids()
        return session_id in real_sessions
    
    def is_temporary_session(self, session_id: str) -> bool:
        """Verifica se um session_id é temporário."""
        if not session_id:
            return False
            
        return (
            session_id.startswith('temp-') or 
            session_id == 'awaiting-real-session' or
            not self.is_valid_uuid(session_id)
        )
    
    def get_session_file_path(self, session_id: str) -> Optional[str]:
        """Retorna o caminho do arquivo da sessão se existir."""
        if not self.session_exists(session_id):
            return None
            
        file_path = os.path.join(self.project_path, f"{session_id}.jsonl")
        if os.path.exists(file_path):
            return file_path
            
        return None
    
    def validate_session_for_redirect(self, session_id: str) -> dict:
        """Valida se uma sessão pode ser usada para redirecionamento."""
        result = {
            'valid': False,
            'exists': False,
            'is_temporary': False,
            'can_redirect': False,
            'session_id': session_id,
            'error': None
        }
        
        if not session_id:
            result['error'] = 'Session ID vazio'
            return result
            
        result['is_temporary'] = self.is_temporary_session(session_id)
        result['exists'] = self.session_exists(session_id)
        result['valid'] = self.is_valid_uuid(session_id)
        
        # Só pode redirecionar se:
        # 1. É um UUID válido
        # 2. A sessão realmente existe no sistema
        # 3. Não é uma sessão temporária
        result['can_redirect'] = (
            result['valid'] and 
            result['exists'] and 
            not result['is_temporary']
        )
        
        if not result['can_redirect']:
            if result['is_temporary']:
                result['error'] = f'Sessão temporária não pode ser usada para redirecionamento: {session_id}'
            elif not result['exists']:
                result['error'] = f'Sessão não existe no sistema: {session_id}'
            elif not result['valid']:
                result['error'] = f'Session ID inválido: {session_id}'
        
        return result
    
    def validate_and_migrate_session(self, session_id: str) -> tuple[str, bool]:
        """
        Valida e migra uma sessão se necessário.
        
        Retorna: (session_id_validado, foi_migrado)
        """
        import uuid
        
        # Se é temporária ou inválida, gera novo UUID
        if self.is_temporary_session(session_id) or not self.is_valid_uuid(session_id):
            # Gera novo UUID válido
            new_session_id = str(uuid.uuid4())
            print(f"🔄 Migrando sessão temporária {session_id} → {new_session_id}")
            return new_session_id, True
        
        # Se já é válida, retorna como está
        return session_id, False
    
    def validate_session_security(self, session_id: str, client_ip: Optional[str] = None) -> Dict[str, Any]:
        """Validação completa de segurança para uma sessão."""
        result = {
            'session_id': session_id,
            'valid': False,
            'security_score': 0,
            'issues': [],
            'recommendations': [],
            'risk_level': 'unknown',
            'allowed': False
        }
        
        try:
            # 1. Validação de formato
            format_result = self.validate_session_id_format(session_id)
            if not format_result['valid']:
                result['issues'].extend(format_result['errors'])
                result['risk_level'] = 'high'
                return result
            
            result['security_score'] += 30  # Base score para formato válido
            
            # 2. Verifica existência da sessão
            if not self.session_exists(session_id):
                result['issues'].append('Sessão não existe no sistema')
                result['risk_level'] = 'medium'
                return result
            
            result['security_score'] += 20  # Score por existir
            
            # 3. Verifica se não é temporária
            if self.is_temporary_session(session_id):
                result['issues'].append('Sessão temporária não é permitida')
                result['risk_level'] = 'medium'
                return result
            
            result['security_score'] += 20  # Score por não ser temporária
            
            # 4. Validações de arquivo
            file_path = self.get_session_file_path(session_id)
            if file_path:
                file_result = self._validate_session_file_security(file_path)
                result['security_score'] += file_result['score']
                result['issues'].extend(file_result['issues'])
                result['recommendations'].extend(file_result['recommendations'])
            
            # 5. Determina nível de risco final
            if result['security_score'] >= 80:
                result['risk_level'] = 'low'
                result['allowed'] = True
                result['valid'] = True
            elif result['security_score'] >= 60:
                result['risk_level'] = 'medium'
                result['allowed'] = len(result['issues']) == 0
                result['valid'] = result['allowed']
            else:
                result['risk_level'] = 'high'
                result['allowed'] = False
                result['valid'] = False
            
            return result
            
        except Exception as e:
            logger.error(f"Erro na validação de segurança da sessão {session_id}: {e}")
            result['issues'].append(f'Erro interno na validação: {str(e)}')
            result['risk_level'] = 'high'
            result['allowed'] = False
            return result
    
    def _validate_session_file_security(self, file_path: str) -> Dict[str, Any]:
        """Valida segurança do arquivo de sessão."""
        result = {
            'score': 0,
            'issues': [],
            'recommendations': []
        }
        
        try:
            file_path_obj = Path(file_path)
            
            # Verifica se arquivo existe
            if not file_path_obj.exists():
                result['issues'].append('Arquivo de sessão não encontrado')
                return result
            
            result['score'] += 10
            
            # Verifica permissões do arquivo
            stat = file_path_obj.stat()
            permissions = oct(stat.st_mode)[-3:]
            
            # Arquivo deve ser legível pelo usuário/grupo mas não por outros
            if permissions.endswith('4') or permissions.endswith('6'):
                result['issues'].append('Arquivo de sessão tem permissões muito abertas')
            else:
                result['score'] += 10
            
            # Verifica tamanho do arquivo (arquivos muito grandes podem ser suspeitos)
            file_size = stat.st_size
            if file_size > 100 * 1024 * 1024:  # 100MB
                result['issues'].append('Arquivo de sessão muito grande (>100MB)')
            elif file_size > 50 * 1024 * 1024:  # 50MB
                result['recommendations'].append('Arquivo de sessão grande (>50MB), considere limpeza')
                result['score'] += 5
            else:
                result['score'] += 10
            
            # Verifica idade do arquivo
            age_hours = (datetime.now().timestamp() - stat.st_mtime) / 3600
            if age_hours > 24 * 30:  # 30 dias
                result['recommendations'].append('Sessão antiga (>30 dias)')
            elif age_hours < 24:  # Menos de 1 dia
                result['score'] += 10
            else:
                result['score'] += 5
            
            return result
            
        except Exception as e:
            result['issues'].append(f'Erro ao validar arquivo: {str(e)}')
            return result
    
    def scan_for_suspicious_sessions(self) -> Dict[str, List[str]]:
        """Escaneia por sessões suspeitas no sistema."""
        suspicious = {
            'invalid_format': [],
            'missing_files': [],
            'large_files': [],
            'old_sessions': [],
            'empty_sessions': []
        }
        
        try:
            real_sessions = self.get_real_session_ids()
            
            for session_id in real_sessions:
                # Verifica formato
                if not self.is_valid_uuid(session_id):
                    suspicious['invalid_format'].append(session_id)
                    continue
                
                # Verifica arquivo
                file_path = self.get_session_file_path(session_id)
                if not file_path:
                    suspicious['missing_files'].append(session_id)
                    continue
                
                try:
                    file_path_obj = Path(file_path)
                    stat = file_path_obj.stat()
                    
                    # Arquivo muito grande
                    if stat.st_size > 50 * 1024 * 1024:
                        suspicious['large_files'].append(session_id)
                    
                    # Arquivo vazio
                    if stat.st_size == 0:
                        suspicious['empty_sessions'].append(session_id)
                    
                    # Sessão muito antiga
                    age_days = (datetime.now().timestamp() - stat.st_mtime) / (24 * 3600)
                    if age_days > 30:
                        suspicious['old_sessions'].append(session_id)
                        
                except Exception as e:
                    logger.warning(f"Erro ao verificar arquivo da sessão {session_id}: {e}")
                    suspicious['missing_files'].append(session_id)
            
            return suspicious
            
        except Exception as e:
            logger.error(f"Erro no scan de sessões suspeitas: {e}")
            return suspicious
    
    def cleanup_invalid_sessions(self, dry_run: bool = True) -> Dict[str, Any]:
        """Remove sessões inválidas ou suspeitas."""
        result = {
            'dry_run': dry_run,
            'removed_count': 0,
            'removed_sessions': [],
            'errors': [],
            'size_recovered': 0
        }
        
        try:
            suspicious = self.scan_for_suspicious_sessions()
            
            # Remove sessões com formato inválido
            for session_id in suspicious['invalid_format']:
                try:
                    if not dry_run:
                        file_path = os.path.join(self.project_path, f"{session_id}.jsonl")
                        if os.path.exists(file_path):
                            size = os.path.getsize(file_path)
                            os.remove(file_path)
                            result['size_recovered'] += size
                    
                    result['removed_sessions'].append(session_id)
                    result['removed_count'] += 1
                    
                except Exception as e:
                    result['errors'].append(f"Erro ao remover {session_id}: {str(e)}")
            
            # Remove sessões vazias
            for session_id in suspicious['empty_sessions']:
                try:
                    if not dry_run:
                        file_path = os.path.join(self.project_path, f"{session_id}.jsonl")
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    
                    result['removed_sessions'].append(session_id)
                    result['removed_count'] += 1
                    
                except Exception as e:
                    result['errors'].append(f"Erro ao remover sessão vazia {session_id}: {str(e)}")
            
            return result
            
        except Exception as e:
            result['errors'].append(f"Erro geral na limpeza: {str(e)}")
            return result