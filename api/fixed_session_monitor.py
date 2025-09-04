#!/usr/bin/env python3
"""
Monitor de Sessão Fixa - Baseado na solução do usuário
FORÇA todos os arquivos para um único session ID fixo.

Esta é a solução definitiva para o problema de múltiplos arquivos.
"""

import os
import sys
import time
import json
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FixedSessionMonitor')

class FixedSessionMonitor:
    """
    Monitor que força TODOS os arquivos para um único session ID fixo.
    Baseado na solução fornecida pelo usuário - simples e definitiva.
    """
    
    # CONFIGURAÇÃO PRINCIPAL - SESSION ID FIXO (UUID válido)
    FIXED_SESSION_ID = "00000000-0000-0000-0000-000000000001"  # UUID fixo para TODAS as conversas
    
    def __init__(self, project_name: str = "-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api"):
        """
        Inicializa o monitor com session ID fixo.
        
        Args:
            project_name: Nome do projeto no diretório .claude/projects
        """
        self.project_name = project_name
        self.sessions_dir = Path.home() / ".claude" / "projects" / project_name
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        # ARQUIVO ÚNICO - todos os dados vão para cá
        self.fixed_file = self.sessions_dir / f"{self.FIXED_SESSION_ID}.jsonl"
        
        # Controle do monitor
        self.running = False
        self.monitor_thread = None
        
        # Estatísticas
        self.files_intercepted = 0
        self.messages_consolidated = 0
        self.intercepted_files = []
        
        # Garante que o arquivo principal existe
        if not self.fixed_file.exists():
            self.fixed_file.touch()
            logger.info(f"📄 Arquivo principal criado: {self.fixed_file.name}")
        
        logger.info(f"🎯 Monitor inicializado - Session ID Fixo: {self.FIXED_SESSION_ID}")
        logger.info(f"📂 Diretório monitorado: {self.sessions_dir}")
    
    def monitor_loop(self):
        """
        Loop principal - FORÇA todos os arquivos para o arquivo fixo.
        Baseado exatamente na solução do usuário.
        """
        logger.info(f"👁️ Monitor ativo - Consolidando tudo em: {self.fixed_file.name}")
        
        while self.running:
            try:
                # Lista todos os arquivos JSONL
                for file_path in self.sessions_dir.glob("*.jsonl"):
                    # Se NÃO é o arquivo fixo
                    if file_path.name != f"{self.FIXED_SESSION_ID}.jsonl":
                        # Processa arquivo indevido
                        self.consolidate_to_fixed_file(file_path)
                
                # Verifica a cada 100ms (como na solução do usuário)
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ Erro no monitor: {e}")
                time.sleep(1)
    
    def consolidate_to_fixed_file(self, source_file: Path):
        """
        Move conteúdo de qualquer arquivo para o arquivo fixo.
        Remove o arquivo fonte após consolidação.
        """
        try:
            # Lê conteúdo do arquivo indevido
            lines_to_add = []
            
            with open(source_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            # Valida e ajusta JSON
                            data = json.loads(line)
                            
                            # FORÇA o session_id para o ID fixo
                            if 'sessionId' in data:
                                data['sessionId'] = self.FIXED_SESSION_ID
                            if 'session_id' in data:
                                data['session_id'] = self.FIXED_SESSION_ID
                            
                            lines_to_add.append(json.dumps(data))
                        except json.JSONDecodeError:
                            # Se não for JSON válido, adiciona mesmo assim
                            lines_to_add.append(line)
            
            # Adiciona ao arquivo fixo
            if lines_to_add:
                with open(self.fixed_file, 'a') as f:
                    for line in lines_to_add:
                        f.write(line + '\n')
                
                self.messages_consolidated += len(lines_to_add)
                logger.debug(f"  ✅ {len(lines_to_add)} mensagens consolidadas de {source_file.name}")
            
            # Remove o arquivo indevido
            source_file.unlink()
            self.files_intercepted += 1
            self.intercepted_files.append(source_file.name)
            
            logger.debug(f"  🗑️ Arquivo removido: {source_file.name}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar {source_file.name}: {e}")
    
    def start(self):
        """
        Inicia o monitor em thread separada (como na solução do usuário).
        """
        if self.running:
            logger.warning("Monitor já está rodando")
            return
        
        # Faz uma limpeza inicial
        self.initial_cleanup()
        
        # Inicia monitoramento contínuo
        self.running = True
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        logger.info("=" * 60)
        logger.info("✅ MONITOR DE SESSÃO FIXA ATIVADO")
        logger.info(f"📌 Session ID Único: {self.FIXED_SESSION_ID}")
        logger.info(f"📄 Arquivo Principal: {self.fixed_file.name}")
        logger.info("=" * 60)
    
    def initial_cleanup(self):
        """
        Faz limpeza inicial consolidando todos os arquivos existentes.
        """
        logger.info("🧹 Fazendo limpeza inicial...")
        
        count = 0
        for file_path in self.sessions_dir.glob("*.jsonl"):
            if file_path.name != f"{self.FIXED_SESSION_ID}.jsonl":
                self.consolidate_to_fixed_file(file_path)
                count += 1
        
        if count > 0:
            logger.info(f"  ✅ {count} arquivos consolidados na inicialização")
    
    def stop(self):
        """
        Para o monitor.
        """
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        
        logger.info(f"\n📊 Estatísticas finais:")
        logger.info(f"  📁 Arquivos interceptados: {self.files_intercepted}")
        logger.info(f"  💬 Mensagens consolidadas: {self.messages_consolidated}")
        
        # Conta total de mensagens no arquivo fixo
        if self.fixed_file.exists():
            with open(self.fixed_file, 'r') as f:
                total = sum(1 for _ in f)
            logger.info(f"  📊 Total de mensagens no arquivo principal: {total}")
    
    def get_status(self) -> dict:
        """
        Retorna status atual do monitor.
        """
        total_messages = 0
        if self.fixed_file.exists():
            with open(self.fixed_file, 'r') as f:
                total_messages = sum(1 for _ in f)
        
        return {
            "running": self.running,
            "fixed_session_id": self.FIXED_SESSION_ID,
            "fixed_file": str(self.fixed_file),
            "files_intercepted": self.files_intercepted,
            "messages_consolidated": self.messages_consolidated,
            "total_messages": total_messages,
            "sessions_dir": str(self.sessions_dir)
        }


def integrate_with_server():
    """
    Função para integração fácil com o servidor.
    Inicia o monitor e retorna a instância.
    """
    monitor = FixedSessionMonitor()
    monitor.start()
    return monitor


def main():
    """
    Função principal para executar o monitor standalone.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Monitor de Sessão Fixa - Força todos os arquivos para um ID único"
    )
    parser.add_argument(
        "--project",
        default="-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api",
        help="Nome do projeto a monitorar"
    )
    parser.add_argument(
        "--session-id",
        default="chat-session-main",
        help="ID fixo da sessão (padrão: chat-session-main)"
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Apenas faz limpeza e sai"
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Mostra status e sai"
    )
    
    args = parser.parse_args()
    
    # Permite customizar o ID se necessário
    if args.session_id:
        FixedSessionMonitor.FIXED_SESSION_ID = args.session_id
    
    monitor = FixedSessionMonitor(args.project)
    
    if args.cleanup:
        print("🧹 Modo limpeza - Consolidando todos os arquivos...")
        monitor.initial_cleanup()
        status = monitor.get_status()
        print(f"✅ Limpeza concluída!")
        print(f"📊 Total de mensagens: {status['total_messages']}")
        
    elif args.status:
        status = monitor.get_status()
        print("\n📊 STATUS DO SISTEMA")
        print("-" * 40)
        print(f"📌 Session ID Fixo: {status['fixed_session_id']}")
        print(f"📄 Arquivo Principal: {status['fixed_file']}")
        print(f"💬 Total de Mensagens: {status['total_messages']}")
        print(f"📁 Arquivos Interceptados: {status['files_intercepted']}")
        
    else:
        print("=" * 70)
        print("🎯 MONITOR DE SESSÃO FIXA")
        print("=" * 70)
        print(f"Session ID Único: {FixedSessionMonitor.FIXED_SESSION_ID}")
        print("Todos os arquivos serão consolidados neste ID!")
        print("-" * 70)
        
        monitor.start()
        
        try:
            print("👁️ Monitor rodando... (Ctrl+C para parar)\n")
            
            while True:
                time.sleep(30)
                status = monitor.get_status()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Status:")
                print(f"  📁 Interceptados: {status['files_intercepted']} arquivos")
                print(f"  💬 Consolidadas: {status['messages_consolidated']} mensagens")
                print(f"  📊 Total no arquivo principal: {status['total_messages']} mensagens")
                
        except KeyboardInterrupt:
            print("\n👋 Encerrando...")
        finally:
            monitor.stop()


if __name__ == "__main__":
    main()