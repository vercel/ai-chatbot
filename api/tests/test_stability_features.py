#!/usr/bin/env python3
"""
Script de teste para demonstrar as funcionalidades de estabilidade da API Claude SDK.
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8989"

async def test_endpoint(session: aiohttp.ClientSession, endpoint: str, method: str = "GET", data: Dict = None) -> Dict[str, Any]:
    """Testa um endpoint da API."""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method == "GET":
            async with session.get(url) as response:
                result = await response.json()
        elif method == "POST":
            async with session.post(url, json=data) as response:
                result = await response.json()
        else:
            raise ValueError(f"Método {method} não suportado")
        
        return {
            "endpoint": endpoint,
            "status": "success",
            "status_code": response.status,
            "data": result
        }
        
    except Exception as e:
        return {
            "endpoint": endpoint,
            "status": "error",
            "error": str(e)
        }

async def main():
    """Função principal de teste."""
    print("🔧 Testando Funcionalidades de Estabilidade da API Claude SDK")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        
        # 1. Health Check Básico
        print("\n1. 🏥 Health Check Básico")
        result = await test_endpoint(session, "/")
        print(f"Status: {result['status']}")
        if result['status'] == 'success':
            print(f"API Status: {result['data'].get('status', 'unknown')}")
        
        # 2. Health Check Detalhado  
        print("\n2. 🔍 Health Check Detalhado")
        result = await test_endpoint(session, "/health/detailed")
        if result['status'] == 'success':
            data = result['data']
            print(f"Status Geral: {data.get('status', 'unknown')}")
            print(f"Sessões Ativas: {data.get('sessions', {}).get('active_count', 0)}")
            print(f"Uso de Memória: {data.get('system', {}).get('memory', {}).get('usage_percent', 0)}%")
            print(f"Circuit Breakers: {len(data.get('stability', {}).get('circuit_breakers', {}))}")
            print(f"Operações com Fallbacks: {len(data.get('fallback_stats', {}).get('operations', {}))}")
        
        # 3. Métricas Básicas
        print("\n3. 📊 Métricas Básicas")
        result = await test_endpoint(session, "/metrics")
        if result['status'] == 'success':
            data = result['data']
            print(f"Total de Requests: {data.get('requests_total', 0)}")
            print(f"Requests em Progresso: {data.get('requests_in_progress', 0)}")
            print(f"Total de Erros: {data.get('errors_total', 0)}")
            print(f"Fallbacks Usados: {data.get('fallbacks_used', 0)}")
            print(f"Circuit Breakers Abertos: {data.get('circuit_breakers_open', 0)}")
            print(f"Uso de CPU: {data.get('cpu_usage_percent', 0)}%")
        
        # 4. Status de Estabilidade
        print("\n4. ⚡ Status de Estabilidade")
        result = await test_endpoint(session, "/health/stability")
        if result['status'] == 'success':
            data = result['data']
            summary = data.get('summary', {})
            print(f"Circuit Breakers Total: {summary.get('total_circuit_breakers', 0)}")
            print(f"Circuit Breakers Abertos: {summary.get('open_circuit_breakers', 0)}")
            print(f"Operações com Fallbacks: {summary.get('total_operations_with_fallbacks', 0)}")
            print(f"Fallbacks Usados: {summary.get('total_fallbacks_used', 0)}")
            
            # Mostra status individual dos circuit breakers
            circuit_breakers = data.get('circuit_breakers', {})
            for name, cb_data in circuit_breakers.items():
                state = cb_data.get('state', 'unknown')
                failures = cb_data.get('failure_count', 0)
                print(f"  • {name}: {state} (falhas: {failures})")
        
        # 5. Heartbeat
        print("\n5. 💓 Heartbeat")
        result = await test_endpoint(session, "/heartbeat")
        if result['status'] == 'success':
            data = result['data']
            print(f"Alive: {data.get('alive', False)}")
            print(f"Uptime: {data.get('uptime', 0):.1f}s")
        
        # 6. Teste de Cache de Fallbacks
        print("\n6. 🧹 Limpeza de Cache de Fallbacks")
        result = await test_endpoint(session, "/health/fallback-cache/clear", "POST")
        if result['status'] == 'success':
            data = result['data']
            print(f"Status: {data.get('status', 'unknown')}")
            print(f"Items Removidos: {data.get('items_cleared', 0)}")
        
        # 7. Teste de Reset de Circuit Breaker
        print("\n7. 🔄 Reset de Circuit Breaker")
        result = await test_endpoint(session, "/health/circuit-breaker/claude_sdk/reset", "POST")
        if result['status'] == 'success':
            data = result['data']
            print(f"Circuit Breaker: {data.get('circuit_breaker', 'unknown')}")
            print(f"Status: {data.get('status', 'unknown')}")
            print(f"Novo Estado: {data.get('new_state', 'unknown')}")
        elif result['status'] == 'error' and "não encontrado" in result.get('error', ''):
            print("Circuit breaker 'claude_sdk' não encontrado (normal se API não inicializou)")
        
        # 8. Simulação de Erro para Testar Fallbacks
        print("\n8. 🧪 Teste de Chat (pode usar fallbacks)")
        chat_data = {
            "message": "Olá! Este é um teste das funcionalidades de estabilidade.",
            "session_id": None  # Força criação de nova sessão
        }
        
        # Nota: Este endpoint retorna SSE, então tratamos diferente
        try:
            async with session.post(f"{BASE_URL}/api/chat", json=chat_data) as response:
                if response.status == 200:
                    print("Chat SSE iniciado com sucesso")
                    print(f"Content-Type: {response.headers.get('Content-Type', 'unknown')}")
                else:
                    print(f"Erro no chat: {response.status}")
        except Exception as e:
            print(f"Erro no teste de chat: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Teste das funcionalidades de estabilidade concluído!")
    print("\nPara monitoramento contínuo, você pode usar:")
    print("- curl http://localhost:8989/health/detailed")
    print("- curl http://localhost:8989/metrics")
    print("- curl http://localhost:8989/health/stability")

if __name__ == "__main__":
    print("Certifique-se de que a API está rodando em http://localhost:8989")
    print("Para iniciar a API: python server.py")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro durante teste: {e}")