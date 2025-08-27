"""Handler para integração com Claude Code SDK."""

import sys
import os
import asyncio
from typing import AsyncGenerator, Optional, Dict, Any, List
import json
import logging
from datetime import datetime
import uuid
import aiofiles
from pathlib import Path

# Adiciona o diretório do SDK ao path
sdk_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, sdk_path)

from src import (
    AssistantMessage,
    TextBlock,
    ResultMessage,
    ClaudeSDKClient,
    UserMessage,
    SystemMessage,
    ToolUseBlock,
    ToolResultBlock,
    __version__
)

logger = logging.getLogger(__name__)

class ClaudeHandler:
    """Gerenciador de conversas com Claude Code SDK."""
    
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.clients: Dict[str, ClaudeSDKClient] = {}
        # Diretório para armazenar históricos
        self.history_dir = Path("./chat_history")
        self.history_dir.mkdir(exist_ok=True)
        
    async def create_session(self, session_id: str, user_id: str) -> None:
        """Cria uma nova sessão de chat para um usuário."""
        # Limpa sessão antiga se existir
        if session_id in self.clients:
            await self.destroy_session(session_id)
            
        # Cria novo cliente
        client = ClaudeSDKClient()
        await client.connect()
        
        self.clients[session_id] = client
        self.sessions[session_id] = {
            'user_id': user_id,
            'created_at': asyncio.get_event_loop().time(),
            'message_count': 0,
            'active': True
        }
        
        logger.info(f"Session {session_id} created for user {user_id}")
        
    async def destroy_session(self, session_id: str) -> None:
        """Destrói uma sessão existente."""
        if session_id in self.clients:
            try:
                await self.clients[session_id].disconnect()
            except Exception as e:
                logger.error(f"Error disconnecting session {session_id}: {e}")
            finally:
                del self.clients[session_id]
                
        if session_id in self.sessions:
            del self.sessions[session_id]
            
        logger.info(f"Session {session_id} destroyed")
        
    async def send_message(
        self, 
        session_id: str, 
        message: str,
        user_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Envia mensagem e retorna stream de respostas."""
        
        # Verifica se sessão existe
        if session_id not in self.clients:
            await self.create_session(session_id, user_id)
            
        # Valida usuário
        if self.sessions[session_id]['user_id'] != user_id:
            yield {
                "type": "error",
                "error": "Unauthorized: Invalid session",
                "session_id": session_id
            }
            return
            
        client = self.clients[session_id]
        self.sessions[session_id]['message_count'] += 1
        
        try:
            # Envia query ao Claude
            await client.query(message)
            
            # Stream de respostas
            async for msg in client.receive_response():
                if isinstance(msg, AssistantMessage):
                    for block in msg.content:
                        if isinstance(block, TextBlock):
                            yield {
                                "type": "assistant_text",
                                "content": block.text,
                                "session_id": session_id,
                                "message_count": self.sessions[session_id]['message_count']
                            }
                        elif isinstance(block, ToolUseBlock):
                            yield {
                                "type": "tool_use",
                                "tool": block.name,
                                "id": block.id,
                                "session_id": session_id
                            }
                            
                elif isinstance(msg, UserMessage):
                    for block in msg.content:
                        if isinstance(block, ToolResultBlock):
                            # Opcionalmente enviar resultados de ferramentas
                            tool_content = block.content if block.content else ""
                            # Truncar conteúdo muito longo
                            if len(tool_content) > 500:
                                tool_content = tool_content[:500] + "..."
                            yield {
                                "type": "tool_result",
                                "tool_id": block.tool_use_id,
                                "content": tool_content,
                                "session_id": session_id
                            }
                            
                elif isinstance(msg, ResultMessage):
                    result_data = {
                        "type": "result",
                        "session_id": session_id,
                        "message_count": self.sessions[session_id]['message_count']
                    }
                    
                    # Adiciona informações de uso
                    if hasattr(msg, 'usage') and msg.usage:
                        if hasattr(msg.usage, 'input_tokens'):
                            result_data["input_tokens"] = msg.usage.input_tokens
                            result_data["output_tokens"] = msg.usage.output_tokens
                        elif isinstance(msg.usage, dict):
                            result_data["input_tokens"] = msg.usage.get('input_tokens', 0)
                            result_data["output_tokens"] = msg.usage.get('output_tokens', 0)
                            
                    if hasattr(msg, 'total_cost_usd') and msg.total_cost_usd:
                        result_data["cost_usd"] = msg.total_cost_usd
                        
                    yield result_data
                    break
                    
        except Exception as e:
            logger.error(f"Error in send_message: {e}")
            yield {
                "type": "error",
                "error": str(e),
                "session_id": session_id
            }
            
    async def interrupt_session(self, session_id: str, user_id: str) -> bool:
        """Interrompe a execução atual."""
        if session_id not in self.clients:
            return False
            
        # Valida usuário
        if self.sessions[session_id]['user_id'] != user_id:
            return False
            
        try:
            await self.clients[session_id].interrupt()
            return True
        except Exception as e:
            logger.error(f"Error interrupting session: {e}")
            return False
            
    async def clear_context(self, session_id: str, user_id: str) -> None:
        """Limpa o contexto da sessão mantendo o user_id."""
        await self.destroy_session(session_id)
        await self.create_session(session_id, user_id)
        
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retorna informações sobre a sessão."""
        return self.sessions.get(session_id)
        
    async def cleanup_old_sessions(self, max_age_seconds: int = 3600) -> int:
        """Limpa sessões antigas."""
        current_time = asyncio.get_event_loop().time()
        old_sessions = []
        
        for session_id, info in self.sessions.items():
            age = current_time - info['created_at']
            if age > max_age_seconds:
                old_sessions.append(session_id)
                
        for session_id in old_sessions:
            await self.destroy_session(session_id)
            
        return len(old_sessions)