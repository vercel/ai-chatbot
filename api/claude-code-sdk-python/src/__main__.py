#!/usr/bin/env python3
"""
Claude Code SDK - Interface de linha de comando interativa

Uso:
    python -m claude_code_sdk                    # Modo interativo
    python -m claude_code_sdk "Sua pergunta"     # Query única
    python -m claude_code_sdk --chat             # Modo chat contínuo
    python -m claude_code_sdk --example          # Executar exemplos
    python -m claude_code_sdk --help             # Ajuda
"""

import anyio
import sys
import argparse
from typing import Optional
from pathlib import Path

from . import (
    query,
    ClaudeSDKClient,
    ClaudeCodeOptions,
    AssistantMessage,
    TextBlock,
    ResultMessage,
    __version__
)


def print_header():
    """Imprime cabeçalho do CLI."""
    print("=" * 60)
    print(f"🤖 Claude Code SDK Python v{__version__}")
    print("=" * 60)


def print_response(message):
    """Formata e imprime resposta do Claude."""
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock):
                print(f"\n📝 Claude: {block.text}")
    elif isinstance(message, ResultMessage):
        if hasattr(message, 'usage') and message.usage:
            if hasattr(message.usage, 'input_tokens'):
                print(f"\n📊 Tokens: {message.usage.input_tokens} entrada, {message.usage.output_tokens} saída")
            elif isinstance(message.usage, dict):
                print(f"\n📊 Tokens: {message.usage.get('input_tokens', 0)} entrada, {message.usage.get('output_tokens', 0)} saída")
        if hasattr(message, 'total_cost_usd') and message.total_cost_usd:
            print(f"💰 Custo: ${message.total_cost_usd:.6f}")


async def single_query(prompt: str, options: Optional[ClaudeCodeOptions] = None):
    """Executa uma única query."""
    print(f"\n🔍 Pergunta: {prompt}")
    print("-" * 40)
    
    try:
        async for message in query(prompt=prompt, options=options):
            print_response(message)
        print()
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        return False
    return True


async def interactive_mode():
    """Modo interativo - permite múltiplas perguntas."""
    print("\n💬 Modo Interativo")
    print("Digite suas perguntas (ou 'sair' para terminar)")
    print("-" * 60)
    
    while True:
        try:
            prompt = input("\n👤 Você: ").strip()
            
            if prompt.lower() in ['sair', 'exit', 'quit', 'q']:
                print("\n👋 Até logo!")
                break
            
            if not prompt:
                continue
            
            await single_query(prompt)
            
        except KeyboardInterrupt:
            print("\n\n👋 Interrompido pelo usuário!")
            break
        except EOFError:
            print("\n👋 Até logo!")
            break


async def chat_mode():
    """Modo chat - mantém contexto da conversa."""
    print("\n💬 Modo Chat (com contexto)")
    print("Digite suas mensagens (ou 'sair' para terminar)")
    print("-" * 60)
    
    async with ClaudeSDKClient() as client:
        while True:
            try:
                prompt = input("\n👤 Você: ").strip()
                
                if prompt.lower() in ['sair', 'exit', 'quit', 'q']:
                    print("\n👋 Até logo!")
                    break
                
                if not prompt:
                    continue
                
                # Envia mensagem
                await client.query(prompt)
                
                # Recebe resposta
                print("\n📝 Claude: ", end="", flush=True)
                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                print(block.text, end="", flush=True)
                    elif isinstance(message, ResultMessage):
                        if message.total_cost_usd:
                            print(f"\n💰 Custo: ${message.total_cost_usd:.6f}")
                print()
                
            except KeyboardInterrupt:
                print("\n\n👋 Interrompido pelo usuário!")
                break
            except EOFError:
                print("\n👋 Até logo!")
                break


async def run_examples():
    """Executa exemplos demonstrativos."""
    print("\n🎯 Executando Exemplos")
    print("=" * 60)
    
    examples = [
        ("Matemática simples", "Quanto é 25 + 17?"),
        ("Conhecimento geral", "Qual a capital do Brasil?"),
        ("Programação", "Explique o que é Python em uma frase"),
        ("Análise", "Liste 3 vantagens de usar async/await")
    ]
    
    for titulo, prompt in examples:
        print(f"\n📌 {titulo}")
        success = await single_query(prompt)
        if not success:
            print("⚠️ Exemplo falhou, continuando...")
        print("-" * 40)
    
    print("\n✅ Exemplos concluídos!")


async def main():
    """Função principal do CLI."""
    parser = argparse.ArgumentParser(
        description="Claude Code SDK - Interface de linha de comando",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python -m claude_code_sdk                        # Modo interativo
  python -m claude_code_sdk "Quanto é 2+2?"        # Query única
  python -m claude_code_sdk --chat                 # Modo chat com contexto
  python -m claude_code_sdk --example              # Executar exemplos
  python -m claude_code_sdk --tools Read,Write     # Com ferramentas específicas
  
        """
    )
    
    parser.add_argument(
        "prompt",
        nargs="?",
        help="Pergunta para o Claude (se omitido, entra em modo interativo)"
    )
    
    parser.add_argument(
        "--chat", "-c",
        action="store_true",
        help="Modo chat com contexto mantido entre mensagens"
    )
    
    parser.add_argument(
        "--example", "-e",
        action="store_true",
        help="Executar exemplos demonstrativos"
    )
    
    parser.add_argument(
        "--tools", "-t",
        type=str,
        help="Ferramentas permitidas (ex: Read,Write,Bash)"
    )
    
    parser.add_argument(
        "--system", "-s",
        type=str,
        help="System prompt personalizado"
    )
    
    parser.add_argument(
        "--version", "-v",
        action="version",
        version=f"Claude Code SDK v{__version__}"
    )
    
    parser.add_argument(
        "--no-header",
        action="store_true",
        help="Não mostrar cabeçalho"
    )
    
    args = parser.parse_args()
    
    # Mostra cabeçalho (a menos que --no-header)
    if not args.no_header:
        print_header()
    
    # Prepara opções se necessário
    options = None
    if args.tools or args.system:
        options = ClaudeCodeOptions()
        if args.tools:
            options.allowed_tools = args.tools.split(',')
        if args.system:
            options.system_prompt = args.system
    
    try:
        # Determina modo de execução
        if args.example:
            await run_examples()
        elif args.chat:
            await chat_mode()
        elif args.prompt:
            # Query única
            await single_query(args.prompt, options)
        else:
            # Modo interativo padrão
            await interactive_mode()
    
    except KeyboardInterrupt:
        print("\n\n👋 Interrompido pelo usuário!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        sys.exit(1)


def run():
    """Entry point para execução do módulo."""
    try:
        anyio.run(main)
    except KeyboardInterrupt:
        print("\n👋 Até logo!")
        sys.exit(0)


if __name__ == "__main__":
    run()