# 🔧 Aula 2: "Code Architecture Analysis" - Reverse Engineering

**Módulo 3 - Aula 2 | Duração: 120min | Nível: Intermediário+**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Analisar arquitetura do CLI atual linha por linha
- ✅ Identificar design patterns em código real
- ✅ Descobrir refactoring opportunities
- ✅ Calcular code quality metrics

---

## 🔍 **PARTE 1: CLI Code Dissection** (40min)

### 📝 **Line-by-Line Analysis**

```python
# Análise do arquivo wrappers_cli/claude atual

"""
ANÁLISE ARQUITETURAL LINHA POR LINHA
=====================================
"""

# Lines 1-6: Shebang e Documentation
#!/usr/bin/env python3
# ✅ ANÁLISE: Proper shebang para cross-platform compatibility
# ✅ PATTERN: Self-documenting code com docstring

# Lines 7-13: Core Imports
import sys, asyncio, os, json, requests
from pathlib import Path  
from datetime import datetime
# ✅ ANÁLISE: Imports organizados por categoria (std lib, external, local)
# ⚠️ OPORTUNIDADE: Grouping could be more explicit

# Lines 15-17: Path Manipulation  
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
# 🔍 PATTERN: Dynamic path resolution
# ⚠️ TECHNICAL DEBT: Hard-coded relative path assumptions

# Lines 19: SDK Import
from src import AssistantMessage, TextBlock, ResultMessage, ClaudeSDKClient, __version__
# ✅ PATTERN: Single import line para related functionality
# ✅ VERSION: Import de versão para display

# Lines 21-22: Configuration
VIEWER_API_URL = "http://localhost:3043"
# 🔍 PATTERN: Configuration constant
# ⚠️ IMPROVEMENT: Could be environment variable or config file

"""
ARQUITETURA FUNCTIONAL ANALYSIS
===============================
"""

# Function: get_sessions() - Lines ~24-39
async def get_sessions():
    """Busca sessões do viewer HTTP."""
    # ✅ PATTERN: Async function com error handling
    # ✅ PATTERN: Try-except-finally com specific exceptions
    # ✅ UX: User-friendly error messages
    # 📊 COMPLEXITY: Baixa - single responsibility

# Function: session_browser() - Lines ~41-82  
async def session_browser():
    """Interface de navegação de sessões no CLI."""
    # ✅ PATTERN: Menu-driven interface
    # ✅ PATTERN: Loop até user exit
    # ✅ UX: Clear option numbering
    # 📊 COMPLEXITY: Média - coordena múltiplas funções

# Functions: list_sessions, search_session, filter_by_directory - Lines ~84-155
# ✅ PATTERN: Single responsibility functions
# ✅ PATTERN: Consistent input/output handling
# ✅ UX: Consistent user interaction patterns
# 📊 COMPLEXITY: Baixa-Média - focused functionality

# Function: show_session_details() - Lines ~184-220
# ✅ PATTERN: Rich information display
# ✅ PATTERN: Defensive programming (file existence checks)
# ✅ UX: URLs provided for deeper exploration
# 📊 COMPLEXITY: Média - file I/O e formatting

# Function: generate_summary() - Lines ~222-287
# ✅ PATTERN: API integration com error handling
# ✅ PATTERN: User input validation
# ✅ UX: Clear type selection e feedback
# 📊 COMPLEXITY: Alta - external API interaction

# Function: chat_mode() - Lines ~289-398
# ✅ PATTERN: Main application loop
# ✅ PATTERN: Command dispatch system
# ✅ PATTERN: Resource management (connect/disconnect)
# 📊 COMPLEXITY: Alta - central coordination logic
```

### 🎯 **Design Pattern Identification**

