# 🚀 Aula 2: "Installation Engineering" - Environment Setup Avançado

**Módulo 1 - Aula 2 | Duração: 60min | Nível: Técnico Básico+**

---

## 🎯 **Objetivos de Aprendizagem**

Ao final desta aula, você será capaz de:
- ✅ Configurar ambiente Python profissional para AI development
- ✅ Resolver problemas comuns de instalação sistematicamente  
- ✅ Implementar dependency management robusto
- ✅ Debugar issues de environment como um senior dev

---

## 🐍 **PARTE 1: Python Environment Engineering** (20min)

### 🔍 **Análise de Requisitos Técnicos**

#### **📋 Claude Code SDK Requirements**
```toml
# Do pyproject.toml analisado
[project]
name = "claude-code-sdk-py"
requires-python = ">=3.10"  # ⚠️ Mínimo 3.10!

dependencies = [
    "anyio>=4.0.0",           # ⚡ Async I/O universal
    "typing_extensions>=4.0.0; python_version<'3.11'"  # 🔧 Backcompat
]
```

#### **🎯 Por que Python 3.10+ é obrigatório?**

```python
# 🚀 Features usadas que só existem em 3.10+:

# 1. Pattern Matching (usado em message_parser.py)
match message_type:
    case "user":
        return UserMessage(...)
    case "assistant":  
        return AssistantMessage(...)
    # ❌ Não funciona em Python < 3.10

# 2. Union Type Syntax (usado em sdk_types.py)
def process_message(msg: str | dict) -> Message:  # ❌ < 3.10
    pass

# 3. Precise Type Annotations
from collections.abc import AsyncIterable  # ✅ 3.10+
```

### 🏗️ **Environment Setup Professional**

#### **🔧 Método 1: uv (Recomendado)**
```bash
# ⚡ Ultra-fast Python package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# 🚀 Setup do projeto  
uv venv claude-sdk-env --python 3.11
source claude-sdk-env/bin/activate
uv sync  # Instala dependências do pyproject.toml
```

**🎯 Vantagens do uv:**
- **100x mais rápido** que pip
- **Dependency resolution** inteligente
- **Lock files** automáticos
- **Cross-platform** consistency

#### **🔧 Método 2: poetry (Alternativo)**
```bash
# 📦 Dependency management profissional
pip install poetry

poetry install  # Lê pyproject.toml
poetry shell   # Ativa ambiente
```

#### **🔧 Método 3: venv + pip (Básico)**
```bash
# 🐍 Approach tradicional
python3.11 -m venv venv
source venv/bin/activate
pip install -e .  # Instala em modo development
```

### 🧪 **Verificação de Instalação**

#### **✅ Checklist Técnico**
```python
#!/usr/bin/env python3
"""Verificador de ambiente Claude SDK."""

import sys
import subprocess
import importlib.util

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
        result = subprocess.run(["claude_code_cli", "--version"], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"✅ Claude CLI: {result.stdout.strip()}")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Claude CLI não encontrado")
        print("💡 Instale em: https://github.com/anthropics/claude-code")
        return False

def check_sdk_import():
    """Verifica se SDK importa corretamente."""
    try:
        from src import ClaudeSDKClient, query, __version__
        print(f"✅ Claude SDK v{__version__} importado")
        return True
    except ImportError as e:
        print(f"❌ Erro no import: {e}")
        print("💡 Execute: pip install -e .")
        return False

def check_dependencies():
    """Verifica dependências críticas."""
    deps = ["anyio", "typing_extensions"]
    all_ok = True
    
    for dep in deps:
        spec = importlib.util.find_spec(dep)
        if spec:
            print(f"✅ {dep}")
        else:
            print(f"❌ {dep} não encontrado")
            all_ok = False
    return all_ok

if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO DO AMBIENTE CLAUDE SDK")
    print("=" * 50)
    
    checks = [
        ("Python Version", check_python_version),
        ("Claude CLI", check_claude_cli), 
        ("SDK Import", check_sdk_import),
        ("Dependencies", check_dependencies)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n🔍 {name}:")
        results.append(check_func())
    
    print(f"\n" + "=" * 50)
    if all(results):
        print("🎉 AMBIENTE CONFIGURADO PERFEITAMENTE!")
    else:
        print("⚠️  CORREÇÕES NECESSÁRIAS - Veja erros acima")
```

---

## 🛠️ **PARTE 2: Dependency Management Profissional** (20min)

### 📊 **pyproject.toml Deep Analysis**

#### **🔬 Build System Analysis**
```toml
[build-system]
requires = ["hatchling"]     # ⚡ Modern build backend
build-backend = "hatchling.build"  # 🚀 Faster than setuptools

# 🎯 Por que Hatchling?
# 1. Zero config by default
# 2. Fast builds
# 3. Better dependency resolution
# 4. Modern Python packaging standards
```

