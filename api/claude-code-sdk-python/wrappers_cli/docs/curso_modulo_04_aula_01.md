# 🏗️ Aula 1: "4-Layer Architecture Deep Dive" - System Design

**Módulo 4 - Aula 1 | Duração: 105min | Nível: Intermediário**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar arquitetura de 4 camadas do SDK
- ✅ Implementar dependency inversion profissional
- ✅ Analisar interface design patterns
- ✅ Calcular coupling vs cohesion metrics

---

## 🏛️ **PARTE 1: Layer Separation Principles** (35min)

### 🎯 **Architecture Overview Analysis**

```python
"""
CLAUDE SDK 4-LAYER ARCHITECTURE
===============================

Layer 1: API PÚBLICA (Frontend)
├── query.py          # Simple one-shot interface
├── client.py         # Interactive conversation interface  
├── __init__.py       # Public API exports
└── __main__.py       # CLI entry point

Layer 2: CORE (Foundations)
├── sdk_types.py      # Type system & data structures
└── _errors.py        # Error hierarchy & handling

Layer 3: ENGINE (Business Logic) 
├── _internal/client.py       # Internal orchestration
└── _internal/message_parser.py # Data transformation

Layer 4: INFRASTRUCTURE (Transport)
├── _internal/transport/__init__.py       # Transport abstraction
└── _internal/transport/subprocess_cli.py # Subprocess implementation
"""

# Layer dependency analysis
class LayerAnalyzer:
    """Analyze layer dependencies and violations."""
    
    def __init__(self):
        self.layer_definitions = {
            1: ["query.py", "client.py", "__init__.py", "__main__.py"],
            2: ["sdk_types.py", "_errors.py"],
            3: ["_internal/client.py", "_internal/message_parser.py"],
            4: ["_internal/transport/__init__.py", "_internal/transport/subprocess_cli.py"]
        }
        
        self.allowed_dependencies = {
            1: [2, 3],  # API layer can use Core and Engine
            2: [],      # Core layer has no dependencies (foundation)
            3: [2, 4],  # Engine can use Core and Infrastructure
            4: [2]      # Infrastructure can use Core
        }
    
    def analyze_dependencies(self, import_graph: Dict[str, List[str]]) -> Dict[str, Any]:
        """Analyze if dependencies follow layer rules."""
        
        violations = []
        valid_dependencies = []
        
        for file_path, imports in import_graph.items():
            source_layer = self._get_file_layer(file_path)
            
            for imported_file in imports:
                target_layer = self._get_file_layer(imported_file)
                
                if source_layer and target_layer:
                    if target_layer in self.allowed_dependencies[source_layer]:
                        valid_dependencies.append((source_layer, target_layer))
                    else:
                        violations.append({
                            "source": file_path,
                            "target": imported_file,
                            "source_layer": source_layer,
                            "target_layer": target_layer,
                            "violation_type": "invalid_layer_dependency"
                        })
        
        return {
            "violations": violations,
            "valid_dependencies": len(valid_dependencies),
            "architecture_score": self._calculate_architecture_score(violations)
        }
    
    def _get_file_layer(self, file_path: str) -> Optional[int]:
        """Determine which layer a file belongs to."""
        
        for layer, files in self.layer_definitions.items():
            if any(file_path.endswith(f) for f in files):
                return layer
        return None
    
    def _calculate_architecture_score(self, violations: List[Dict]) -> int:
        """Calculate architecture quality score."""
        base_score = 100
        violation_penalty = len(violations) * 10
        return max(0, base_score - violation_penalty)

# Dependency Inversion Principle implementation
from abc import ABC, abstractmethod
from typing import Protocol

class Transport(Protocol):
    """Transport protocol - dependency inversion."""
    
    async def connect(self, options: Any) -> bool:
        """Connect to Claude Code."""
        ...
    
    async def send_message(self, message: str) -> bool:
        """Send message."""
        ...
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Receive streaming messages."""
        ...
    
    async def disconnect(self) -> bool:
        """Disconnect."""
        ...

class HighLevelClient:
    """High-level client that depends on abstraction, not implementation."""
    
    def __init__(self, transport: Transport):
        self.transport = transport  # Depends on interface, not concrete class
        
    async def start_conversation(self):
        """Start conversation using any transport implementation."""
        
        # High-level logic independent of transport details
        await self.transport.connect({})
        
        # Send messages
        await self.transport.send_message("Hello")
        
        # Receive responses
        async for response in self.transport.receive_messages():
            self._process_response(response)
    
    def _process_response(self, response: str):
        """Process response independent of transport."""
        # Business logic here
        pass

# Different transport implementations
class SubprocessTransport:
    """Subprocess transport implementation."""
    
    async def connect(self, options: Any) -> bool:
        """Connect via subprocess."""
        print("🔌 Connecting via subprocess...")
        return True
    
    async def send_message(self, message: str) -> bool:
        """Send via subprocess."""
        print(f"📤 Subprocess send: {message}")
        return True
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Receive via subprocess."""
        yield f"Subprocess response"
    
    async def disconnect(self) -> bool:
        """Disconnect subprocess."""
        print("🔌 Subprocess disconnected")
        return True

class HTTPTransport:
    """HTTP transport implementation (alternative)."""
    
    async def connect(self, options: Any) -> bool:
        """Connect via HTTP."""
        print("🔌 Connecting via HTTP...")
        return True
    
    async def send_message(self, message: str) -> bool:
        """Send via HTTP."""
        print(f"📤 HTTP send: {message}")
        return True
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Receive via HTTP."""
        yield f"HTTP response"
    
    async def disconnect(self) -> bool:
        """Disconnect HTTP."""
        print("🔌 HTTP disconnected")
        return True

# Factory for transport selection
class TransportFactory:
    """Factory for creating appropriate transport."""
    
    @staticmethod
    def create_transport(transport_type: str) -> Transport:
        """Create transport based on type."""
        
        if transport_type == "subprocess":
            return SubprocessTransport()
        elif transport_type == "http":
            return HTTPTransport()
        else:
            raise ValueError(f"Unknown transport type: {transport_type}")

# Usage example - complete dependency inversion
async def dependency_inversion_demo():
    """Demonstrate dependency inversion in action."""
    
    # High-level client doesn't know about transport details
    subprocess_transport = TransportFactory.create_transport("subprocess")
    client1 = HighLevelClient(subprocess_transport)
    
    http_transport = TransportFactory.create_transport("http")  
    client2 = HighLevelClient(http_transport)
    
    # Same high-level code, different implementations
    print("Testing subprocess transport:")
    await client1.start_conversation()
    
    print("\nTesting HTTP transport:")
    await client2.start_conversation()
    
    print("✅ Dependency inversion working - high-level code unchanged!")
```

