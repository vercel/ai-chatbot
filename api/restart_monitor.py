#!/usr/bin/env python3
"""
Script para reiniciar o monitor com o UUID correto.
Mata qualquer processo antigo e inicia com o UUID válido.
"""

import os
import sys
import signal
import subprocess
from pathlib import Path

# UUID VÁLIDO - CRÍTICO!
FIXED_UUID = "00000000-0000-0000-0000-000000000001"

def kill_old_monitors():
    """Mata qualquer monitor rodando com ID antigo."""
    try:
        # Procura por processos do monitor
        result = subprocess.run(
            ["ps", "aux"], 
            capture_output=True, 
            text=True
        )
        
        for line in result.stdout.split('\n'):
            if 'fixed_session_monitor.py' in line or 'chat-session-main' in line:
                parts = line.split()
                if len(parts) > 1:
                    pid = parts[1]
                    print(f"🔫 Matando processo antigo: PID {pid}")
                    os.kill(int(pid), signal.SIGTERM)
    except Exception as e:
        print(f"⚠️ Erro ao matar processos: {e}")

def cleanup_old_files():
    """Remove arquivo com ID antigo e renomeia se necessário."""
    sessions_dir = Path.home() / ".claude" / "projects" / "-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api"
    
    # Remove arquivo com ID antigo
    old_file = sessions_dir / "chat-session-main.jsonl"
    if old_file.exists():
        print(f"🗑️ Removendo arquivo antigo: {old_file.name}")
        old_file.unlink()
    
    # Garante que o arquivo com UUID correto existe
    correct_file = sessions_dir / f"{FIXED_UUID}.jsonl"
    if not correct_file.exists():
        correct_file.touch()
        print(f"✅ Criado arquivo correto: {correct_file.name}")

def start_new_monitor():
    """Inicia o monitor com o UUID correto."""
    print(f"\n🚀 Iniciando monitor com UUID: {FIXED_UUID}")
    
    # Importa e configura o monitor
    from fixed_session_monitor import FixedSessionMonitor
    
    # FORÇA o UUID correto
    FixedSessionMonitor.FIXED_SESSION_ID = FIXED_UUID
    
    monitor = FixedSessionMonitor()
    monitor.start()
    
    print("✅ Monitor reiniciado com sucesso!")
    print(f"📌 UUID Fixo: {FIXED_UUID}")
    print(f"📄 Arquivo Principal: {FIXED_UUID}.jsonl")
    
    return monitor

if __name__ == "__main__":
    print("="*60)
    print("🔄 REINICIANDO MONITOR COM UUID CORRETO")
    print("="*60)
    
    # 1. Mata processos antigos
    print("\n1️⃣ Matando processos antigos...")
    kill_old_monitors()
    
    # 2. Limpa arquivos
    print("\n2️⃣ Limpando arquivos...")
    cleanup_old_files()
    
    # 3. Inicia novo monitor
    print("\n3️⃣ Iniciando novo monitor...")
    monitor = start_new_monitor()
    
    print("\n" + "="*60)
    print("✅ TUDO PRONTO!")
    print("="*60)
    print(f"UUID Válido configurado: {FIXED_UUID}")
    print("Teste agora enviando uma mensagem no chat!")
    
    # Mantém rodando
    try:
        import time
        while True:
            time.sleep(10)
            status = monitor.get_status()
            if status['files_intercepted'] > 0:
                print(f"📊 {status['files_intercepted']} arquivos consolidados")
    except KeyboardInterrupt:
        print("\n👋 Encerrando...")
        monitor.stop()