#### **📦 Dependencies Engineering**
```toml
dependencies = [
    "anyio>=4.0.0",                                    # 🌟 Key dependency
    "typing_extensions>=4.0.0; python_version<'3.11'" # 🔧 Conditional
]

# 🧠 Analysis:
# anyio: Universal async I/O - supports asyncio, trio, curio
# typing_extensions: Backport for older Python versions
```

#### **🎯 Por que anyio e não asyncio direto?**

```python
# ❌ asyncio only:
import asyncio

async def old_way():
    # Locked to asyncio event loop
    await asyncio.sleep(1)

# ✅ anyio approach:
import anyio

async def universal_way():
    # Works with asyncio, trio, curio
    await anyio.sleep(1)
    
# 🎯 Benefit: Library compatibility
# SDK works with trio-based frameworks, asyncio apps, etc.
```

### 🔧 **Advanced Dependency Scenarios**

#### **🎭 Development vs Production Dependencies**
```toml
[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",         # 🧪 Testing framework
    "pytest-asyncio>=0.20.0", # ⚡ Async test support
    "anyio[trio]>=4.0.0",    # 🔀 Alternative async backend
    "pytest-cov>=4.0.0",     # 📊 Coverage reporting
    "mypy>=1.0.0",           # 🔍 Static type checking
    "ruff>=0.1.0",           # ⚡ Fast linting
]

# 🎯 Install scenarios:
# Production: uv sync
# Development: uv sync --extra dev
# CI/CD: uv sync --extra dev --frozen
```

### 🧪 **Dependency Conflict Resolution**

#### **🔬 Real-World Example**
```bash
# 🚨 Conflict scenario:
# Your app needs: requests>=2.28.0
# SDK needs: anyio>=4.0.0  
# But anyio conflicts with requests in some configurations

# 🔍 Debug command:
uv tree  # Shows dependency tree
uv check # Validates no conflicts

# 🛠️ Resolution strategies:
# 1. Version pinning
# 2. Alternative packages
# 3. Virtual environment isolation
```

---

## 🔧 **PARTE 3: Troubleshooting Engineering** (20min)

### 🚨 **Common Issues & Solutions**

#### **❌ Issue 1: Import Error**
```bash
ImportError: No module named 'src'
```

**🔍 Root Cause Analysis:**
```python
# Problem: Python não encontra módulo src
import sys
print("Python path:", sys.path)
# src/ não está no path

# Solution 1: Development install
pip install -e .

# Solution 2: Path manipulation  
sys.path.insert(0, str(Path(__file__).parent.parent))

# Solution 3: PYTHONPATH environment
export PYTHONPATH=/path/to/project:$PYTHONPATH
```

#### **❌ Issue 2: Claude CLI Not Found**
```bash
FileNotFoundError: [Errno 2] No such file or directory: 'claude_code_cli'
```

**🔍 Diagnostic Process:**
```bash
# 1. Check if installed
which claude_code_cli
echo $PATH

# 2. Check permissions
ls -la $(which claude_code_cli)

# 3. Test manual execution
claude_code_cli --version

# 4. SDK integration test
python -c "
import subprocess
try:
    result = subprocess.run(['claude_code_cli', '--help'], capture_output=True)
    print('✅ CLI accessible from Python')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

#### **❌ Issue 3: Async Runtime Error**
```python
RuntimeError: asyncio.run() cannot be called from a running event loop
```

**🔍 Solution Engineering:**
```python
# ❌ Problem code:
def broken_function():
    asyncio.run(query("Hello"))  # Fails in Jupyter/async context

# ✅ Solution 1: anyio approach
import anyio
def fixed_function():
    anyio.run(query, "Hello")  # Works everywhere

# ✅ Solution 2: Event loop detection
import asyncio
async def smart_query(prompt):
    try:
        # Try to get existing loop
        loop = asyncio.get_running_loop()
        # We're in async context, use await
        return await query(prompt)
    except RuntimeError:
        # No loop, safe to use asyncio.run
        return asyncio.run(query(prompt))
```

### 🔬 **Advanced Troubleshooting Tools**

#### **🛠️ Environment Diagnostic Script**
```python
#!/usr/bin/env python3
"""Advanced diagnostic tool for Claude SDK environment."""

import sys
import os
import subprocess
import platform
import importlib.util
from pathlib import Path