---

## 🔗 **PARTE 2: Interface Design Patterns** (35min)

### 🎯 **Interface Segregation Implementation**

```python
from typing import Protocol

# ❌ FAT INTERFACE (violates Interface Segregation)
class FatClaudeInterface(Protocol):
    """Bad example - too many responsibilities."""
    
    async def connect(self): ...
    async def disconnect(self): ...
    async def send_message(self, msg: str): ...
    async def receive_messages(self): ...
    async def get_sessions(self): ...
    async def delete_session(self, session_id: str): ...
    async def export_session(self, session_id: str): ...
    async def configure_settings(self, settings: dict): ...
    async def generate_summary(self, session_id: str): ...
    async def upload_file(self, file_path: str): ...
    # ... many more methods

# ✅ SEGREGATED INTERFACES (follows Interface Segregation)
class ConversationInterface(Protocol):
    """Interface for conversation operations only."""
    async def send_message(self, message: str): ...
    async def receive_messages(self) -> AsyncIterator[str]: ...

class ConnectionInterface(Protocol):
    """Interface for connection management only."""
    async def connect(self, options: Any = None) -> bool: ...
    async def disconnect(self) -> bool: ...
    async def is_connected(self) -> bool: ...

class SessionInterface(Protocol):
    """Interface for session management only."""
    async def get_sessions(self) -> List[dict]: ...
    async def load_session(self, session_id: str) -> dict: ...
    async def save_session(self, session: dict) -> str: ...

class SummaryInterface(Protocol):
    """Interface for summary operations only."""
    async def generate_summary(self, session_id: str, summary_type: str) -> str: ...
    async def list_summaries(self, session_id: str) -> List[dict]: ...

# Composition over inheritance
class ComprehensiveClaudeClient:
    """Client that composes multiple focused interfaces."""
    
    def __init__(self, 
                 conversation: ConversationInterface,
                 connection: ConnectionInterface,
                 session: SessionInterface,
                 summary: SummaryInterface):
        
        self.conversation = conversation
        self.connection = connection  
        self.session = session
        self.summary = summary
    
    async def start_chat_session(self):
        """High-level operation using composed interfaces."""
        
        # Use connection interface
        await self.connection.connect()
        
        try:
            # Use conversation interface
            await self.conversation.send_message("Hello")
            
            async for response in self.conversation.receive_messages():
                print(f"Response: {response}")
                break
            
            # Use session interface if needed
            sessions = await self.session.get_sessions()
            print(f"Available sessions: {len(sessions)}")
            
        finally:
            await self.connection.disconnect()

# Interface adapters for existing code
class ClaudeSDKAdapter:
    """Adapter to make existing ClaudeSDKClient fit new interfaces."""
    
    def __init__(self, sdk_client):
        self.sdk_client = sdk_client
    
    # Implement ConversationInterface
    async def send_message(self, message: str):
        """Adapt send_message to SDK client."""
        await self.sdk_client.query(message)
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Adapt receive_messages to SDK client."""
        async for msg in self.sdk_client.receive_response():
            if hasattr(msg, 'content'):
                for block in msg.content:
                    if hasattr(block, 'text'):
                        yield block.text
    
    # Implement ConnectionInterface  
    async def connect(self, options: Any = None) -> bool:
        """Adapt connect to SDK client."""
        await self.sdk_client.connect()
        return True
    
    async def disconnect(self) -> bool:
        """Adapt disconnect to SDK client."""
        await self.sdk_client.disconnect()
        return True
    
    async def is_connected(self) -> bool:
        """Check connection status."""
        # SDK doesn't expose this directly - would need to add
        return hasattr(self.sdk_client, 'process') and self.sdk_client.process is not None

# Advanced interface composition
class FlexibleClaudeClient:
    """Client with pluggable interface implementations."""
    
    def __init__(self):
        self.interfaces: Dict[str, Any] = {}
        self.middleware: List[Callable] = []
        
    def register_interface(self, interface_name: str, implementation: Any):
        """Register interface implementation."""
        self.interfaces[interface_name] = implementation
        
    def add_middleware(self, middleware_func: Callable):
        """Add middleware for cross-cutting concerns."""
        self.middleware.append(middleware_func)
        
    async def execute_with_middleware(self, operation: Callable, *args, **kwargs):
        """Execute operation with middleware chain."""
        
        # Before middleware
        for middleware in self.middleware:
            if hasattr(middleware, 'before'):
                await middleware.before(*args, **kwargs)
        
        try:
            # Execute operation
            result = await operation(*args, **kwargs)
            
            # After middleware (success)
            for middleware in reversed(self.middleware):
                if hasattr(middleware, 'after_success'):
                    await middleware.after_success(result)
            
            return result
            
        except Exception as e:
            # After middleware (error)
            for middleware in reversed(self.middleware):
                if hasattr(middleware, 'after_error'):
                    await middleware.after_error(e)
            raise

# Middleware examples
class LoggingMiddleware:
    """Middleware for logging all operations."""
    
    async def before(self, *args, **kwargs):
        """Log before operation."""
        print(f"📝 Operation starting with args: {args[:2]}...")  # Truncate for privacy
    
    async def after_success(self, result):
        """Log after successful operation."""
        print(f"✅ Operation completed successfully")
    
    async def after_error(self, error):
        """Log after failed operation."""
        print(f"❌ Operation failed: {error}")

class PerformanceMiddleware:
    """Middleware for performance monitoring."""
    
    def __init__(self):
        self.start_time = None
    
    async def before(self, *args, **kwargs):
        """Start performance timing."""
        self.start_time = time.time()
    
    async def after_success(self, result):
        """Log performance metrics."""
        if self.start_time:
            duration = time.time() - self.start_time
            print(f"⚡ Operation took {duration:.3f}s")
    
    async def after_error(self, error):
        """Log performance even on error."""
        if self.start_time:
            duration = time.time() - self.start_time
            print(f"⚡ Failed operation took {duration:.3f}s")
```

