"""
Analytics Service - Análise avançada de sessões Claude Code.

Extrai métricas reais dos arquivos .jsonl para analytics precisos.
"""

import json
import glob
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from logging_config import get_contextual_logger
from exception_middleware import handle_errors


@dataclass
class SessionMetrics:
    """Métricas de uma sessão específica."""
    session_id: str
    project: str
    total_messages: int
    user_messages: int
    assistant_messages: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost: float
    tools_used: List[str]
    first_message_time: Optional[datetime]
    last_message_time: Optional[datetime]
    duration_hours: float
    file_path: str


@dataclass
class GlobalAnalytics:
    """Analytics globais de todas as sessões."""
    total_sessions: int
    total_messages: int
    total_tokens: int
    total_cost: float
    active_projects: List[str]
    most_used_tools: List[tuple]
    sessions_by_project: Dict[str, int]
    cost_by_project: Dict[str, float]
    tokens_by_project: Dict[str, int]
    sessions_metrics: List[SessionMetrics]


class AnalyticsService:
    """Serviço de analytics para sessões Claude Code."""
    
    def __init__(self):
        self.claude_projects = Path.home() / ".claude" / "projects"
        self.logger = get_contextual_logger(__name__)
        
        self.logger.info(
            "Analytics Service inicializado",
            extra={
                "event": "analytics_init",
                "component": "analytics_service",
                "claude_projects_path": str(self.claude_projects)
            }
        )
        
    async def get_global_analytics(self) -> GlobalAnalytics:
        """Obtém analytics globais de todas as sessões."""
        if not self.claude_projects.exists():
            return self._empty_analytics()
        
        sessions_metrics = []
        projects = set()
        all_tools = []
        
        # Processar todos os arquivos .jsonl
        for project_dir in self.claude_projects.iterdir():
            if project_dir.is_dir():
                project_name = project_dir.name
                projects.add(project_name)
                
                for jsonl_file in project_dir.glob("*.jsonl"):
                    try:
                        metrics = await self._analyze_session_file(str(jsonl_file), project_name)
                        if metrics:
                            sessions_metrics.append(metrics)
                            all_tools.extend(metrics.tools_used)
                    except Exception as e:
                        print(f"Erro ao analisar {jsonl_file}: {e}")
        
        # Calcular totais
        total_sessions = len(sessions_metrics)
        total_messages = sum(s.total_messages for s in sessions_metrics)
        total_tokens = sum(s.total_input_tokens + s.total_output_tokens for s in sessions_metrics)
        total_cost = sum(s.total_cost for s in sessions_metrics)
        
        # Ferramentas mais usadas
        tool_counts = {}
        for tool in all_tools:
            tool_counts[tool] = tool_counts.get(tool, 0) + 1
        most_used_tools = sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Métricas por projeto
        sessions_by_project = {}
        cost_by_project = {}
        tokens_by_project = {}
        
        for session in sessions_metrics:
            proj = session.project
            sessions_by_project[proj] = sessions_by_project.get(proj, 0) + 1
            cost_by_project[proj] = cost_by_project.get(proj, 0) + session.total_cost
            tokens_by_project[proj] = tokens_by_project.get(proj, 0) + (session.total_input_tokens + session.total_output_tokens)
        
        return GlobalAnalytics(
            total_sessions=total_sessions,
            total_messages=total_messages,
            total_tokens=total_tokens,
            total_cost=total_cost,
            active_projects=list(projects),
            most_used_tools=most_used_tools[:10],
            sessions_by_project=sessions_by_project,
            cost_by_project=cost_by_project,
            tokens_by_project=tokens_by_project,
            sessions_metrics=sessions_metrics
        )
    
    async def _analyze_session_file(self, file_path: str, project_name: str) -> Optional[SessionMetrics]:
        """Analisa arquivo .jsonl individual para extrair métricas."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if not lines:
                return None
            
            session_id = Path(file_path).stem
            total_messages = 0
            user_messages = 0
            assistant_messages = 0
            total_input_tokens = 0
            total_output_tokens = 0
            total_cost = 0.0
            tools_used = set()
            first_time = None
            last_time = None
            
            for line in lines:
                if line.strip():
                    try:
                        data = json.loads(line)
                        
                        # Extrair timestamp
                        timestamp_str = data.get('timestamp')
                        if timestamp_str:
                            try:
                                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                                if first_time is None:
                                    first_time = timestamp
                                last_time = timestamp
                            except:
                                pass
                        
                        # Processar mensagem
                        if 'message' in data:
                            message = data['message']
                            role = message.get('role')
                            
                            if role in ['user', 'assistant']:
                                total_messages += 1
                                
                                if role == 'user':
                                    user_messages += 1
                                elif role == 'assistant':
                                    assistant_messages += 1
                                
                                # Extrair tokens
                                if 'usage' in message:
                                    usage = message['usage']
                                    total_input_tokens += usage.get('input_tokens', 0)
                                    total_output_tokens += usage.get('output_tokens', 0)
                                    
                                    # Calcular custo aproximado (baseado em preços típicos)
                                    input_cost = usage.get('input_tokens', 0) * 0.000003  # $3/1M tokens
                                    output_cost = usage.get('output_tokens', 0) * 0.000015  # $15/1M tokens
                                    total_cost += input_cost + output_cost
                                
                                # Extrair ferramentas usadas
                                if 'content' in message and isinstance(message['content'], list):
                                    for content_block in message['content']:
                                        if isinstance(content_block, dict) and content_block.get('type') == 'tool_use':
                                            tool_name = content_block.get('name')
                                            if tool_name:
                                                tools_used.add(tool_name)
                    
                    except json.JSONDecodeError:
                        continue
            
            # Calcular duração
            duration_hours = 0.0
            if first_time and last_time:
                duration = last_time - first_time
                duration_hours = duration.total_seconds() / 3600
            
            return SessionMetrics(
                session_id=session_id,
                project=project_name,
                total_messages=total_messages,
                user_messages=user_messages,
                assistant_messages=assistant_messages,
                total_input_tokens=total_input_tokens,
                total_output_tokens=total_output_tokens,
                total_cost=total_cost,
                tools_used=list(tools_used),
                first_message_time=first_time,
                last_message_time=last_time,
                duration_hours=duration_hours,
                file_path=file_path
            )
            
        except Exception as e:
            print(f"Erro ao analisar arquivo {file_path}: {e}")
            return None
    
    def _empty_analytics(self) -> GlobalAnalytics:
        """Retorna analytics vazios."""
        return GlobalAnalytics(
            total_sessions=0,
            total_messages=0,
            total_tokens=0,
            total_cost=0.0,
            active_projects=[],
            most_used_tools=[],
            sessions_by_project={},
            cost_by_project={},
            tokens_by_project={},
            sessions_metrics=[]
        )
    
    async def get_session_analytics(self, session_id: str) -> Optional[SessionMetrics]:
        """Obtém analytics de uma sessão específica."""
        if not self.claude_projects.exists():
            return None
        
        # Buscar arquivo da sessão
        for project_dir in self.claude_projects.iterdir():
            if project_dir.is_dir():
                jsonl_file = project_dir / f"{session_id}.jsonl"
                if jsonl_file.exists():
                    return await self._analyze_session_file(str(jsonl_file), project_dir.name)
        
        return None
    
    async def get_project_analytics(self, project_name: str) -> Dict[str, Any]:
        """Obtém analytics específicos de um projeto."""
        project_dir = self.claude_projects / project_name
        
        if not project_dir.exists():
            return {"error": "Projeto não encontrado"}
        
        sessions_metrics = []
        for jsonl_file in project_dir.glob("*.jsonl"):
            try:
                metrics = await self._analyze_session_file(str(jsonl_file), project_name)
                if metrics:
                    sessions_metrics.append(metrics)
            except Exception:
                continue
        
        if not sessions_metrics:
            return {"error": "Nenhuma sessão encontrada no projeto"}
        
        # Calcular totais do projeto
        total_sessions = len(sessions_metrics)
        total_messages = sum(s.total_messages for s in sessions_metrics)
        total_tokens = sum(s.total_input_tokens + s.total_output_tokens for s in sessions_metrics)
        total_cost = sum(s.total_cost for s in sessions_metrics)
        
        # Sessão mais ativa do projeto
        most_active = max(sessions_metrics, key=lambda s: s.total_messages)
        
        return {
            "project": project_name,
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "most_active_session": {
                "id": most_active.session_id,
                "messages": most_active.total_messages,
                "tokens": most_active.total_input_tokens + most_active.total_output_tokens,
                "cost": most_active.total_cost
            },
            "sessions": [
                {
                    "id": s.session_id,
                    "messages": s.total_messages,
                    "tokens": s.total_input_tokens + s.total_output_tokens,
                    "cost": s.total_cost,
                    "tools": s.tools_used
                }
                for s in sorted(sessions_metrics, key=lambda x: x.total_messages, reverse=True)
            ]
        }