class EnvironmentDiagnostic:
    """Complete environment analysis."""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        
    def run_full_diagnostic(self):
        """Execute complete diagnostic suite."""
        print("🔍 DIAGNÓSTICO AVANÇADO - Claude SDK Environment")
        print("=" * 60)
        
        self.check_system_info()
        self.check_python_environment()
        self.check_claude_cli_integration()
        self.check_sdk_installation()
        self.check_performance_capabilities()
        
        self.report_results()
    
    def check_system_info(self):
        """System information analysis."""
        print("\n🖥️  SISTEMA:")
        print(f"   OS: {platform.system()} {platform.release()}")
        print(f"   Architecture: {platform.machine()}")
        print(f"   Python: {sys.version}")
        
        # Check available memory
        try:
            import psutil
            memory = psutil.virtual_memory()
            print(f"   RAM: {memory.total // (1024**3)}GB (Available: {memory.available // (1024**3)}GB)")
        except ImportError:
            self.warnings.append("psutil não disponível - install para memory analysis")
    
    def check_python_environment(self):
        """Python environment analysis."""
        print("\n🐍 PYTHON ENVIRONMENT:")
        
        # Virtual environment detection
        if hasattr(sys, 'real_prefix') or sys.base_prefix != sys.prefix:
            print("   ✅ Virtual environment detectado")
        else:
            print("   ⚠️  Não está em virtual environment")
            self.warnings.append("Recomendado usar virtual environment")
        
        # Python path analysis
        print(f"   Python executable: {sys.executable}")
        print(f"   PYTHONPATH entries: {len(sys.path)}")
        
        # Check critical modules
        critical_modules = ["asyncio", "subprocess", "json", "pathlib"]
        for module in critical_modules:
            if importlib.util.find_spec(module):
                print(f"   ✅ {module}")
            else:
                print(f"   ❌ {module}")
                self.issues.append(f"Missing critical module: {module}")
    
    def check_claude_cli_integration(self):
        """Claude CLI integration analysis."""
        print("\n🤖 CLAUDE CLI INTEGRATION:")
        
        # Test CLI availability
        try:
            result = subprocess.run(["claude_code_cli", "--version"], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"   ✅ Claude CLI v{result.stdout.strip()}")
                
                # Test interactive mode capability
                test_result = subprocess.run(["claude_code_cli", "--help"],
                                           capture_output=True, text=True, timeout=5)
                if "interactive" in test_result.stdout.lower():
                    print("   ✅ Interactive mode supported")
                else:
                    self.warnings.append("Interactive mode may not be available")
                    
            else:
                print(f"   ❌ CLI error: {result.stderr}")
                self.issues.append("Claude CLI não funcional")
                
        except subprocess.TimeoutExpired:
            print("   ❌ CLI timeout")
            self.issues.append("Claude CLI não responde")
        except FileNotFoundError:
            print("   ❌ Claude CLI não encontrado")
            self.issues.append("Instale Claude Code CLI primeiro")
    
    def check_sdk_installation(self):
        """SDK installation verification."""
        print("\n📦 SDK INSTALLATION:")
        
        # Import test
        try:
            from src import ClaudeSDKClient, query, __version__
            print(f"   ✅ SDK v{__version__} importado")
            
            # Test instantiation
            client = ClaudeSDKClient()
            print("   ✅ ClaudeSDKClient instanciável")
            
            # Check async capabilities
            import asyncio
            print("   ✅ Async support disponível")
            
        except ImportError as e:
            print(f"   ❌ Import error: {e}")
            self.issues.append("SDK não instalado corretamente")
    
    def check_performance_capabilities(self):
        """Performance analysis."""
        print("\n⚡ PERFORMANCE CAPABILITIES:")
        
        # Async performance test
        import time
        import asyncio
        
        async def async_test():
            start = time.time()
            await asyncio.sleep(0.001)  # Minimal async operation
            return time.time() - start
        
        try:
            duration = asyncio.run(async_test())
            if duration < 0.01:  # < 10ms
                print("   ✅ Async performance: Excellent")
            elif duration < 0.05:  # < 50ms  
                print("   ⚠️  Async performance: Good")
                self.warnings.append("Consider system optimization")
            else:
                print("   ❌ Async performance: Poor") 
                self.issues.append("System performance issues detected")
                
        except Exception as e:
            print(f"   ❌ Async test failed: {e}")
            self.issues.append("Async runtime problems")
    
    def report_results(self):
        """Generate final report."""
        print("\n" + "=" * 60)
        print("📊 RELATÓRIO FINAL")
        print("=" * 60)
        
        if not self.issues and not self.warnings:
            print("🎉 AMBIENTE PERFEITO!")
            print("✅ Claude SDK está pronto para uso avançado")
        else:
            if self.issues:
                print("🚨 ISSUES CRÍTICOS:")
                for issue in self.issues:
                    print(f"   ❌ {issue}")
            
            if self.warnings:
                print("\n⚠️  AVISOS:")
                for warning in self.warnings:
                    print(f"   ⚠️  {warning}")
        
        print(f"\n📈 Environment Score: {self.calculate_score()}/100")
    
    def calculate_score(self):
        """Calculate environment health score."""
        base_score = 100
        base_score -= len(self.issues) * 25  # Critical issues
        base_score -= len(self.warnings) * 10  # Warnings
        return max(0, base_score)

