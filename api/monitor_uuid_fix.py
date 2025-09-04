#!/usr/bin/env python3
"""
Monitor independente com UUID válido fixo.
Solução definitiva para o problema do session ID.
"""

import os
import sys
import time
import json
import threading
from pathlib import Path
from datetime import datetime

# CONFIGURAÇÃO CRÍTICA - UUID VÁLIDO
FIXED_UUID = "00000000-0000-0000-0000-000000000001"
PROJECT_NAME = "-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api"
SESSIONS_DIR = Path.home() / ".claude" / "projects" / PROJECT_NAME

def ensure_directory():
    """Garante que o diretório existe."""
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📂 Diretório: {SESSIONS_DIR}")

def consolidate_files():
    """Consolida todos os arquivos para o arquivo com UUID fixo."""
    main_file = SESSIONS_DIR / f"{FIXED_UUID}.jsonl"
    
    # Garante que o arquivo principal existe
    if not main_file.exists():
        main_file.touch()
        print(f"✅ Criado arquivo principal: {main_file.name}")
    
    consolidated_count = 0
    
    # Processa todos os outros arquivos
    for file_path in SESSIONS_DIR.glob("*.jsonl"):
        if file_path.name != f"{FIXED_UUID}.jsonl":
            print(f"\n🔄 Processando: {file_path.name}")
            
            try:
                # Lê conteúdo
                lines_to_add = []
                with open(file_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                data = json.loads(line)
                                # Força o UUID correto
                                if 'sessionId' in data:
                                    data['sessionId'] = FIXED_UUID
                                if 'session_id' in data:
                                    data['session_id'] = FIXED_UUID
                                lines_to_add.append(json.dumps(data))
                            except:
                                lines_to_add.append(line)
                
                # Adiciona ao arquivo principal
                if lines_to_add:
                    with open(main_file, 'a') as f:
                        for line in lines_to_add:
                            f.write(line + '\n')
                    print(f"  ✅ {len(lines_to_add)} mensagens consolidadas")
                    consolidated_count += len(lines_to_add)
                
                # Remove arquivo processado
                file_path.unlink()
                print(f"  🗑️ Arquivo removido")
                
            except Exception as e:
                print(f"  ❌ Erro: {e}")
    
    return consolidated_count

def monitor_loop():
    """Loop principal do monitor."""
    print(f"\n👁️ Monitor ativo - UUID: {FIXED_UUID}")
    
    while True:
        try:
            # Consolida arquivos a cada 100ms
            count = consolidate_files()
            if count > 0:
                print(f"💬 Total consolidado: {count} mensagens")
            
            time.sleep(0.1)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Erro no monitor: {e}")
            time.sleep(1)

def main():
    print("="*60)
    print("🎯 MONITOR COM UUID VÁLIDO")
    print("="*60)
    print(f"UUID Fixo: {FIXED_UUID}")
    print("-"*60)
    
    # Prepara diretório
    ensure_directory()
    
    # Faz consolidação inicial
    print("\n🧹 Consolidação inicial...")
    initial_count = consolidate_files()
    if initial_count > 0:
        print(f"✅ {initial_count} mensagens consolidadas inicialmente")
    
    # Inicia monitoramento
    try:
        monitor_loop()
    except KeyboardInterrupt:
        print("\n\n👋 Monitor encerrado")
        
    # Mostra estatísticas finais
    main_file = SESSIONS_DIR / f"{FIXED_UUID}.jsonl"
    if main_file.exists():
        with open(main_file, 'r') as f:
            total = sum(1 for _ in f)
        print(f"\n📊 Total de mensagens no arquivo principal: {total}")

if __name__ == "__main__":
    main()