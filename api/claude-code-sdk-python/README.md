# 🤖 Claude Code SDK Python

Enhanced Python SDK for Claude Code - Fork with additional features and professional tooling.

## 🚀 Quick Start

### Installation

```bash
# Using uv (recommended - fastest)
uv sync

# Using poetry
poetry install

# Using pip
pip install -e .
```

### Basic Usage

#### 1. Interactive CLI (Easiest)
```bash
cd wrappers_cli
./claude
```

#### 2. Programmatic Usage

```python
import asyncio
from src import query, ClaudeSDKClient

# Simple one-shot query
async def simple_example():
    async for message in query(prompt="What is the capital of Brazil?"):
        if hasattr(message, 'content'):
            print(message.content[0].text)

# Interactive conversation
async def chat_example():
    client = ClaudeSDKClient()
    await client.connect()
    
    try:
        await client.query("Hello Claude!")
        async for message in client.receive_response():
            if hasattr(message, 'content'):
                print(message.content[0].text)
    finally:
        await client.disconnect()

# Run examples
asyncio.run(simple_example())
asyncio.run(chat_example())
```

## 🔧 Features

### ✅ Interactive CLI
- **Chat Mode**: Natural conversation with Claude
- **Session Browser**: Navigate previous conversations with `v` command
- **Session Management**: Clear context with `l`, exit with `s`
- **Viewer Integration**: Browse sessions in web interface

### ✅ Python SDK
- **Simple Query API**: One-shot questions with `query()`
- **Interactive Client**: Stateful conversations with `ClaudeSDKClient`
- **Async Support**: Built on asyncio/anyio for performance
- **Type Safety**: Full typing support with TypedDict

### ✅ Development Tools
- **Environment Diagnostic**: `python scripts/environment_diagnostic.py`
- **Performance Benchmark**: `python scripts/performance_benchmark.py`
- **Development Setup**: `bash scripts/setup_development.sh`
- **Professional Testing**: Complete test suite

## 📁 Project Structure

```
claude-code-sdk-python/
├── src/                    # Main SDK code
│   ├── __init__.py        # Public API exports
│   ├── query.py           # Simple query function
│   ├── client.py          # Interactive client
│   ├── sdk_types.py       # Type definitions
│   ├── _errors.py         # Exception classes
│   ├── _internal/         # Internal implementation
│   └── tools/             # Development tools
├── wrappers_cli/          # Interactive CLI
│   └── claude             # Main CLI executable
├── tests/                 # Test suite
├── scripts/               # Utility scripts
├── examples/              # Usage examples
└── docs/                  # Course materials
```

## 🎓 Course Materials

This repository includes a comprehensive 20-module course covering everything from basic usage to advanced architecture patterns. See `/docs/` for course materials.

### Course Overview
- **Modules 1-3**: Technical Foundations (Python + Claude integration)
- **Modules 4-6**: Engineering Mastery (Architecture, CLI, Production)
- **Modules 7-9**: Leadership Excellence (Advanced patterns, UI, Team scaling)
- **Modules 10+**: Transcendent Engineering (Research, Universal Intelligence)

## 🔍 Diagnostic & Troubleshooting

### Environment Check
```bash
python scripts/environment_diagnostic.py
```

### Performance Benchmark  
```bash
python scripts/performance_benchmark.py
```

### Common Issues

**Import Error**: `No module named 'src'`
```bash
pip install -e .  # Install in development mode
```

**Claude CLI Not Found**: Install Claude Code CLI first
```bash
# Follow installation at: https://github.com/anthropics/claude-code
```

**Python Version**: Requires Python 3.10+
```bash
python --version  # Should be 3.10 or higher
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run CLI-specific tests
pytest tests/test_cli_wrapper.py -v

# Run with coverage
pytest tests/ --cov=src
```

## 🛠️ Development

### Setup Development Environment
```bash
bash scripts/setup_development.sh
```

### Development Tools
```python
# Performance profiling
from src.tools import AsyncProfiler, profile_query

profiler = AsyncProfiler()
profiler.start_timer("my_operation")
# ... your code ...
profiler.end_timer("my_operation")
print(profiler.report())
```

## 📊 Architecture

The SDK uses a sophisticated 4-layer architecture:

1. **API Layer** (`query.py`, `client.py`) - User-facing interfaces
2. **Core Layer** (`sdk_types.py`, `_errors.py`) - Fundamental types and errors  
3. **Engine Layer** (`_internal/client.py`, `_internal/message_parser.py`) - Business logic
4. **Transport Layer** (`_internal/transport/`) - Communication with Claude CLI

## 🎯 Philosophy

This SDK prioritizes:
- **Developer Experience**: Simple APIs that scale to complex use cases
- **Professional Quality**: Production-ready tooling and diagnostics
- **Educational Value**: Code that teaches best practices
- **Future-Proof Architecture**: Designed for extensibility and evolution

## 🔗 Links

- **Main Repository**: Private repository for enterprise use
- **Claude Code**: [Official Claude Code documentation](https://github.com/anthropics/claude-code)
- **Course Materials**: See `/docs/` directory for complete curriculum

## 📄 License

MIT License - See LICENSE file for details.

---

**🎯 Get Started**: `cd wrappers_cli && ./claude`