# Execute diagnostic
if __name__ == "__main__":
    diagnostic = EnvironmentDiagnostic()
    diagnostic.run_full_diagnostic()
```

---

## 🔧 **PARTE 3: Production Installation Patterns** (20min)

### 🐳 **Containerized Installation**

#### **🏗️ Multi-Stage Docker Build**
```dockerfile
# Production-grade Dockerfile
FROM python:3.11-slim as builder

# Install uv for fast dependency resolution
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies in virtual environment
RUN uv venv /opt/venv
RUN uv pip install --no-cache-dir -r pyproject.toml

# Production stage
FROM python:3.11-slim as production

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Ensure virtual environment is used
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY src/ ./src/
COPY wrappers_cli/ ./wrappers_cli/

# Install Claude CLI (production)
RUN curl -sSL https://claude.ai/install.sh | sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "from src import __version__; print('SDK OK')"

# Run CLI wrapper
CMD ["./wrappers_cli/claude"]
```

### 🚀 **CI/CD Integration**

#### **📋 GitHub Actions Workflow**
```yaml
name: Claude SDK CI/CD

on: [push, pull_request]

jobs:
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]
        
    steps:
    - uses: actions/checkout@v4
    
    - name: Install UV
      run: curl -LsSf https://astral.sh/uv/install.sh | sh
      
    - name: Setup Python ${{ matrix.python-version }}
      run: uv python install ${{ matrix.python-version }}
      
    - name: Install dependencies
      run: uv sync --extra dev
      
    - name: Run diagnostic
      run: uv run python scripts/environment_diagnostic.py
      
    - name: Run tests
      run: uv run pytest tests/ -v --cov=src
      
    - name: Type checking
      run: uv run mypy src/
      
    - name: Linting
      run: uv run ruff check src/
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Environment Setup Race (15min)**

**Objetivo:** Configure 3 ambientes diferentes e compare velocidade

```bash
# Time each approach:
time setup_with_uv.sh      # Should be fastest
time setup_with_poetry.sh  # Should be medium
time setup_with_pip.sh     # Should be slowest

# Measure and compare:
# - Installation time
# - Disk usage  
# - Memory footprint
# - Import speed
```

### **🎯 Exercício 2: Dependency Detective (10min)**

**Problema:** Seu colega reporta erro misterioso
```
ModuleNotFoundError: No module named '_internal'
```

**Tarefa:** Use ferramentas de diagnóstico para identificar e resolver

### **🎯 Exercício 3: Production Deployment (15min)**

**Objetivo:** Configure deployment que funciona em qualquer máquina

```bash
# Create deployment package:
# 1. Lock dependencies exactly
# 2. Create installation script
# 3. Include health checks
# 4. Test in clean environment
```

---

## 🎓 **RESUMO & PRÓXIMOS PASSOS**

### **🧠 Key Takeaways**

1. **🐍 Python 3.10+** é obrigatório para pattern matching
2. **⚡ uv é superior** a pip/poetry para speed
3. **🔍 Diagnostic tools** são essenciais para production
4. **🏗️ Environment isolation** previne 90% dos problemas

### **📈 Preparação para Aula 3**

**Próxima aula:** "Async Programming Mastery"
**Pre-work:** 
- Complete environment diagnostic
- Install anyio[trio] for alternative backend testing

### **💡 Questões para Reflexão**

1. Como você automatizaria environment setup para 50 desenvolvedores?
2. Qual seria sua estratégia de rollback se uma dependency atualizada quebrar produção?
3. Como implementaria hot-reload de dependencies em desenvolvimento?

---

## 🔗 **Recursos Técnicos**

- **📖 Docs:** [uv documentation](https://docs.astral.sh/uv/)
- **🛠️ Tools:** [Environment diagnostic script](../scripts/environment_diagnostic.py)
- **🚀 Setup:** [Development setup script](../scripts/setup_development.sh)
- **🎯 Next:** [Async Programming Mastery](curso_modulo_01_aula_03.md)

---

**🎯 Próxima Aula:** Async Programming Mastery - Concurrency Deep Dive
**📅 Duração:** 90min | **📊 Nível:** Técnico Básico++