#!/usr/bin/env python3
"""
Demonstração do Sistema de Logging Estruturado e Tratamento de Erros.

Este script mostra como usar o sistema implementado e testa suas funcionalidades.
"""

import asyncio
import os
import time
from pathlib import Path

from logging_config import (
    setup_logging, 
    get_contextual_logger, 
    set_request_context,
    clear_request_context,
    generate_request_id
)
from exception_middleware import handle_errors, StreamingErrorHandler

# Configura logging para demo
setup_logging(
    level="DEBUG",
    log_file="/tmp/claude_api_demo.log",
    max_bytes=10 * 1024 * 1024,  # 10MB
    backup_count=3
)

logger = get_contextual_logger(__name__)

@handle_errors(timeout_seconds=5.0)
async def exemplo_funcao_com_timeout():
    """Exemplo de função com timeout que pode falhar."""
    
    logger.info("Iniciando função com timeout")
    
    # Simula processamento longo
    await asyncio.sleep(6)  # Vai dar timeout
    
    logger.info("Função concluída com sucesso")
    return "sucesso"

@handle_errors(reraise=True)
async def exemplo_funcao_com_erro():
    """Exemplo de função que gera erro."""
    
    logger.info("Função que vai gerar erro")
    
    # Simula diferentes tipos de erro
    import random
    erro_tipo = random.choice([1, 2, 3])
    
    if erro_tipo == 1:
        raise ValueError("Erro de validação simulado")
    elif erro_tipo == 2:
        raise ConnectionError("Erro de conexão simulado")  
    else:
        raise Exception("Erro genérico simulado")

async def exemplo_streaming_com_erro():
    """Exemplo de streaming que pode falhar."""
    
    logger.info("Iniciando streaming de exemplo")
    
    try:
        for i in range(10):
            if i == 5:
                # Simula erro no meio do streaming
                raise RuntimeError("Erro durante streaming")
                
            logger.debug(f"Chunk {i} enviado")
            yield f"data chunk {i}"
            await asyncio.sleep(0.1)
            
    except Exception as e:
        # Usa handler de streaming para formatar erro
        error_sse = await StreamingErrorHandler.handle_streaming_error(
            e, "demo_session_123"
        )
        yield error_sse

async def demonstrar_contexto_request():
    """Demonstra uso de contexto de request."""
    
    print("\n=== DEMONSTRAÇÃO DE CONTEXTO DE REQUEST ===")
    
    # Simula request HTTP
    request_id = generate_request_id()
    session_id = "demo_session_456"
    client_ip = "192.168.1.100"
    
    # Define contexto
    set_request_context(request_id, session_id, client_ip)
    
    logger.info("Request iniciada com contexto", extra={
        "endpoint": "/api/chat",
        "method": "POST"
    })
    
    # Simula processamento
    await asyncio.sleep(0.1)
    
    logger.info("Processamento concluído")
    
    # Limpa contexto
    clear_request_context()
    
    logger.info("Request finalizada sem contexto")

async def demonstrar_diferentes_niveis_log():
    """Demonstra diferentes níveis de log."""
    
    print("\n=== DEMONSTRAÇÃO DE NÍVEIS DE LOG ===")
    
    logger.debug("Log de debug com detalhes técnicos", extra={
        "sql_query": "SELECT * FROM sessions WHERE active = true",
        "execution_time_ms": 15.2
    })
    
    logger.info("Operação normal completada", extra={
        "user_action": "send_message",
        "session_id": "abc123"
    })
    
    logger.warning("Situação que requer atenção", extra={
        "warning_type": "high_memory_usage",
        "memory_percent": 85
    })
    
    logger.error("Erro que foi tratado", extra={
        "error_type": "ValidationError",
        "field": "message_content",
        "value_length": 50000
    })

async def demonstrar_tratamento_erros():
    """Demonstra sistema de tratamento de erros."""
    
    print("\n=== DEMONSTRAÇÃO DE TRATAMENTO DE ERROS ===")
    
    # Teste 1: Função com timeout
    print("\n1. Testando função com timeout...")
    try:
        result = await exemplo_funcao_com_timeout()
        print(f"Resultado: {result}")
    except Exception as e:
        print(f"Erro capturado: {type(e).__name__}: {e}")
    
    # Teste 2: Função com erro
    print("\n2. Testando função que gera erro...")
    try:
        result = await exemplo_funcao_com_erro()
        print(f"Resultado: {result}")
    except Exception as e:
        print(f"Erro capturado: {type(e).__name__}: {e}")

async def demonstrar_streaming_erro():
    """Demonstra tratamento de erro em streaming."""
    
    print("\n=== DEMONSTRAÇÃO DE STREAMING COM ERRO ===")
    
    async for chunk in exemplo_streaming_com_erro():
        print(f"Recebido: {chunk}")

def demonstrar_configuracao_logs():
    """Mostra como configurar diferentes aspectos do logging."""
    
    print("\n=== CONFIGURAÇÃO DE LOGS ===")
    
    # Mostra arquivo de log criado
    log_file = Path("/tmp/claude_api_demo.log")
    if log_file.exists():
        print(f"Arquivo de log: {log_file}")
        print(f"Tamanho: {log_file.stat().st_size} bytes")
        
        # Mostra últimas linhas
        with open(log_file) as f:
            lines = f.readlines()
            print("\nÚltimas 3 linhas do log:")
            for line in lines[-3:]:
                print(f"  {line.strip()}")
    else:
        print("Arquivo de log não encontrado")

async def main():
    """Função principal da demonstração."""
    
    print("🚀 DEMONSTRAÇÃO DO SISTEMA DE LOGGING E TRATAMENTO DE ERROS")
    print("=" * 65)
    
    # 1. Demonstra contexto de request
    await demonstrar_contexto_request()
    
    # 2. Demonstra diferentes níveis de log
    await demonstrar_diferentes_niveis_log()
    
    # 3. Demonstra tratamento de erros
    await demonstrar_tratamento_erros()
    
    # 4. Demonstra streaming com erro
    await demonstrar_streaming_erro()
    
    # 5. Mostra configuração de logs
    demonstrar_configuracao_logs()
    
    print("\n✅ Demonstração concluída!")
    print("\nVerifique o arquivo /tmp/claude_api_demo.log para ver os logs estruturados em JSON.")

if __name__ == "__main__":
    # Executa demonstração
    asyncio.run(main())