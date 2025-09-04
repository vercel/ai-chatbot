"""
Session Manager - Gerenciamento avançado de sessões Claude Code.

Cria novas sessões no Claude Code SDK e retorna IDs reais.
"""

import subprocess
import asyncio
import json
import time
import logging
import threading
import weakref
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Set
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class SessionMetrics:
    """Métricas de uso de sessão."""
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    message_count: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    connection_errors: int = 0


class ClaudeCodeSessionManager:
    """Gerenciador otimizado de sessões Claude Code SDK."""
    
    # Configurações padrão
    MAX_SESSIONS = 50  # Máximo de sessões simultâneas
    SESSION_TIMEOUT_MINUTES = 30  # Timeout para sessões inativas
    CLEANUP_INTERVAL_MINUTES = 5  # Intervalo de limpeza automática
    MAX_CONNECTION_POOL_SIZE = 10  # Tamanho máximo do pool de conexões
    
    def __init__(self):
        self.claude_projects = Path.home() / ".claude" / "projects"
        self.active_sessions: Dict[str, datetime] = {}  # session_id -> last_activity
        self.session_metrics: Dict[str, SessionMetrics] = {}  # session_id -> metrics
        self.orphaned_sessions: Set[str] = set()  # sessões órfãs detectadas
        self.connection_pool: List[Any] = []  # Pool de conexões reutilizáveis
        self.cleanup_task: Optional[asyncio.Task] = None
        self.scheduler_running = False
        self._lock = threading.Lock()
        
        # Logger para monitoramento
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.INFO)
        
        # Task scheduler será iniciado quando necessário
        self._scheduler_started = False
        
    async def create_new_claude_session(self) -> Optional[str]:
        """
        Cria nova sessão no Claude Code SDK e retorna ID real.
        
        Simula uma interação para forçar criação de nova sessão.
        """
        try:
            # Executa comando Claude Code para criar nova sessão
            # Isso forçará a criação de um novo arquivo .jsonl
            process = await asyncio.create_subprocess_exec(
                'claude', 'olá',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd='/home/suthub/.claude/api-claude-code-app/cc-sdk-chat'
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Aguarda arquivo ser criado
                await asyncio.sleep(1)
                
                # Busca o arquivo .jsonl mais recente
                return await self.get_latest_session_id()
            else:
                print(f"Erro ao criar sessão Claude: {stderr.decode()}")
                return None
                
        except Exception as e:
            print(f"Erro na criação de sessão: {e}")
            return None
    
    async def get_latest_session_id(self) -> Optional[str]:
        """Obtém ID da sessão mais recente."""
        if not self.claude_projects.exists():
            return None
        
        # Busca arquivos .jsonl mais recentes
        jsonl_files = []
        for project_dir in self.claude_projects.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob("*.jsonl"):
                    jsonl_files.append(jsonl_file)
        
        if not jsonl_files:
            return None
        
        # Ordena por modificação mais recente
        jsonl_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        latest_file = jsonl_files[0]
        
        try:
            # Lê primeira linha para pegar sessionId
            with open(latest_file, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line:
                    data = json.loads(first_line)
                    return data.get('sessionId')
        except Exception:
            pass
        
        return None
    
    async def trigger_session_creation(self) -> Optional[str]:
        """
        Dispara criação de nova sessão via comando direto.
        
        Método alternativo que executa comando Claude diretamente.
        """
        try:
            # Comando simples para criar sessão
            cmd = [
                'python', '-m', 'src', 
                '--no-header',
                'Olá! Nova sessão criada.'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd='/home/suthub/.claude/api-claude-code-app/claude-code-sdk-python'
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Aguarda sessão ser registrada
                await asyncio.sleep(2)
                return await self.get_latest_session_id()
            else:
                print(f"Erro ao criar sessão via SDK: {stderr.decode()}")
                return None
                
        except Exception as e:
            print(f"Erro no trigger de sessão: {e}")
            return None
    
    def get_project_name_for_session(self, session_id: str) -> Optional[str]:
        """Obtém nome do projeto para uma sessão específica."""
        if not self.claude_projects.exists():
            return None
        
        # Busca em qual projeto está a sessão
        for project_dir in self.claude_projects.iterdir():
            if project_dir.is_dir():
                session_file = project_dir / f"{session_id}.jsonl"
                if session_file.exists():
                    return project_dir.name
        
        return None
    
    # ===========================================
    # OTIMIZAÇÕES DE GERENCIAMENTO DE SESSÃO
    # ===========================================
    
    async def ensure_scheduler_started(self):
        """Garante que o scheduler esteja iniciado."""
        if not self._scheduler_started:
            self._scheduler_started = True
            await self._start_scheduler()
    
    async def _start_scheduler(self):
        """Inicia o task scheduler para limpeza periódica."""
        if self.scheduler_running:
            return
        
        self.scheduler_running = True
        self.cleanup_task = asyncio.create_task(self._cleanup_scheduler())
        self.logger.info("Task scheduler iniciado")
    
    async def _cleanup_scheduler(self):
        """Task scheduler para limpeza periódica de sessões inativas e órfãs."""
        while self.scheduler_running:
            try:
                # Aguarda o intervalo de limpeza
                await asyncio.sleep(self.CLEANUP_INTERVAL_MINUTES * 60)
                
                # Executa limpeza automática
                await self.cleanup_inactive_sessions()
                await self.detect_orphaned_sessions()
                await self._optimize_connection_pool()
                
                # Log de status
                self.logger.info(f"Cleanup executado - Sessões ativas: {len(self.active_sessions)}, "
                               f"Pool: {len(self.connection_pool)}, "
                               f"Órfãs detectadas: {len(self.orphaned_sessions)}")
                
            except Exception as e:
                self.logger.error(f"Erro no scheduler de limpeza: {e}")
                await asyncio.sleep(60)  # Aguarda 1 minuto antes de tentar novamente
    
    async def stop_scheduler(self):
        """Para o task scheduler."""
        self.scheduler_running = False
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Task scheduler parado")
    
    def update_session_activity(self, session_id: str):
        """Atualiza timestamp de última atividade da sessão."""
        with self._lock:
            self.active_sessions[session_id] = datetime.now()
            
            # Atualiza métricas se existir
            if session_id in self.session_metrics:
                self.session_metrics[session_id].last_activity = datetime.now()
    
    def register_session(self, session_id: str) -> bool:
        """
        Registra nova sessão verificando limites.
        
        Returns:
            bool: True se registrada com sucesso, False se excedeu limite
        """
        with self._lock:
            # Verifica limite máximo
            if len(self.active_sessions) >= self.MAX_SESSIONS:
                self.logger.warning(f"Limite de sessões atingido ({self.MAX_SESSIONS})")
                return False
            
            # Registra sessão
            self.active_sessions[session_id] = datetime.now()
            self.session_metrics[session_id] = SessionMetrics()
            
            self.logger.info(f"Sessão registrada: {session_id}")
            return True
    
    def unregister_session(self, session_id: str):
        """Remove sessão do registro."""
        with self._lock:
            self.active_sessions.pop(session_id, None)
            self.session_metrics.pop(session_id, None)
            self.orphaned_sessions.discard(session_id)
            
            self.logger.info(f"Sessão removida: {session_id}")
    
    async def cleanup_inactive_sessions(self) -> List[str]:
        """
        Remove sessões inativas baseado no timeout configurado.
        
        Returns:
            List[str]: Lista de session_ids removidos
        """
        timeout_threshold = datetime.now() - timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
        inactive_sessions = []
        
        with self._lock:
            for session_id, last_activity in list(self.active_sessions.items()):
                if last_activity < timeout_threshold:
                    inactive_sessions.append(session_id)
                    self.unregister_session(session_id)
        
        if inactive_sessions:
            self.logger.info(f"Removidas {len(inactive_sessions)} sessões inativas: {inactive_sessions}")
        
        return inactive_sessions
    
    async def detect_orphaned_sessions(self) -> List[str]:
        """
        Detecta sessões órfãs (sem arquivos .jsonl correspondentes).
        
        Returns:
            List[str]: Lista de session_ids órfãos encontrados
        """
        orphans_found = []
        
        if not self.claude_projects.exists():
            return orphans_found
        
        # Coleta todos os session_ids dos arquivos .jsonl existentes
        existing_sessions = set()
        for project_dir in self.claude_projects.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob("*.jsonl"):
                    try:
                        # Extrai session_id do nome do arquivo
                        session_id = jsonl_file.stem
                        existing_sessions.add(session_id)
                    except Exception:
                        continue
        
        # Detecta órfãs nas sessões registradas
        with self._lock:
            for session_id in list(self.active_sessions.keys()):
                if session_id not in existing_sessions:
                    self.orphaned_sessions.add(session_id)
                    orphans_found.append(session_id)
        
        if orphans_found:
            self.logger.warning(f"Detectadas {len(orphans_found)} sessões órfãs: {orphans_found}")
        
        return orphans_found
    
    async def _optimize_connection_pool(self):
        """Otimiza o pool de conexões removendo conexões antigas."""
        # Por enquanto, apenas limita o tamanho do pool
        # Em uma implementação real, aqui seria feita a gestão das conexões
        if len(self.connection_pool) > self.MAX_CONNECTION_POOL_SIZE:
            excess = len(self.connection_pool) - self.MAX_CONNECTION_POOL_SIZE
            self.connection_pool = self.connection_pool[-self.MAX_CONNECTION_POOL_SIZE:]
            self.logger.info(f"Pool de conexões otimizado, removidas {excess} conexões antigas")
    
    def update_session_metrics(self, session_id: str, **kwargs):
        """
        Atualiza métricas de uma sessão.
        
        Args:
            session_id: ID da sessão
            **kwargs: message_count, total_tokens, total_cost, connection_errors
        """
        if session_id not in self.session_metrics:
            self.session_metrics[session_id] = SessionMetrics()
        
        metrics = self.session_metrics[session_id]
        
        # Atualiza atividade
        metrics.last_activity = datetime.now()
        
        # Atualiza métricas específicas
        for key, value in kwargs.items():
            if hasattr(metrics, key):
                setattr(metrics, key, value)
    
    def get_session_metrics(self, session_id: str) -> Optional[SessionMetrics]:
        """Retorna métricas de uma sessão."""
        return self.session_metrics.get(session_id)
    
    def get_all_session_metrics(self) -> Dict[str, SessionMetrics]:
        """Retorna métricas de todas as sessões."""
        return self.session_metrics.copy()
    
    def get_session_health_report(self) -> Dict[str, Any]:
        """
        Gera relatório de saúde das sessões.
        
        Returns:
            Dict com estatísticas gerais das sessões
        """
        now = datetime.now()
        active_count = len(self.active_sessions)
        orphaned_count = len(self.orphaned_sessions)
        
        # Calcula sessões por idade
        recent_sessions = 0  # Últimas 5 min
        old_sessions = 0     # Mais de 1 hora
        
        for last_activity in self.active_sessions.values():
            age_minutes = (now - last_activity).total_seconds() / 60
            if age_minutes <= 5:
                recent_sessions += 1
            elif age_minutes >= 60:
                old_sessions += 1
        
        # Métricas totais
        total_messages = sum(m.message_count for m in self.session_metrics.values())
        total_tokens = sum(m.total_tokens for m in self.session_metrics.values())
        total_cost = sum(m.total_cost for m in self.session_metrics.values())
        total_errors = sum(m.connection_errors for m in self.session_metrics.values())
        
        return {
            "timestamp": now.isoformat(),
            "sessions": {
                "active": active_count,
                "orphaned": orphaned_count,
                "recent": recent_sessions,
                "old": old_sessions,
                "max_allowed": self.MAX_SESSIONS
            },
            "pool": {
                "size": len(self.connection_pool),
                "max_size": self.MAX_CONNECTION_POOL_SIZE
            },
            "totals": {
                "messages": total_messages,
                "tokens": total_tokens,
                "cost_usd": total_cost,
                "errors": total_errors
            },
            "config": {
                "timeout_minutes": self.SESSION_TIMEOUT_MINUTES,
                "cleanup_interval": self.CLEANUP_INTERVAL_MINUTES
            }
        }
    
    async def force_cleanup_all(self):
        """Força limpeza completa de todas as sessões (para manutenção)."""
        self.logger.info("Iniciando limpeza forçada de todas as sessões")
        
        with self._lock:
            session_count = len(self.active_sessions)
            self.active_sessions.clear()
            self.session_metrics.clear()
            self.orphaned_sessions.clear()
            self.connection_pool.clear()
        
        self.logger.info(f"Limpeza forçada concluída - {session_count} sessões removidas")