#!/usr/bin/env python3
"""
Exemplo básico de uso do Claude Code SDK Python.
Demonstra as duas formas principais de usar o SDK.
"""

import asyncio
import sys
from pathlib import Path

# Adiciona src ao path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src import AssistantMessage, TextBlock, ClaudeSDKClient, query

async def exemplo_query_simples():
    """Exemplo usando query() - para perguntas simples."""
    print("🚀 EXEMPLO 1: Query Simples")
    print("-" * 30)
    
    # Uma pergunta rápida
    async for message in query(prompt="Qual é a capital do Brasil?"):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"🤖 Claude: {block.text}")

async def exemplo_cliente_interativo():
    """Exemplo usando ClaudeSDKClient - para conversas."""
    print("\n💬 EXEMPLO 2: Cliente Interativo")
    print("-" * 30)
    
    client = ClaudeSDKClient()
    await client.connect()
    
    try:
        # Conversa com múltiplas mensagens
        perguntas = [
            "Olá! Como você está?",
            "Pode me ajudar com matemática?", 
            "Quanto é 15 * 23?"
        ]
        
        for pergunta in perguntas:
            print(f"\n👤 Você: {pergunta}")
            
            await client.query(pergunta)
            
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            print(f"🤖 Claude: {block.text}")
    
    finally:
        await client.disconnect()

async def exemplo_tratamento_erros():
    """Exemplo de tratamento de erros robusto."""
    print("\n🛡️ EXEMPLO 3: Tratamento de Erros")
    print("-" * 30)
    
    try:
        client = ClaudeSDKClient()
        await client.connect()
        
        await client.query("Teste de mensagem")
        
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(f"✅ Sucesso: {block.text[:50]}...")
                        break
        
    except Exception as e:
        print(f"❌ Erro capturado: {e}")
        print("💡 Verifique se Claude CLI está instalado")
        
    finally:
        try:
            await client.disconnect()
        except:
            pass  # Client pode não ter conectado

def main():
    """Execute todos os exemplos."""
    print("📚 EXEMPLOS CLAUDE CODE SDK PYTHON")
    print("=" * 50)
    
    # Executa exemplos sequencialmente
    asyncio.run(exemplo_query_simples())
    asyncio.run(exemplo_cliente_interativo()) 
    asyncio.run(exemplo_tratamento_erros())
    
    print("\n" + "=" * 50)
    print("✅ Todos os exemplos executados!")
    print("🎯 Para usar interativamente:")
    print("   cd ../wrappers_cli && ./claude")

if __name__ == "__main__":
    main()