---

## 🔗 **PARTE 2: Coupling Analysis** (35min)

### 📊 **Coupling vs Cohesion Metrics**

```python
import ast
from pathlib import Path
from typing import Dict, Set, List, Tuple

class CouplingAnalyzer:
    """Analyze coupling between modules."""
    
    def __init__(self, source_dir: Path):
        self.source_dir = source_dir
        self.modules: Dict[str, Set[str]] = {}
        self.import_graph: Dict[str, Set[str]] = {}
        
    def analyze_coupling(self) -> Dict[str, Any]:
        """Perform complete coupling analysis."""
        
        # Build import graph
        self._build_import_graph()
        
        # Calculate coupling metrics
        afferent_coupling = self._calculate_afferent_coupling()
        efferent_coupling = self._calculate_efferent_coupling()
        instability = self._calculate_instability(afferent_coupling, efferent_coupling)
        
        # Calculate cohesion
        cohesion_metrics = self._analyze_cohesion()
        
        return {
            "afferent_coupling": afferent_coupling,
            "efferent_coupling": efferent_coupling,
            "instability": instability,
            "cohesion": cohesion_metrics,
            "coupling_score": self._calculate_coupling_score(afferent_coupling, efferent_coupling),
            "recommendations": self._generate_recommendations(instability, cohesion_metrics)
        }
    
    def _build_import_graph(self):
        """Build graph of module imports."""
        
        for py_file in self.source_dir.rglob("*.py"):
            if py_file.name.startswith('.'):
                continue
                
            module_name = str(py_file.relative_to(self.source_dir))
            imports = self._extract_imports(py_file)
            
            self.modules[module_name] = set()
            self.import_graph[module_name] = imports
    
    def _extract_imports(self, file_path: Path) -> Set[str]:
        """Extract imports from Python file."""
        
        try:
            with open(file_path, 'r') as f:
                tree = ast.parse(f.read())
            
            imports = set()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name)
                        
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module)
            
            # Filter to only local imports
            local_imports = set()
            for imp in imports:
                if imp.startswith('.') or 'src' in imp:
                    local_imports.add(imp)
            
            return local_imports
            
        except Exception as e:
            print(f"⚠️ Error analyzing {file_path}: {e}")
            return set()
    
    def _calculate_afferent_coupling(self) -> Dict[str, int]:
        """Calculate afferent coupling (incoming dependencies)."""
        
        afferent = {module: 0 for module in self.modules}
        
        for module, imports in self.import_graph.items():
            for imported_module in imports:
                if imported_module in afferent:
                    afferent[imported_module] += 1
        
        return afferent
    
    def _calculate_efferent_coupling(self) -> Dict[str, int]:
        """Calculate efferent coupling (outgoing dependencies)."""
        
        return {module: len(imports) for module, imports in self.import_graph.items()}
    
    def _calculate_instability(self, afferent: Dict[str, int], efferent: Dict[str, int]) -> Dict[str, float]:
        """Calculate instability metric (I = Ce / (Ca + Ce))."""
        
        instability = {}
        
        for module in self.modules:
            ca = afferent.get(module, 0)  # Afferent coupling
            ce = efferent.get(module, 0)  # Efferent coupling
            
            if ca + ce == 0:
                instability[module] = 0.0
            else:
                instability[module] = ce / (ca + ce)
        
        return instability
    
    def _analyze_cohesion(self) -> Dict[str, float]:
        """Analyze module cohesion."""
        
        cohesion_scores = {}
        
        for module_path in self.modules:
            try:
                file_path = self.source_dir / module_path
                cohesion_scores[module_path] = self._calculate_module_cohesion(file_path)
            except Exception:
                cohesion_scores[module_path] = 0.0
        
        return cohesion_scores
    
    def _calculate_module_cohesion(self, file_path: Path) -> float:
        """Calculate cohesion score for single module."""
        
        try:
            with open(file_path, 'r') as f:
                tree = ast.parse(f.read())
            
            # Count functions and classes
            functions = []
            classes = []
            shared_variables = set()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    functions.append(node)
                elif isinstance(node, ast.ClassDef):
                    classes.append(node)
                elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    shared_variables.add(node.id)
            
            # Simple cohesion metric: shared_variables / total_functions
            total_functions = len(functions) + sum(len([n for n in ast.walk(cls) if isinstance(n, ast.FunctionDef)]) for cls in classes)
            
            if total_functions == 0:
                return 1.0
            
            cohesion = len(shared_variables) / total_functions
            return min(1.0, cohesion)  # Cap at 1.0
            
        except Exception:
            return 0.0
    
    def _calculate_coupling_score(self, afferent: Dict[str, int], efferent: Dict[str, int]) -> int:
        """Calculate overall coupling quality score."""
        
        total_modules = len(self.modules)
        if total_modules == 0:
            return 100
        
        # Penalize high coupling
        high_afferent = sum(1 for ca in afferent.values() if ca > 5)
        high_efferent = sum(1 for ce in efferent.values() if ce > 5)
        
        penalty = ((high_afferent + high_efferent) / total_modules) * 50
        
        return max(0, 100 - int(penalty))
    
    def _generate_recommendations(self, instability: Dict[str, float], cohesion: Dict[str, float]) -> List[str]:
        """Generate architectural recommendations."""
        
        recommendations = []
        
        # High instability recommendations
        unstable_modules = [mod for mod, inst in instability.items() if inst > 0.8]
        if unstable_modules:
            recommendations.append(f"High instability detected in: {', '.join(unstable_modules[:3])} - consider stabilizing")
        
        # Low cohesion recommendations
        low_cohesion = [mod for mod, coh in cohesion.items() if coh < 0.3]
        if low_cohesion:
            recommendations.append(f"Low cohesion in: {', '.join(low_cohesion[:3])} - consider splitting modules")
        
        # Dependency recommendations
        high_coupling = [mod for mod, imports in self.import_graph.items() if len(imports) > 8]
        if high_coupling:
            recommendations.append(f"High coupling in: {', '.join(high_coupling[:3])} - reduce dependencies")
        
        return recommendations

# Usage example
def analyze_current_architecture():
    """Analyze current SDK architecture."""
    
    src_dir = Path("../../src")  # Relative to wrappers_cli/docs
    analyzer = CouplingAnalyzer(src_dir)
    
    results = analyzer.analyze_coupling()
    
    print("🏗️ ARCHITECTURE ANALYSIS")
    print("=" * 30)
    print(f"Coupling Score: {results['coupling_score']}/100")
    print(f"Recommendations: {len(results['recommendations'])}")
    
    for rec in results['recommendations']:
        print(f"💡 {rec}")
    
    return results
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Layer Compliance Checker (45min)**

```python
class ArchitectureComplianceChecker:
    """
    Implementar checker que verifica compliance com 4-layer architecture.
    
    Features:
    1. Detect layer violations automatically
    2. Suggest architectural improvements
    3. Calculate architecture quality score
    4. Generate compliance reports
    5. Integrate with CI/CD pipeline
    """
    
    def __init__(self, project_root: Path):
        # TODO: Initialize compliance checker
        self.project_root = project_root
        self.violations = []
        self.compliance_score = 0
        
    def check_compliance(self) -> Dict[str, Any]:
        """Check architectural compliance."""
        # TODO: Implement compliance checking
        # - Verify layer dependencies
        # - Check import violations
        # - Validate interface usage
        # - Analyze coupling metrics
        pass
    
    def generate_compliance_report(self) -> str:
        """Generate detailed compliance report."""
        # TODO: Generate comprehensive report
        pass
    
    def suggest_improvements(self) -> List[str]:
        """Suggest specific architectural improvements."""
        # TODO: Generate actionable suggestions
        pass

