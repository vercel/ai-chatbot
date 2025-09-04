#!/usr/bin/env python3
"""
Monitor de Sessão em Tempo Real - Baseado na solução do usuário
Garante que TODAS as mensagens fiquem no MESMO arquivo, movendo conteúdo em tempo real.
"""

import os
import time
import json
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, Set, Optional
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('RealTimeMonitor')

class RealTimeSessionMonitor:
    """
    Monitor que força todas as mensagens para um único arquivo por sessão.
    Baseado na solução do usuário - simples e eficaz.
    """
    
    def __init__(self, project_name: str = "-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api"):
        """
        Inicializa o monitor.
        
        Args:
            project_name: Nome do projeto no diretório .claude/projects
        """
        self.project_name = project_name
        self.sessions_dir = Path.home() / ".claude" / "projects" / project_name
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        # Mapeamento de sessões web para arquivos principais
        self.session_files: Dict[str, Path] = {}
        
        # Controle do monitor
        self.running = False
        self.monitor_thread = None
        self.processed_files: Set[str] = set()
        
        # Estatísticas
        self.files_intercepted = 0
        self.messages_consolidated = 0
        
        logger.info(f"Monitor inicializado para: {self.sessions_dir}")
    
    def get_or_create_session_file(self, session_hint: Optional[str] = None) -> Path:
        """
        Obtém ou cria o arquivo principal para uma sessão.
        """
        # Se não há arquivo principal ainda, cria um
        existing_files = list(self.sessions_dir.glob("*.jsonl"))
        
        if not existing_files:
            # Cria novo arquivo
            import uuid
            session_id = str(uuid.uuid4())
            file_path = self.sessions_dir / f"{session_id}.jsonl"
            file_path.touch()
            logger.info(f"Criado novo arquivo principal: {file_path.name}")
            return file_path
        
        # Usa o arquivo mais recente ou maior como principal
        main_file = max(existing_files, key=lambda f: (f.stat().st_size, f.stat().st_mtime))
        return main_file
    
    def monitor_loop(self):
        """
        Loop principal - monitora e consolida arquivos continuamente.
        Baseado na solução do usuário - silencioso e eficiente.
        """
        logger.info("Monitor iniciado - consolidando arquivos em tempo real")
        
        # Determina arquivo principal
        main_file = self.get_or_create_session_file()
        logger.info(f"Arquivo principal: {main_file.name}")
        
        while self.running:
            try:
                # Lista todos os arquivos JSONL
                for file_path in self.sessions_dir.glob("*.jsonl"):
                    # Se NÃO é o arquivo principal
                    if file_path != main_file:
                        # Verifica se é arquivo novo (não processado)
                        file_key = f"{file_path.name}_{file_path.stat().st_mtime}"
                        
                        if file_key not in self.processed_files:
                            # Aguarda arquivo ser escrito completamente
                            time.sleep(0.1)
                            
                            # Consolida conteúdo
                            if self.consolidate_file(file_path, main_file):
                                self.processed_files.add(file_key)
                                self.files_intercepted += 1
                
                # Verifica a cada 100ms (como na solução do usuário)
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Erro no monitor: {e}")
                time.sleep(1)
    
    def consolidate_file(self, source_file: Path, target_file: Path) -> bool:
        """
        Move conteúdo de um arquivo para outro.
        Retorna True se conseguiu consolidar e remover o arquivo fonte.
        """
        try:
            if not source_file.exists():
                return False
            
            # Lê conteúdo do arquivo fonte
            lines_to_add = []
            with open(source_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            # Valida JSON
                            data = json.loads(line)
                            
                            # Ajusta session_id para o arquivo principal
                            target_session_id = target_file.stem
                            if 'sessionId' in data:
                                data['sessionId'] = target_session_id
                            if 'session_id' in data:
                                data['session_id'] = target_session_id
                            
                            lines_to_add.append(json.dumps(data))
                        except json.JSONDecodeError:
                            # Mantém linha original se não for JSON válido
                            lines_to_add.append(line)
            
            # Adiciona ao arquivo principal
            if lines_to_add:
                with open(target_file, 'a') as f:
                    for line in lines_to_add:
                        f.write(line + '\n')
                
                self.messages_consolidated += len(lines_to_add)
                logger.debug(f"Consolidado: {len(lines_to_add)} linhas de {source_file.name}")
            
            # Remove arquivo fonte (como na solução do usuário)
            try:
                source_file.unlink()
                logger.debug(f"Removido: {source_file.name}")
                return True
            except:
                # Tenta novamente após pequena pausa
                time.sleep(0.2)
                try:
                    source_file.unlink()
                    return True
                except:
                    logger.warning(f"Não foi possível remover: {source_file.name}")
                    return False
            
        except Exception as e:
            logger.error(f"Erro ao consolidar {source_file.name}: {e}")
            return False
    
    def start(self):
        """
        Inicia o monitor em thread separada (como na solução do usuário).
        """
        if self.running:
            logger.warning("Monitor já está rodando")
            return
        
        self.running = True
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        logger.info("✅ Monitor de sessão em tempo real ativado")
    
    def stop(self):
        """
        Para o monitor.
        """
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        
        logger.info(f"Monitor parado - {self.files_intercepted} arquivos interceptados, {self.messages_consolidated} mensagens consolidadas")
    
    def get_stats(self) -> dict:
        """
        Retorna estatísticas do monitor.
        """
        return {
            "running": self.running,
            "files_intercepted": self.files_intercepted,
            "messages_consolidated": self.messages_consolidated,
            "sessions_dir": str(self.sessions_dir),
            "total_files": len(list(self.sessions_dir.glob("*.jsonl")))
        }


def integrate_with_server():
    """
    Função para integração fácil com o servidor.
    """
    monitor = RealTimeSessionMonitor()
    monitor.start()
    return monitor


def test_monitor():
    """
    Testa o monitor criando arquivos simulados.
    """
    import uuid
    
    print("🧪 Testando monitor em tempo real...")
    
    monitor = RealTimeSessionMonitor()
    monitor.start()
    
    # Cria arquivo de teste
    test_file = monitor.sessions_dir / f"{uuid.uuid4()}.jsonl"
    test_data = {
        "type": "user",
        "message": {"role": "user", "content": "Teste do monitor"},
        "timestamp": datetime.now().isoformat()
    }
    
    print(f"📝 Criando arquivo de teste: {test_file.name}")
    with open(test_file, 'w') as f:
        f.write(json.dumps(test_data) + '\n')
    
    # Aguarda monitor processar
    time.sleep(1)
    
    # Verifica resultado
    if not test_file.exists():
        print("✅ Monitor funcionou! Arquivo foi consolidado e removido")
    else:
        print("❌ Arquivo ainda existe - monitor pode não estar funcionando")
    
    # Mostra estatísticas
    stats = monitor.get_stats()
    print(f"📊 Estatísticas: {stats}")
    
    monitor.stop()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Monitor de Sessão em Tempo Real - Baseado na solução do usuário"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Executa teste do monitor"
    )
    parser.add_argument(
        "--standalone",
        action="store_true",
        help="Executa monitor em modo standalone"
    )
    
    args = parser.parse_args()
    
    if args.test:
        test_monitor()
    elif args.standalone:
        print("="*60)
        print("🔧 MONITOR DE SESSÃO EM TEMPO REAL")
        print("="*60)
        print("Baseado na solução do usuário - simples e eficaz!")
        print("-"*60)
        
        monitor = RealTimeSessionMonitor()
        monitor.start()
        
        try:
            print("👁️ Monitor rodando... (Ctrl+C para parar)")
            while True:
                time.sleep(10)
                stats = monitor.get_stats()
                print(f"📊 Status: {stats['files_intercepted']} arquivos interceptados, {stats['messages_consolidated']} mensagens consolidadas")
        except KeyboardInterrupt:
            print("\n👋 Encerrando...")
        finally:
            monitor.stop()
    else:
        print("Use --test para testar ou --standalone para rodar o monitor")