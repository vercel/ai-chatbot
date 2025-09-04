"""Servidor FastAPI para integração do Claude Code SDK com ai-chatbot."""

import os
import json
import logging
import asyncio
import uuid
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from claude_handler import ClaudeHandler
from auth_bridge import AuthBridge

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Handlers globais
claude_handler = ClaudeHandler()
auth_bridge = AuthBridge()

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia lifecycle da aplicação."""
    # Startup
    logger.info("Starting Claude Code SDK API Server...")
    
    # Tarefa de limpeza periódica de sessões antigas
    async def cleanup_task():
        while True:
            await asyncio.sleep(3600)  # A cada hora
            cleaned = await claude_handler.cleanup_old_sessions(max_age_seconds=7200)
            if cleaned > 0:
                logger.info(f"Cleaned {cleaned} old sessions")
                
    cleanup = asyncio.create_task(cleanup_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down Claude Code SDK API Server...")
    cleanup.cancel()
    
    # Limpa todas as sessões
    for session_id in list(claude_handler.clients.keys()):
        await claude_handler.destroy_session(session_id)

# Criar app FastAPI
app = FastAPI(
    title="Claude Code SDK API",
    description="Backend for AI Chatbot with Claude Code SDK integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3033",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3033",
        "https://localhost:3000",
        "http://127.0.0.1:3033",
        "*"  # Permite qualquer origem em desenvolvimento
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Modelos Pydantic
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatRequest(BaseModel):
    """Modelo para requisições do chat compatível com CC-SDK."""
    messages: list[Dict[str, Any]]
    sessionId: Optional[str] = None
    model: Optional[str] = "claude-3.5-sonnet-20241022"
    
class DeleteMessageRequest(BaseModel):
    """Modelo para deletar mensagem."""
    messageId: str
    sessionId: str

class SessionAction(BaseModel):
    session_id: str

class ChatResponse(BaseModel):
    session_id: str
    status: str

# Endpoints

@app.post("/api/claude/session")
async def create_session():
    """Cria uma nova sessão e retorna o session_id."""
    session_id = str(uuid.uuid4())
    await claude_handler.create_session(session_id, "dev-user")
    return {"session_id": session_id}

@app.delete("/api/claude/session/{session_id}")
async def delete_session(session_id: str):
    """Deleta uma sessão específica."""
    await claude_handler.destroy_session(session_id)
    return {"status": "deleted", "session_id": session_id}

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Claude Code SDK API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "active_sessions": len(claude_handler.sessions),
        "uptime": "running"
    }

@app.post("/api/claude/chat")
async def send_message(
    chat_message: ChatMessage,
    authorization: Optional[str] = Header(None)
):
    """Envia mensagem para o Claude e retorna stream SSE."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    # Em desenvolvimento, permite teste sem auth
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {
            'id': 'dev-user',
            'email': 'dev@test.com',
            'type': 'regular'
        }
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Gera session_id se não fornecido
    session_id = chat_message.session_id or str(uuid.uuid4())
    user_id = user_info['id']
    
    async def generate_stream():
        """Gera stream SSE para a resposta."""
        try:
            # Envia evento inicial
            yield {
                "event": "start",
                "data": json.dumps({
                    "session_id": session_id,
                    "user_id": user_id
                })
            }
            
            # Stream de respostas do Claude
            async for response in claude_handler.send_message(
                session_id,
                chat_message.message,
                user_id
            ):
                # Formata como SSE
                yield {
                    "event": "message",
                    "data": json.dumps(response)
                }
                
                # Se for erro, para o stream
                if response.get("type") == "error":
                    break
                    
            # Evento de conclusão
            yield {
                "event": "done",
                "data": json.dumps({
                    "session_id": session_id,
                    "status": "completed"
                })
            }
            
        except Exception as e:
            logger.error(f"Error in stream generation: {e}")
            yield {
                "event": "error",
                "data": json.dumps({
                    "error": str(e),
                    "session_id": session_id
                })
            }
    
    return EventSourceResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-ID": session_id
        }
    )

@app.post("/api/claude/interrupt/{session_id}")
async def interrupt_session(
    session_id: str,
    authorization: Optional[str] = Header(None)
):
    """Interrompe a execução de uma sessão."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    success = await claude_handler.interrupt_session(session_id, user_info['id'])
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or unauthorized")
    
    return {
        "status": "interrupted",
        "session_id": session_id
    }

@app.post("/api/claude/clear/{session_id}")
async def clear_session(
    session_id: str,
    authorization: Optional[str] = Header(None)
):
    """Limpa o contexto de uma sessão."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    await claude_handler.clear_context(session_id, user_info['id'])
    
    return {
        "status": "cleared",
        "session_id": session_id
    }

