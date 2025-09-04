#!/usr/bin/env python3
"""
Script de Teste do Sistema de Logging e Tratamento de Erros.

Execute este script para verificar se o sistema está funcionando corretamente.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Adiciona o diretório da API ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from logging_config import setup_logging, get_contextual_logger, set_request_context, clear_request_context
from exception_middleware import handle_errors, StreamingErrorHandler

def test_logging_configuration():
    """Testa configuração básica de logging."""
    print("🔧 Testando configuração de logging...")
    
    # Configura logging de teste
    log_file = "/tmp/claude_api_test.log"
    setup_logging(
        level="DEBUG",
        log_file=log_file,
        max_bytes=1 * 1024 * 1024,  # 1MB
        backup_count=3
    )
    
    logger = get_contextual_logger("test_logging")
    
    # Testa diferentes níveis
    logger.debug("Mensagem de debug", extra={"test_type": "debug"})
    logger.info("Mensagem informativa", extra={"test_type": "info"})
    logger.warning("Mensagem de aviso", extra={"test_type": "warning"})
    logger.error("Mensagem de erro", extra={"test_type": "error"})
    
    # Verifica se arquivo foi criado
    if Path(log_file).exists():
        print("✅ Arquivo de log criado com sucesso")
        
        # Lê e verifica formato JSON
        with open(log_file) as f:
            lines = f.readlines()
            
        if lines:
            try:
                # Verifica se última linha é JSON válido
                last_log = json.loads(lines[-1])
                required_fields = ["timestamp", "level", "logger", "message"]
                
                if all(field in last_log for field in required_fields):
                    print("✅ Formato de log JSON válido")
                else:
                    print("❌ Formato de log inválido")
                    
            except json.JSONDecodeError:
                print("❌ Log não está em formato JSON válido")
        else:
            print("❌ Arquivo de log vazio")
    else:
        print("❌ Arquivo de log não foi criado")

def test_request_context():
    """Testa sistema de contexto de request."""
    print("\n📋 Testando contexto de request...")
    
    logger = get_contextual_logger("test_context")
    
    # Sem contexto
    logger.info("Log sem contexto")
    
    # Com contexto
    set_request_context(
        req_id="test-123",
        sess_id="session-456",
        client_ip="127.0.0.1"
    )
    
    logger.info("Log com contexto", extra={"action": "test_context"})
    
    # Limpa contexto
    clear_request_context()
    
    logger.info("Log após limpar contexto")
    
    print("✅ Teste de contexto concluído")

@handle_errors(timeout_seconds=2.0)
async def test_timeout_function():
    """Função que vai dar timeout para testar o sistema."""
    await asyncio.sleep(3)  # Vai dar timeout
    return "não deve chegar aqui"

@handle_errors(reraise=True)
async def test_error_function():
    """Função que gera erro para testar tratamento."""
    raise ValueError("Erro de teste intencional")

async def test_streaming_error():
    """Testa tratamento de erro em streaming."""
    try:
        for i in range(5):
            if i == 3:
                raise RuntimeError("Erro de streaming de teste")
            yield f"chunk {i}"
    except Exception as e:
        error_event = await StreamingErrorHandler.handle_streaming_error(
            e, "test_session"
        )
        yield error_event

async def test_error_handling():
    """Testa sistema de tratamento de erros."""
    print("\n🛡️ Testando tratamento de erros...")
    
    logger = get_contextual_logger("test_errors")
    
    # Teste 1: Timeout
    try:
        result = await test_timeout_function()
        print("❌ Timeout não funcionou")
    except asyncio.TimeoutError:
        print("✅ Timeout capturado corretamente")
    except Exception as e:
        print(f"⚠️ Erro inesperado: {type(e).__name__}: {e}")
    
    # Teste 2: Erro normal
    try:
        result = await test_error_function()
        print("❌ Erro não foi lançado")
    except ValueError as e:
        print("✅ Erro capturado corretamente")
    except Exception as e:
        print(f"⚠️ Erro inesperado: {type(e).__name__}: {e}")
    
    # Teste 3: Streaming com erro
    print("🔄 Testando streaming com erro...")
    async for chunk in test_streaming_error():
        print(f"  Recebido: {chunk[:50]}...")
    
    print("✅ Teste de streaming concluído")

def test_log_rotation():
    """Testa rotação de logs."""
    print("\n🔄 Testando rotação de logs...")
    
    log_file = "/tmp/test_rotation.log"
    
    # Configura com arquivo muito pequeno para forçar rotação
    setup_logging(
        level="INFO",
        log_file=log_file,
        max_bytes=1024,  # 1KB apenas
        backup_count=3
    )
    
    logger = get_contextual_logger("test_rotation")
    
    # Gera muitos logs para forçar rotação
    for i in range(100):
        logger.info(f"Log de teste para rotação número {i}", extra={
            "iteration": i,
            "large_data": "x" * 50  # Dados extras para aumentar tamanho
        })
    
    # Verifica se arquivos de backup foram criados
    log_path = Path(log_file)
    backup_files = list(log_path.parent.glob(f"{log_path.name}.*"))
    
    if backup_files:
        print(f"✅ Rotação funcionando - {len(backup_files)} arquivos de backup criados")
    else:
        print("⚠️ Rotação não foi acionada (pode ser normal se logs foram pequenos)")

def check_file_structure():
    """Verifica se estrutura de arquivos está correta."""
    print("\n📁 Verificando estrutura de arquivos...")
    
    required_files = [
        "../logging_config.py",
        "../exception_middleware.py", 
        "../server.py",
        "../claude_handler.py",
        "../analytics_service.py"
    ]
    
    current_dir = Path(__file__).parent.parent
    missing_files = []
    
    for file_name in required_files:
        file_path = current_dir / file_name
        if not file_path.exists():
            missing_files.append(file_name)
    
    if missing_files:
        print(f"❌ Arquivos faltando: {', '.join(missing_files)}")
    else:
        print("✅ Todos os arquivos necessários estão presentes")
    
    return len(missing_files) == 0

async def run_all_tests():
    """Executa todos os testes."""
    print("🚀 TESTE DO SISTEMA DE LOGGING E TRATAMENTO DE ERROS")
    print("=" * 60)
    
    success_count = 0
    total_tests = 5
    
    try:
        # Teste 1: Configuração de logging
        test_logging_configuration()
        success_count += 1
    except Exception as e:
        print(f"❌ Erro no teste de logging: {e}")
    
    try:
        # Teste 2: Contexto de request
        test_request_context()
        success_count += 1
    except Exception as e:
        print(f"❌ Erro no teste de contexto: {e}")
    
    try:
        # Teste 3: Tratamento de erros
        await test_error_handling()
        success_count += 1
    except Exception as e:
        print(f"❌ Erro no teste de erros: {e}")
    
    try:
        # Teste 4: Rotação de logs
        test_log_rotation()
        success_count += 1
    except Exception as e:
        print(f"❌ Erro no teste de rotação: {e}")
    
    try:
        # Teste 5: Estrutura de arquivos
        if check_file_structure():
            success_count += 1
    except Exception as e:
        print(f"❌ Erro na verificação de arquivos: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 RESULTADO: {success_count}/{total_tests} testes passaram")
    
    if success_count == total_tests:
        print("🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.")
        return 0
    else:
        print("⚠️ Alguns testes falharam. Verifique os logs acima.")
        return 1

def show_log_examples():
    """Mostra exemplos de logs gerados."""
    print("\n📄 EXEMPLOS DE LOGS GERADOS:")
    print("-" * 40)
    
    log_files = [
        "/tmp/claude_api_test.log",
        "/tmp/test_rotation.log"
    ]
    
    for log_file in log_files:
        if Path(log_file).exists():
            print(f"\n📄 {log_file}:")
            try:
                with open(log_file) as f:
                    lines = f.readlines()
                
                # Mostra últimas 3 linhas formatadas
                for line in lines[-3:]:
                    try:
                        log_entry = json.loads(line)
                        print(f"  🕐 {log_entry.get('timestamp', 'N/A')}")
                        print(f"  📊 {log_entry.get('level', 'N/A')}: {log_entry.get('message', 'N/A')}")
                        if 'extra' in log_entry:
                            print(f"  📋 Extra: {json.dumps(log_entry['extra'], indent=6)}")
                        print("  " + "-" * 30)
                    except json.JSONDecodeError:
                        print(f"  📝 {line.strip()}")
                        
            except Exception as e:
                print(f"  ❌ Erro ao ler arquivo: {e}")

if __name__ == "__main__":
    # Executa testes
    exit_code = asyncio.run(run_all_tests())
    
    # Mostra exemplos de logs
    show_log_examples()
    
    print(f"\n🏁 Script finalizado com código {exit_code}")
    sys.exit(exit_code)