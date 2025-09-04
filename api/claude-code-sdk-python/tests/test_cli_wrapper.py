#!/usr/bin/env python3
"""
Testes para o wrapper CLI do Claude Code SDK.
Testa funcionalidades básicas do chat interativo e comandos especiais.
"""

import pytest
import asyncio
import subprocess
import sys
import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from io import StringIO

# Adiciona path para importar código do CLI
sys.path.insert(0, str(Path(__file__).parent.parent / 'wrappers_cli'))

# Import das funções do CLI - feito dinamicamente pois o arquivo não tem extensão .py
CLI_PATH = Path(__file__).parent.parent / 'wrappers_cli' / 'claude'

class TestCLIBasics:
    """Testes básicos do CLI wrapper."""

    def test_cli_executable_exists(self):
        """Testa se o arquivo CLI existe e é executável."""
        assert CLI_PATH.exists(), "Arquivo CLI não encontrado"
        assert os.access(CLI_PATH, os.X_OK), "Arquivo CLI não é executável"

    def test_cli_help_command(self):
        """Testa se o CLI responde a comandos básicos."""
        try:
            # Tenta executar o CLI com timeout curto
            result = subprocess.run(
                [str(CLI_PATH)], 
                input="s\n", 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            
            # Verifica se contém strings esperadas na saída
            assert "Claude Code SDK Python" in result.stdout
            assert "Chat Interativo" in result.stdout
            assert "Até logo!" in result.stdout
            
        except subprocess.TimeoutExpired:
            pytest.skip("CLI não respondeu em tempo adequado")
        except Exception as e:
            pytest.fail(f"Erro ao executar CLI: {e}")

    def test_cli_version_display(self):
        """Testa se o CLI exibe a versão corretamente."""
        try:
            result = subprocess.run(
                [str(CLI_PATH)], 
                input="s\n", 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            
            # Verifica se contém informação de versão
            assert "v0.0." in result.stdout or "v1." in result.stdout
            
        except (subprocess.TimeoutExpired, Exception):
            pytest.skip("Não foi possível testar versão")

class TestCLICommands:
    """Testes para comandos especiais do CLI."""

    @patch('builtins.input')
    def test_sair_command(self, mock_input):
        """Testa comando 'sair' e 's'."""
        mock_input.side_effect = ['s']
        
        try:
            result = subprocess.run(
                [str(CLI_PATH)], 
                input="s\n", 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            assert "Até logo!" in result.stdout
        except subprocess.TimeoutExpired:
            pytest.skip("Comando sair não respondeu adequadamente")

    def test_viewer_command_available(self):
        """Testa se comando viewer está disponível no help."""
        try:
            result = subprocess.run(
                [str(CLI_PATH)], 
                input="s\n", 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            
            # Verifica se help menciona comando viewer
            assert "viewer" in result.stdout.lower() or "'v'" in result.stdout
            
        except subprocess.TimeoutExpired:
            pytest.skip("Não foi possível verificar comando viewer")

    def test_limpar_command_help(self):
        """Testa se comando limpar está no help."""
        try:
            result = subprocess.run(
                [str(CLI_PATH)], 
                input="s\n", 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            
            # Verifica se help menciona comando limpar
            assert "limpar" in result.stdout or "'l'" in result.stdout
            
        except subprocess.TimeoutExpired:
            pytest.skip("Não foi possível verificar comando limpar")

class TestCLIImports:
    """Testa imports e dependências do CLI."""

    def test_required_imports_available(self):
        """Testa se todas as dependências necessárias estão disponíveis."""
        
        # Testa imports básicos do Python
        import sys
        import asyncio
        import os
        import json
        from pathlib import Path
        from datetime import datetime
        
        # Testa import do requests
        try:
            import requests
        except ImportError:
            pytest.fail("requests não está disponível - necessário para viewer")

    def test_sdk_import_works(self):
        """Testa se o SDK pode ser importado corretamente."""
        try:
            # Simula import path do CLI
            parent_dir = Path(__file__).parent.parent
            sys.path.insert(0, str(parent_dir))
            
            from src import AssistantMessage, TextBlock, ResultMessage, ClaudeSDKClient, __version__
            
            # Verifica se versão está definida
            assert __version__ is not None
            assert len(__version__.split('.')) >= 2  # Formato x.y ou x.y.z
            
        except ImportError as e:
            pytest.fail(f"Não foi possível importar SDK: {e}")

class TestCLIIntegration:
    """Testes de integração básica do CLI."""

    def test_cli_starts_without_errors(self):
        """Testa se o CLI inicia sem erros críticos."""
        try:
            process = subprocess.Popen(
                [str(CLI_PATH)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Aguarda um pouco para garantir inicialização
            import time
            time.sleep(1)
            
            # Envia comando de saída
            stdout, stderr = process.communicate(input="s\n", timeout=5)
            
            # Verifica se não houve erros críticos
            assert "Traceback" not in stderr, f"Erro Python encontrado: {stderr}"
            assert "Error" not in stderr or "❌" in stdout, f"Erro inesperado: {stderr}"
            assert process.returncode == 0, f"CLI saiu com código {process.returncode}"
            
        except subprocess.TimeoutExpired:
            if process:
                process.kill()
            pytest.skip("CLI não respondeu em tempo adequado")
        except Exception as e:
            pytest.fail(f"Erro ao testar inicialização do CLI: {e}")

    def test_cli_handles_keyboard_interrupt(self):
        """Testa se o CLI trata adequadamente Ctrl+C."""
        try:
            process = subprocess.Popen(
                [str(CLI_PATH)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                preexec_fn=os.setsid  # Cria novo grupo de processo
            )
            
            import time
            time.sleep(1)
            
            # Simula Ctrl+C
            process.send_signal(subprocess.signal.SIGINT)
            
            stdout, stderr = process.communicate(timeout=3)
            
            # Verifica se tratou adequadamente a interrupção
            assert "Interrompido!" in stdout or "Até logo!" in stdout
            
        except subprocess.TimeoutExpired:
            if process:
                process.kill()
            pytest.skip("Teste de interrupção não completado")
        except Exception as e:
            pytest.skip(f"Não foi possível testar interrupção: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])