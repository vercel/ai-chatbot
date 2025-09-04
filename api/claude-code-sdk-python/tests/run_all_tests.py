#!/usr/bin/env python3
"""
Script para executar todos os testes do Claude Code SDK Python
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

# Adiciona o diretório src ao path (um nível acima)
sdk_path = Path(__file__).parent.parent / 'src'
sys.path.insert(0, str(sdk_path))

def run_test_file(test_file):
    """Executa um arquivo de teste individual."""
    print(f"\n📋 Testando: {test_file.name}")
    print("-" * 50)
    
    try:
        # Executa o teste
        result = subprocess.run(
            [sys.executable, str(test_file)],
            capture_output=True,
            text=True,
            timeout=30,
            env={**os.environ, 'PYTHONPATH': str(sdk_path)}
        )
        
        # Verifica resultado
        if result.returncode == 0:
            # Se não tem output, provavelmente é um teste que precisa pytest
            if not result.stdout and not result.stderr:
                return {
                    'file': test_file.name,
                    'status': 'SKIP',
                    'message': 'Requer pytest para executar'
                }
            else:
                return {
                    'file': test_file.name,
                    'status': 'PASS',
                    'output': result.stdout[:500]
                }
        else:
            error_msg = result.stderr or result.stdout
            return {
                'file': test_file.name,
                'status': 'FAIL',
                'error': error_msg[:500]
            }
            
    except subprocess.TimeoutExpired:
        return {
            'file': test_file.name,
            'status': 'TIMEOUT',
            'message': 'Teste demorou mais de 30 segundos'
        }
    except Exception as e:
        return {
            'file': test_file.name,
            'status': 'ERROR',
            'error': str(e)
        }

def main():
    print("=" * 60)
    print("🧪 EXECUTANDO TODOS OS TESTES DO CLAUDE CODE SDK")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Localiza pasta de testes (já estamos dentro dela)
    tests_dir = Path(__file__).parent
    
    if not tests_dir.exists():
        print("❌ Pasta tests/ não encontrada!")
        return
    
    # Lista arquivos de teste (excluindo este próprio script)
    test_files = sorted([f for f in tests_dir.glob('test_*.py') if f.name != 'run_all_tests.py'])
    print(f"\n📁 Encontrados {len(test_files)} arquivos de teste")
    
    # Executa cada teste
    results = []
    for test_file in test_files:
        result = run_test_file(test_file)
        results.append(result)
        
        # Mostra resultado imediato
        status_emoji = {
            'PASS': '✅',
            'FAIL': '❌',
            'SKIP': '⏭️',
            'TIMEOUT': '⏱️',
            'ERROR': '💥'
        }
        
        emoji = status_emoji.get(result['status'], '❓')
        print(f"{emoji} {result['file']}: {result['status']}")
        
        if result['status'] == 'FAIL':
            print(f"   Erro: {result.get('error', 'Unknown')[:100]}")
    
    # Resumo
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    # Conta resultados
    stats = {}
    for result in results:
        status = result['status']
        stats[status] = stats.get(status, 0) + 1
    
    total = len(results)
    for status, count in sorted(stats.items()):
        percentage = (count / total) * 100
        print(f"{status}: {count}/{total} ({percentage:.1f}%)")
    
    # Salva relatório
    report = {
        'timestamp': datetime.now().isoformat(),
        'sdk_path': str(sdk_path),
        'total_tests': total,
        'statistics': stats,
        'results': results
    }
    
    report_file = Path(__file__).parent / 'test_report.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Relatório salvo em: {report_file}")
    
    # Testes executáveis diretamente (sem pytest)
    executable_tests = [
        'test_simples.py',
        'test_sdk_funcionando.py',
        'test_sdk_basic_functionality.py'
    ]
    
    print("\n💡 Dica: Para testes completos, instale pytest:")
    print("   pip install pytest pytest-asyncio")
    print("\n🚀 Testes que podem rodar sem pytest:")
    for test in executable_tests:
        if test in [r['file'] for r in results]:
            print(f"   - {test}")

if __name__ == "__main__":
    main()