# Test compliance checker
def test_architecture_compliance():
    """Test architectural compliance of current SDK."""
    
    checker = ArchitectureComplianceChecker(Path("../../"))
    compliance_results = checker.check_compliance()
    
    print(checker.generate_compliance_report())
```

### **🎯 Exercício 2: Interface Optimization (25min)**

```python
class InterfaceOptimizer:
    """
    Otimizar interfaces existentes para melhor design.
    
    Optimization targets:
    1. Reduce interface fat (too many methods)
    2. Improve method signatures  
    3. Add proper abstractions
    4. Implement composition patterns
    """
    
    def __init__(self):
        # TODO: Initialize interface optimizer
        pass
    
    def analyze_interface_design(self, interface_class) -> Dict[str, Any]:
        """Analyze interface design quality."""
        # TODO: Implement interface analysis
        # - Count methods per interface
        # - Check method cohesion
        # - Identify fat interfaces
        # - Suggest segregation opportunities
        pass
    
    def suggest_interface_segregation(self, fat_interface) -> List[str]:
        """Suggest how to segregate fat interface."""
        # TODO: Implement segregation suggestions
        pass

# Test interface optimization
def test_interface_optimization():
    optimizer = InterfaceOptimizer()
    
    # Analyze existing interfaces and suggest improvements
    pass
```

---

## 🎓 **RESUMO**

**Key Insights:** Clean architecture através de proper layer separation e interface design creates maintainable, extensible systems.

**Próxima:** [Transport System Engineering](curso_modulo_04_aula_02.md)