@app.delete("/api/claude/session/{session_id}")
async def delete_session(
    session_id: str,
    authorization: Optional[str] = Header(None)
):
    """Remove uma sessão completamente."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Verifica se a sessão pertence ao usuário
    session_info = claude_handler.get_session_info(session_id)
    if not session_info or session_info['user_id'] != user_info['id']:
        raise HTTPException(status_code=404, detail="Session not found or unauthorized")
    
    await claude_handler.destroy_session(session_id)
    
    return {
        "status": "deleted",
        "session_id": session_id
    }

@app.get("/api/claude/sessions")
async def list_sessions(
    authorization: Optional[str] = Header(None)
):
    """Lista as sessões ativas do usuário."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Filtra sessões do usuário
    user_sessions = []
    for session_id, info in claude_handler.sessions.items():
        if info['user_id'] == user_info['id']:
            user_sessions.append({
                'session_id': session_id,
                'message_count': info['message_count'],
                'created_at': info['created_at'],
                'active': info['active']
            })
    
    return {
        "sessions": user_sessions,
        "count": len(user_sessions)
    }

# Novos endpoints compatíveis com CC-SDK-Chat

@app.post("/api/chat")
async def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    """Endpoint principal do chat compatível com CC-SDK-Chat."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    # Em desenvolvimento, permite teste sem auth
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {
            'id': 'dev-user',
            'email': 'dev@test.com',
            'type': 'regular'
        }
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Usa sessionId fixo ou fornecido
    session_id = request.sessionId or "00000000-0000-0000-0000-000000000001"
    user_id = user_info['id']
    
    # Extrai última mensagem do usuário
    user_message = ""
    if request.messages:
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
    
    if not user_message:
        raise HTTPException(status_code=400, detail="No user message found")
    
    async def generate_stream():
        """Gera stream SSE para a resposta."""
        try:
            # Envia evento inicial
            yield {
                "event": "start",
                "data": json.dumps({
                    "session_id": session_id,
                    "user_id": user_id,
                    "model": request.model
                })
            }
            
            # Processa histórico se necessário
            if len(request.messages) > 1:
                await claude_handler.set_chat_history(session_id, request.messages, user_id)
            
            # Stream de respostas do Claude
            full_response = ""
            async for response in claude_handler.send_message(
                session_id,
                user_message,
                user_id
            ):
                # Formata como SSE
                if response.get("type") == "assistant_text":
                    full_response += response.get("content", "")
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "type": "text",
                            "content": response.get("content", ""),
                            "session_id": session_id
                        })
                    }
                elif response.get("type") == "tool_use":
                    yield {
                        "event": "tool",
                        "data": json.dumps(response)
                    }
                elif response.get("type") == "error":
                    yield {
                        "event": "error",
                        "data": json.dumps(response)
                    }
                    break
                    
            # Salva mensagem no histórico JSONL
            await claude_handler.save_to_history(
                session_id,
                user_id,
                user_message,
                full_response
            )
            
            # Evento de conclusão
            yield {
                "event": "done",
                "data": json.dumps({
                    "session_id": session_id,
                    "status": "completed",
                    "message_saved": True
                })
            }
            
        except Exception as e:
            logger.error(f"Error in chat stream: {e}")
            yield {
                "event": "error",
                "data": json.dumps({
                    "error": str(e),
                    "session_id": session_id
                })
            }
    
    return EventSourceResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-ID": session_id
        }
    )

@app.get("/api/load-project-history")
async def load_project_history(
    sessionId: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Carrega o histórico de conversas do projeto."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Usa sessionId fixo se não fornecido
    session_id = sessionId or "00000000-0000-0000-0000-000000000001"
    
    # Carrega histórico do arquivo JSONL
    history = await claude_handler.load_history(session_id, user_info['id'])
    
    return {
        "messages": history,
        "session_id": session_id
    }

@app.post("/api/delete-message")
async def delete_message(
    request: DeleteMessageRequest,
    authorization: Optional[str] = Header(None)
):
    """Deleta uma mensagem específica do histórico."""
    
    # Validação de autenticação
    user_info = auth_bridge.validate_request_auth(authorization)
    
    if not user_info and os.getenv('NODE_ENV') == 'development':
        user_info = {'id': 'dev-user'}
        
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Deleta mensagem do histórico
    success = await claude_handler.delete_message(
        request.sessionId,
        request.messageId,
        user_info['id']
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")
    
    return {
        "status": "deleted",
        "message_id": request.messageId,
        "session_id": request.sessionId
    }

# Endpoint de teste para desenvolvimento
if os.getenv('NODE_ENV') == 'development':
    @app.post("/api/claude/test-token")
    async def generate_test_token():
        """Gera um token de teste para desenvolvimento."""
        token = auth_bridge.create_test_token('dev-user', 'dev@test.com')
        return {
            "token": token,
            "usage": "Add to Authorization header as 'Bearer {token}'"
        }

if __name__ == "__main__":
    import uvicorn
    
    # Define porta e host
    port = int(os.getenv("PORT", "8002"))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Configura ambiente
    os.environ['NODE_ENV'] = os.getenv('NODE_ENV', 'development')
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=os.getenv('NODE_ENV') == 'development',
        log_level="info"
    )