```python
"""
DESIGN PATTERNS FOUND IN CURRENT CLI
=====================================
"""

# 1. COMMAND PATTERN (Implicit)
# Current: String-based command matching
if prompt.lower() in ['s', 'sair']:
    # Exit logic
elif prompt.lower() in ['v', 'viewer']:
    # Viewer logic

# 🔧 IMPROVEMENT: Explicit command objects
class CommandPattern:
    def __init__(self):
        self.commands = {
            'exit': ExitCommand(),
            'viewer': ViewerCommand(),
            'clear': ClearCommand()
        }
    
    async def execute(self, command_name: str, context: Any):
        if command_name in self.commands:
            return await self.commands[command_name].execute(context)

# 2. STATE PATTERN (Implicit)
# Current: Boolean flags e if/else
if connected:
    # Connected behavior
else:
    # Disconnected behavior

# 🔧 IMPROVEMENT: Explicit state machine
class ConnectionState:
    async def handle_input(self, input_data): pass

class ConnectedState(ConnectionState):
    async def handle_input(self, input_data):
        # Handle connected state input
        pass

# 3. FACADE PATTERN (Present)
# Current CLI acts as facade over:
# - ClaudeSDKClient (conversation)
# - HTTP requests (viewer API)
# - File system (session files)
# ✅ GOOD: Hides complexity from user

# 4. ADAPTER PATTERN (Present) 
# CLI adapts between:
# - User terminal input/output
# - Claude SDK async interfaces
# - HTTP API responses
# ✅ GOOD: Clean interface adaptation

# 5. OBSERVER PATTERN (Missing)
# 🔧 OPPORTUNITY: Event-driven architecture
class CLIEventSystem:
    def __init__(self):
        self.observers = []
    
    def notify(self, event_type: str, data: Any):
        for observer in self.observers:
            observer.handle_event(event_type, data)

# Usage: notify("message_sent", message_data)
```

### 📊 **Code Quality Metrics**

