#!/usr/bin/env python3
"""Script de teste para verificar integração com Claude SDK."""

import asyncio
import aiohttp
import json

async def test_api():
    """Testa a API."""
    base_url = "http://localhost:8989"
    
    async with aiohttp.ClientSession() as session:
        # Criar nova sessão
        print("1. Criando nova sessão...")
        async with session.post(f"{base_url}/api/new-session") as resp:
            data = await resp.json()
            session_id = data["session_id"]
            print(f"   Sessão criada: {session_id}")
        
        # Enviar mensagem
        print("\n2. Enviando mensagem de teste...")
        message_data = {
            "message": "Olá! Responda apenas 'Oi, tudo bem!' sem mais nada.",
            "session_id": session_id
        }
        
        async with session.post(f"{base_url}/api/chat", json=message_data) as resp:
            print("   Resposta streaming:")
            async for line in resp.content:
                line = line.decode('utf-8').strip()
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        print(f"   - Tipo: {data.get('type')}, Conteúdo: {data.get('content', '')[:50]}")
                    except json.JSONDecodeError:
                        pass

if __name__ == "__main__":
    asyncio.run(test_api())