#!/usr/bin/env python3
"""
Benchmark de performance para Claude SDK.
Testa velocidade de queries e identifica bottlenecks.
"""

import asyncio
import time
import sys
from pathlib import Path

# Adiciona src ao path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

async def benchmark_query_performance():
    """Benchmark basic query performance."""
    try:
        from src import query
        
        print("🚀 BENCHMARK CLAUDE SDK")
        print("=" * 30)
        
        # Test 1: Single query timing
        print("\n📊 Single Query Test:")
        start_time = time.time()
        
        async for response in query(prompt="What is 2+2?"):
            if hasattr(response, 'content'):
                first_response_time = time.time() - start_time
                print(f"⏱️  First response: {first_response_time:.3f}s")
                break
        
        total_time = time.time() - start_time
        print(f"⏱️  Total time: {total_time:.3f}s")
        
        # Test 2: Multiple queries
        print("\n📊 Multiple Queries Test:")
        start_time = time.time()
        
        queries = ["What is 1+1?", "What is 2+2?", "What is 3+3?"]
        for i, q in enumerate(queries):
            query_start = time.time()
            async for response in query(prompt=q):
                if hasattr(response, 'content'):
                    query_time = time.time() - query_start
                    print(f"   Query {i+1}: {query_time:.3f}s")
                    break
        
        total_multiple = time.time() - start_time
        avg_time = total_multiple / len(queries)
        print(f"📈 Average per query: {avg_time:.3f}s")
        
        return {
            "single_query": total_time,
            "average_query": avg_time,
            "queries_per_minute": 60 / avg_time
        }
        
    except ImportError as e:
        print(f"❌ SDK import failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Benchmark failed: {e}")
        return None

async def benchmark_client_performance():
    """Benchmark client-based performance."""
    try:
        from src import ClaudeSDKClient
        
        print("\n🤖 CLIENT BENCHMARK")
        print("=" * 30)
        
        client = ClaudeSDKClient()
        
        # Connection timing
        start_time = time.time()
        await client.connect()
        connect_time = time.time() - start_time
        print(f"🔌 Connection time: {connect_time:.3f}s")
        
        try:
            # Query timing with client
            start_time = time.time()
            await client.query("Hello Claude!")
            
            async for message in client.receive_response():
                if hasattr(message, 'content'):
                    response_time = time.time() - start_time
                    print(f"💬 Client response: {response_time:.3f}s")
                    break
                    
        finally:
            await client.disconnect()
            
        return {
            "connection_time": connect_time,
            "client_response_time": response_time
        }
        
    except Exception as e:
        print(f"❌ Client benchmark failed: {e}")
        return None

def main():
    """Execute benchmarks completos."""
    print("⚡ PERFORMANCE BENCHMARK CLAUDE SDK")
    print("=" * 45)
    
    # Run benchmarks
    query_results = asyncio.run(benchmark_query_performance())
    client_results = asyncio.run(benchmark_client_performance())
    
    # Summary report
    print("\n📊 RELATÓRIO FINAL")
    print("=" * 45)
    
    if query_results:
        print(f"📈 Queries por minuto: {query_results['queries_per_minute']:.1f}")
        
    if client_results:
        print(f"🔌 Tempo de conexão: {client_results['connection_time']:.3f}s")
        
    print("\n✅ Benchmark concluído!")

if __name__ == "__main__":
    main()