```python
import ast
import subprocess
from pathlib import Path

class CodeQualityAnalyzer:
    """Analyze code quality metrics for CLI."""
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.source_code = file_path.read_text()
        self.ast_tree = ast.parse(self.source_code)
        
    def analyze_complexity(self) -> Dict[str, Any]:
        """Analyze code complexity metrics."""
        
        metrics = {
            "lines_of_code": len(self.source_code.splitlines()),
            "functions": 0,
            "classes": 0,
            "imports": 0,
            "cyclomatic_complexity": 0,
            "function_sizes": []
        }
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.FunctionDef):
                metrics["functions"] += 1
                func_lines = node.end_lineno - node.lineno
                metrics["function_sizes"].append(func_lines)
                
                # Calculate cyclomatic complexity for function
                complexity = self._calculate_cyclomatic_complexity(node)
                metrics["cyclomatic_complexity"] += complexity
                
            elif isinstance(node, ast.ClassDef):
                metrics["classes"] += 1
                
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                metrics["imports"] += 1
        
        # Calculate averages
        if metrics["function_sizes"]:
            metrics["avg_function_size"] = sum(metrics["function_sizes"]) / len(metrics["function_sizes"])
            metrics["max_function_size"] = max(metrics["function_sizes"])
        
        return metrics
    
    def _calculate_cyclomatic_complexity(self, func_node) -> int:
        """Calculate cyclomatic complexity for function."""
        complexity = 1  # Base complexity
        
        for node in ast.walk(func_node):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.With)):
                complexity += 1
            elif isinstance(node, ast.ExceptHandler):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
                
        return complexity
    
    def analyze_dependencies(self) -> Dict[str, List[str]]:
        """Analyze import dependencies."""
        
        dependencies = {
            "standard_library": [],
            "external_packages": [],
            "local_modules": []
        }
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self._categorize_import(alias.name, dependencies)
                    
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self._categorize_import(node.module, dependencies)
        
        return dependencies
    
    def _categorize_import(self, module_name: str, dependencies: Dict[str, List[str]]):
        """Categorize import by type."""
        
        # Standard library modules (incomplete list)
        stdlib_modules = {
            'sys', 'os', 'asyncio', 'json', 'time', 'datetime', 'pathlib',
            'subprocess', 'typing', 'collections', 're'
        }
        
        if module_name in stdlib_modules:
            dependencies["standard_library"].append(module_name)
        elif module_name.startswith('src'):
            dependencies["local_modules"].append(module_name)
        else:
            dependencies["external_packages"].append(module_name)
    
    def generate_quality_report(self) -> str:
        """Generate comprehensive quality report."""
        
        complexity = self.analyze_complexity()
        dependencies = self.analyze_dependencies()
        
        report = [
            "📊 CODE QUALITY REPORT",
            "=" * 25,
            f"📄 Lines of code: {complexity['lines_of_code']}",
            f"🔧 Functions: {complexity['functions']}",
            f"📦 Classes: {complexity['classes']}",
            f"📥 Imports: {complexity['imports']}",
            f"🌀 Cyclomatic complexity: {complexity['cyclomatic_complexity']}",
            "",
            "📈 FUNCTION ANALYSIS:",
            f"   Average size: {complexity.get('avg_function_size', 0):.1f} lines",
            f"   Largest function: {complexity.get('max_function_size', 0)} lines",
            "",
            "📦 DEPENDENCY ANALYSIS:",
            f"   Standard library: {len(dependencies['standard_library'])}",
            f"   External packages: {len(dependencies['external_packages'])}",  
            f"   Local modules: {len(dependencies['local_modules'])}",
            "",
            "🎯 QUALITY SCORE:",
            f"   {self._calculate_quality_score(complexity)}/100"
        ]
        
        return "\n".join(report)
    
    def _calculate_quality_score(self, metrics: Dict[str, Any]) -> int:
        """Calculate overall quality score."""
        score = 100
        
        # Penalize high complexity
        if metrics["cyclomatic_complexity"] > 50:
            score -= 20
        elif metrics["cyclomatic_complexity"] > 25:
            score -= 10
        
        # Penalize large functions
        if metrics.get("max_function_size", 0) > 100:
            score -= 15
        elif metrics.get("max_function_size", 0) > 50:
            score -= 5
        
        # Penalize too many dependencies
        if metrics["imports"] > 15:
            score -= 10
        
        return max(0, score)

# Analyze current CLI
cli_path = Path("../claude")
analyzer = CodeQualityAnalyzer(cli_path)
quality_report = analyzer.generate_quality_report()
print(quality_report)
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Architecture Improvement (50min)**

```python
class RefactoredCLI:
    """
    Refatorar CLI atual aplicando design patterns.
    
    Improvements to implement:
    1. Command pattern para better extensibility
    2. State machine para connection management
    3. Observer pattern para event handling
    4. Factory pattern para command creation
    5. Strategy pattern para different UI modes
    """
    
    def __init__(self):
        # TODO: Implement improved architecture
        pass
    
    async def run_with_patterns(self):
        """Run CLI usando design patterns."""
        # TODO: Implement pattern-based CLI
        pass

# Compare old vs new architecture
async def architecture_comparison():
    """Compare current vs refactored architecture."""
    
    # Measure: 
    # - Code complexity
    # - Performance
    # - Maintainability
    # - Extensibility
    
    pass
```

### **🎯 Exercício 2: Quality Improvement Plan (30min)**

```python
def create_improvement_plan(current_metrics: Dict[str, Any]) -> List[str]:
    """
    Create actionable improvement plan based on metrics.
    
    Analyze current CLI e suggest specific improvements:
    1. Function size reduction strategies
    2. Complexity reduction techniques  
    3. Dependency management improvements
    4. Error handling enhancements
    5. Performance optimization opportunities
    """
    
    improvements = []
    
    # TODO: Generate specific, actionable improvements
    # Based on real metrics from current CLI
    
    return improvements

# Generate improvement plan for current CLI
current_cli_path = Path("../claude")
analyzer = CodeQualityAnalyzer(current_cli_path)
metrics = analyzer.analyze_complexity()
plan = create_improvement_plan(metrics)

print("🎯 IMPROVEMENT PLAN")
print("=" * 20)
for i, improvement in enumerate(plan, 1):
    print(f"{i}. {improvement}")
```

---

## 🎓 **RESUMO**

**Key Insights:** Code analysis reveals opportunities para systematic improvements usando design patterns.

**Próxima:** [Command System Extension](curso_modulo_03_aula_03.md)