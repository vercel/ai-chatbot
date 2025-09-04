#!/usr/bin/env python3
"""
Verificador de ambiente Claude SDK - Versão simplificada para produção.
Detecta problemas comuns e verifica se tudo está funcionando.
"""

import sys
import subprocess
import importlib.util
from pathlib import Path

def check_python_version():
    """Verifica versão mínima do Python."""
    version = sys.version_info
    if version < (3, 10):
        print(f"❌ Python {version.major}.{version.minor} detectado")
        print("⚠️  Requerido: Python 3.10+")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_claude_cli():
    """Verifica se Claude CLI está instalado."""
    try:
        result = subprocess.run(["claude", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"✅ Claude CLI: Disponível")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Claude CLI não encontrado")
        print("💡 Instale Claude Code CLI primeiro")
        return False

def check_sdk_import():
    """Verifica se SDK importa corretamente."""
    try:
        # Adiciona src ao path
        project_root = Path(__file__).parent.parent
        sys.path.insert(0, str(project_root))
        
        from src import ClaudeSDKClient, query, __version__
        print(f"✅ Claude SDK v{__version__} importado")
        return True
    except ImportError as e:
        print(f"❌ Erro no import: {e}")
        print("💡 Execute: pip install -e .")
        return False

def check_cli_wrapper():
    """Verifica se CLI wrapper está funcionando."""
    cli_path = Path(__file__).parent.parent / "wrappers_cli" / "claude"
    
    if not cli_path.exists():
        print("❌ CLI wrapper não encontrado")
        return False
        
    if not cli_path.is_file() or not cli_path.stat().st_mode & 0o111:
        print("❌ CLI wrapper não é executável")
        return False
    
    print("✅ CLI wrapper disponível")
    return True

def main():
    """Execute diagnóstico completo."""
    print("🔍 DIAGNÓSTICO CLAUDE SDK")
    print("=" * 40)
    
    checks = [
        ("Python Version", check_python_version),
        ("Claude CLI", check_claude_cli), 
        ("SDK Import", check_sdk_import),
        ("CLI Wrapper", check_cli_wrapper)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n🔍 {name}:")
        results.append(check_func())
    
    print(f"\n" + "=" * 40)
    if all(results):
        print("🎉 AMBIENTE OK - Claude SDK pronto!")
        print("🚀 Execute: cd wrappers_cli && ./claude")
    else:
        print("⚠️  CORREÇÕES NECESSÁRIAS")
        print("📋 Veja erros acima para resolver")

if __name__ == "__main__":
    main()