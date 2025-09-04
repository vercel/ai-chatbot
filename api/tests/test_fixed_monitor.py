#!/usr/bin/env python3
"""
Script de teste para verificar se o monitor de Session ID Fixo está funcionando.
Cria arquivos com IDs diferentes e verifica se são consolidados.
"""

import json
import time
import uuid
from pathlib import Path
from datetime import datetime

# Diretório de sessões
SESSIONS_DIR = Path.home() / ".claude" / "projects" / "-home-suthub--claude-api-claude-code-app-cc-sdk-chat-api"
FIXED_SESSION_ID = "chat-session-main"
FIXED_FILE = SESSIONS_DIR / f"{FIXED_SESSION_ID}.jsonl"

def create_test_file(message_content: str):
    """Cria um arquivo de teste com session ID aleatório."""
    random_session_id = str(uuid.uuid4())
    test_file = SESSIONS_DIR / f"{random_session_id}.jsonl"
    
    # Cria mensagem de teste
    test_data = {
        "type": "user",
        "sessionId": random_session_id,
        "message": {
            "role": "user",
            "content": message_content
        },
        "timestamp": datetime.now().isoformat()
    }
    
    # Escreve no arquivo
    with open(test_file, 'w') as f:
        f.write(json.dumps(test_data) + '\n')
    
    print(f"📝 Criado arquivo de teste: {test_file.name}")
    return test_file

def count_messages_in_fixed_file():
    """Conta mensagens no arquivo fixo."""
    if not FIXED_FILE.exists():
        return 0
    
    with open(FIXED_FILE, 'r') as f:
        return sum(1 for _ in f)

def main():
    print("=" * 60)
    print("🧪 TESTE DO MONITOR DE SESSION ID FIXO")
    print("=" * 60)
    
    # Conta mensagens iniciais
    initial_count = count_messages_in_fixed_file()
    print(f"📊 Mensagens iniciais no arquivo fixo: {initial_count}")
    print("-" * 60)
    
    # Cria 3 arquivos de teste
    test_messages = [
        "Teste 1: Primeira mensagem",
        "Teste 2: Segunda mensagem",
        "Teste 3: Terceira mensagem"
    ]
    
    created_files = []
    for i, msg in enumerate(test_messages, 1):
        print(f"\n🔄 Teste {i}/3:")
        
        # Cria arquivo
        test_file = create_test_file(msg)
        created_files.append(test_file.name)
        
        # Aguarda monitor processar (100ms + margem)
        print("  ⏳ Aguardando monitor processar...")
        time.sleep(0.5)
        
        # Verifica se arquivo foi removido
        if not test_file.exists():
            print(f"  ✅ Arquivo removido pelo monitor!")
        else:
            print(f"  ⚠️ Arquivo ainda existe (monitor pode estar lento)")
        
        # Conta mensagens no arquivo fixo
        current_count = count_messages_in_fixed_file()
        print(f"  📊 Mensagens no arquivo fixo: {current_count}")
    
    # Resultado final
    print("\n" + "=" * 60)
    print("📊 RESULTADO DO TESTE")
    print("-" * 60)
    
    final_count = count_messages_in_fixed_file()
    messages_added = final_count - initial_count
    
    print(f"📝 Arquivos criados: {len(test_messages)}")
    print(f"💬 Mensagens adicionadas: {messages_added}")
    print(f"📊 Total de mensagens no arquivo fixo: {final_count}")
    
    # Verifica sucesso
    if messages_added == len(test_messages):
        print("\n✅ TESTE PASSOU! Todos os arquivos foram consolidados!")
    else:
        print(f"\n⚠️ TESTE FALHOU! Esperado {len(test_messages)}, mas apenas {messages_added} foram consolidadas")
    
    # Lista arquivos restantes
    remaining_files = list(SESSIONS_DIR.glob("*.jsonl"))
    print(f"\n📁 Arquivos restantes no diretório: {len(remaining_files)}")
    for f in remaining_files:
        print(f"  - {f.name}")
    
    print("=" * 60)

if __name__ == "__main__":
    main()