"""Configuração compartilhada para todos os testes."""

import sys
from pathlib import Path

# Adiciona o diretório pai ao PYTHONPATH para permitir imports de src
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configuração para pytest
pytest_plugins = []

# Fixtures compartilhadas podem ser adicionadas aqui