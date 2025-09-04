#!/bin/bash
"""
Setup de desenvolvimento para Claude Code SDK.
Instala dependências e configura ambiente adequadamente.
"""

set -e  # Exit on any error

echo "🚀 SETUP DESENVOLVIMENTO - Claude Code SDK"
echo "============================================="

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "🐍 Python detectado: $python_version"

if [[ $(echo "$python_version >= 3.10" | bc -l) -eq 0 ]]; then
    echo "❌ Python 3.10+ necessário. Atual: $python_version"
    echo "💡 Instale Python 3.10+ antes de continuar"
    exit 1
fi

# Check if we're in project root
if [[ ! -f "pyproject.toml" ]]; then
    echo "❌ Execute este script na raiz do projeto (onde está pyproject.toml)"
    exit 1
fi

echo "✅ Pré-requisitos OK"

# Check for uv (preferred)
if command -v uv >/dev/null 2>&1; then
    echo "🚀 Usando uv (ultra-fast)"
    uv sync --extra dev
    echo "✅ Dependências instaladas com uv"
    
    # Test installation
    echo "🧪 Testando instalação..."
    uv run python -c "from src import __version__; print(f'SDK v{__version__} OK')"
    
elif command -v poetry >/dev/null 2>&1; then
    echo "📦 Usando poetry"
    poetry install
    echo "✅ Dependências instaladas com poetry"
    
    # Test installation
    echo "🧪 Testando instalação..."
    poetry run python -c "from src import __version__; print(f'SDK v{__version__} OK')"
    
else
    echo "🐍 Usando pip (método tradicional)"
    
    # Create venv if not exists
    if [[ ! -d "venv" ]]; then
        echo "📁 Criando virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate venv
    source venv/bin/activate
    
    # Install in development mode
    pip install -e ".[dev]"
    echo "✅ Dependências instaladas com pip"
    
    # Test installation
    echo "🧪 Testando instalação..."
    python -c "from src import __version__; print(f'SDK v{__version__} OK')"
fi

# Verify CLI wrapper
echo "🔧 Verificando CLI wrapper..."
if [[ -x "wrappers_cli/claude" ]]; then
    echo "✅ CLI wrapper executável"
else
    echo "⚠️  Tornando CLI wrapper executável..."
    chmod +x wrappers_cli/claude
    echo "✅ CLI wrapper corrigido"
fi

# Run diagnostic
echo "🔍 Executando diagnóstico..."
python3 scripts/environment_diagnostic.py

echo ""
echo "🎉 SETUP CONCLUÍDO!"
echo "🚀 Para usar: cd wrappers_cli && ./claude"
echo "📊 Para benchmark: python3 scripts/performance_benchmark.py"