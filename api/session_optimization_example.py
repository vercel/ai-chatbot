"""
Exemplo de uso do sistema otimizado de gerenciamento de sessões.

Este exemplo demonstra como usar as funcionalidades avançadas implementadas:
- Pool de conexões
- Cleanup automático de sessões
- Métricas de uso
- Monitoramento de saúde
"""

import asyncio
import json
from datetime import datetime
from claude_handler import ClaudeHandler, SessionConfig


async def main():
    """Demonstra o uso do sistema otimizado."""
    
    # Inicializa handler otimizado
    print("🚀 Inicializando Claude Handler otimizado...")
    handler = ClaudeHandler()
    
    # Aguarda inicialização do scheduler
    await asyncio.sleep(1)
    
    print(f"📊 Status inicial do pool: {handler.get_pool_status()}")
    print(f"📋 Relatório de saúde: {json.dumps(handler.session_manager.get_session_health_report(), indent=2)}")
    
    try:
        # 1. Teste de múltiplas sessões
        print("\n=== 1. TESTE DE MÚLTIPLAS SESSÕES ===")
        sessions_to_test = []
        
        for i in range(5):
            session_id = f"test_session_{i}"
            sessions_to_test.append(session_id)
            
            # Cria sessão com configuração específica
            config = SessionConfig(
                system_prompt=f"Você é um assistente de teste {i}",
                max_turns=10
            )
            
            await handler.create_session(session_id, config)
            print(f"✅ Sessão criada: {session_id}")
        
        print(f"📊 Pool após criar sessões: {handler.get_pool_status()['pool_size']} conexões")
        
        # 2. Teste de envio de mensagens
        print("\n=== 2. TESTE DE ENVIO DE MENSAGENS ===")
        
        for session_id in sessions_to_test[:3]:  # Testa apenas 3 para economizar tempo
            print(f"📤 Enviando mensagem para {session_id}...")
            
            message_count = 0
            async for response in handler.send_message(session_id, "Olá! Como você está?"):
                if response['type'] == 'text_chunk':
                    message_count += 1
                elif response['type'] == 'result':
                    print(f"✅ Resposta completa para {session_id}: {message_count} chunks")
                    
                    # Mostra métricas da sessão
                    metrics = handler.session_manager.get_session_metrics(session_id)
                    if metrics:
                        print(f"  📊 Tokens: {metrics.total_tokens}, Mensagens: {metrics.message_count}")
                    break
        
        # 3. Teste de informações de sessão
        print("\n=== 3. INFORMAÇÕES DAS SESSÕES ===")
        
        all_sessions = await handler.get_all_sessions()
        print(f"📋 Total de sessões ativas: {len(all_sessions)}")
        
        for session_info in all_sessions[:2]:  # Mostra apenas 2 para não poluir
            print(f"📄 Sessão {session_info['session_id']}:")
            print(f"   - Tokens: {session_info['history']['total_tokens']}")
            print(f"   - Mensagens: {session_info['history']['message_count']}")
            print(f"   - Custo: ${session_info['history']['total_cost']:.4f}")
        
        # 4. Teste de relatório de saúde
        print("\n=== 4. RELATÓRIO DE SAÚDE DO SISTEMA ===")
        
        health_report = handler.session_manager.get_session_health_report()
        print("📊 Estatísticas do sistema:")
        print(f"   - Sessões ativas: {health_report['sessions']['active']}")
        print(f"   - Sessões recentes (5min): {health_report['sessions']['recent']}")
        print(f"   - Sessões antigas (>1h): {health_report['sessions']['old']}")
        print(f"   - Pool de conexões: {health_report['pool']['size']}/{health_report['pool']['max_size']}")
        print(f"   - Total de tokens processados: {health_report['totals']['tokens']}")
        print(f"   - Total de mensagens: {health_report['totals']['messages']}")
        print(f"   - Erros de conexão: {health_report['totals']['errors']}")
        
        # 5. Teste de limpeza manual
        print("\n=== 5. TESTE DE LIMPEZA MANUAL ===")
        
        print("🧹 Executando limpeza manual de sessões inativas...")
        inactive = await handler.session_manager.cleanup_inactive_sessions()
        print(f"🗑️ Sessões inativas removidas: {len(inactive)}")
        
        print("🔍 Detectando sessões órfãs...")
        orphans = await handler.session_manager.detect_orphaned_sessions()
        print(f"👻 Sessões órfãs detectadas: {len(orphans)}")
        
        # 6. Demonstração de pool de conexões
        print("\n=== 6. STATUS DO POOL DE CONEXÕES ===")
        
        pool_status = handler.get_pool_status()
        print(f"🔄 Pool de conexões:")
        print(f"   - Tamanho atual: {pool_status['pool_size']}")
        print(f"   - Conexões saudáveis: {pool_status['healthy_connections']}")
        print(f"   - Limite máximo: {pool_status['max_size']}")
        
        if pool_status['connections']:
            oldest_conn = min(pool_status['connections'], key=lambda x: x['created_at'])
            print(f"   - Conexão mais antiga: {oldest_conn['age_minutes']:.1f} minutos")
            most_used = max(pool_status['connections'], key=lambda x: x['use_count'])
            print(f"   - Mais utilizada: {most_used['use_count']} usos")
        
        # 7. Teste de destruição de sessões (retorno ao pool)
        print("\n=== 7. TESTE DE DESTRUIÇÃO DE SESSÕES ===")
        
        sessions_before = len(handler.clients)
        pool_before = handler.get_pool_status()['pool_size']
        
        # Destrói algumas sessões
        for session_id in sessions_to_test[:2]:
            await handler.destroy_session(session_id)
            print(f"🗑️ Sessão destruída: {session_id}")
        
        sessions_after = len(handler.clients)
        pool_after = handler.get_pool_status()['pool_size']
        
        print(f"📊 Sessões: {sessions_before} → {sessions_after}")
        print(f"📊 Pool: {pool_before} → {pool_after} (conexões possivelmente reutilizadas)")
        
    finally:
        # 8. Limpeza final
        print("\n=== 8. LIMPEZA FINAL ===")
        
        print("🧹 Executando limpeza completa...")
        await handler.session_manager.force_cleanup_all()
        
        print("🔌 Encerrando pool de conexões...")
        await handler.shutdown_pool()
        
        print("✅ Sistema encerrado com sucesso!")


async def demonstrate_advanced_features():
    """Demonstra funcionalidades avançadas específicas."""
    
    print("\n🔬 === DEMONSTRAÇÃO DE FUNCIONALIDADES AVANÇADAS ===")
    
    handler = ClaudeHandler()
    
    try:
        # Teste de limite de sessões
        print("\n1. 📏 Teste de limite de sessões...")
        
        # Tenta criar mais sessões que o limite
        max_sessions = handler.session_manager.MAX_SESSIONS
        print(f"   Limite configurado: {max_sessions} sessões")
        
        successful_sessions = []
        for i in range(max_sessions + 5):  # Tenta 5 a mais que o limite
            session_id = f"limit_test_{i}"
            try:
                await handler.create_session(session_id)
                successful_sessions.append(session_id)
                if i % 10 == 0:
                    print(f"   ✅ {len(successful_sessions)} sessões criadas...")
            except RuntimeError as e:
                print(f"   ❌ Limite atingido na sessão {i}: {e}")
                break
        
        print(f"   📊 Total de sessões criadas: {len(successful_sessions)}")
        
        # Teste de timeout de sessão
        print("\n2. ⏱️ Simulação de timeout de sessões...")
        
        # Como o timeout real demora 30min, vamos simular reduzindo temporariamente
        original_timeout = handler.session_manager.SESSION_TIMEOUT_MINUTES
        handler.session_manager.SESSION_TIMEOUT_MINUTES = 0.1  # 6 segundos para teste
        
        print("   Aguardando timeout de sessões (6 segundos)...")
        await asyncio.sleep(7)
        
        # Executa limpeza manual para simular o cleanup automático
        inactive_sessions = await handler.session_manager.cleanup_inactive_sessions()
        print(f"   🗑️ Sessões removidas por timeout: {len(inactive_sessions)}")
        
        # Restaura timeout original
        handler.session_manager.SESSION_TIMEOUT_MINUTES = original_timeout
        
        # Teste de métricas detalhadas
        print("\n3. 📈 Teste de métricas detalhadas...")
        
        # Cria uma sessão para teste de métricas
        test_session = "metrics_test"
        await handler.create_session(test_session)
        
        # Envia várias mensagens para gerar métricas
        for i in range(3):
            print(f"   📤 Enviando mensagem {i+1}/3...")
            async for response in handler.send_message(test_session, f"Mensagem de teste {i+1}"):
                if response['type'] == 'result':
                    break
        
        # Mostra métricas finais
        metrics = handler.session_manager.get_session_metrics(test_session)
        if metrics:
            print(f"   📊 Métricas finais:")
            print(f"       - Mensagens enviadas: {metrics.message_count}")
            print(f"       - Tokens processados: {metrics.total_tokens}")
            print(f"       - Custo total: ${metrics.total_cost:.4f}")
            print(f"       - Erros de conexão: {metrics.connection_errors}")
            print(f"       - Tempo de vida: {(datetime.now() - metrics.created_at).seconds}s")
        
    finally:
        print("\n🧹 Limpeza final das funcionalidades avançadas...")
        await handler.session_manager.force_cleanup_all()
        await handler.shutdown_pool()


if __name__ == "__main__":
    print("🎯 Sistema de Gerenciamento Otimizado de Sessões Claude Code")
    print("=" * 60)
    
    # Executa demonstração principal
    asyncio.run(main())
    
    # Executa demonstração de funcionalidades avançadas  
    asyncio.run(demonstrate_advanced_features())
    
    print("\n🎉 Demonstração concluída com sucesso!")
    print("   O sistema está otimizado com:")
    print("   ✅ Pool de conexões reutilizáveis")
    print("   ✅ Cleanup automático de sessões inativas")  
    print("   ✅ Detecção de sessões órfãs")
    print("   ✅ Métricas detalhadas de uso")
    print("   ✅ Limites configuráveis")
    print("   ✅ Monitoramento de saúde")
    print("   ✅ Task scheduler para manutenção automática")