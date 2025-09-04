# 🧩 Módulo 5: "Extensibility Engineering" - Plugin Architecture Mastery

**Duração Total: 7h | Nível: Intermediário+**

---

## 📚 **Aula 1: Plugin Architecture Design** (120min)

### 🎯 **Hook System Implementation**

```python
from typing import Dict, List, Callable, Any
import asyncio

class HookSystem:
    """Professional hook system for extensibility."""
    
    def __init__(self):
        self.hooks: Dict[str, List[Callable]] = {}
        self.hook_priorities: Dict[str, List[int]] = {}
        
    def register_hook(self, hook_name: str, callback: Callable, priority: int = 50):
        """Register hook callback."""
        if hook_name not in self.hooks:
            self.hooks[hook_name] = []
            self.hook_priorities[hook_name] = []
        
        # Insert based on priority (higher priority first)
        insert_pos = 0
        for i, existing_priority in enumerate(self.hook_priorities[hook_name]):
            if priority > existing_priority:
                insert_pos = i
                break
            insert_pos = i + 1
        
        self.hooks[hook_name].insert(insert_pos, callback)
        self.hook_priorities[hook_name].insert(insert_pos, priority)
    
    async def execute_hooks(self, hook_name: str, *args, **kwargs) -> List[Any]:
        """Execute all hooks for given name."""
        results = []
        
        if hook_name in self.hooks:
            for callback in self.hooks[hook_name]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        result = await callback(*args, **kwargs)
                    else:
                        result = callback(*args, **kwargs)
                    results.append(result)
                except Exception as e:
                    print(f"⚠️ Hook error in {hook_name}: {e}")
        
        return results

# Plugin lifecycle management
class PluginLifecycleManager:
    """Manage complete plugin lifecycle."""
    
    def __init__(self):
        self.plugins = {}
        self.plugin_states = {}
        self.dependency_graph = {}
        
    async def load_plugin(self, plugin_class, config: Dict[str, Any] = None):
        """Load plugin with dependency resolution."""
        
        plugin = plugin_class()
        plugin_name = plugin.name
        
        # Check dependencies
        for dep in plugin.dependencies:
            if dep not in self.plugins:
                raise Exception(f"Dependency not met: {dep}")
        
        # Initialize plugin
        await plugin.initialize(config or {})
        
        # Register with system
        self.plugins[plugin_name] = plugin
        self.plugin_states[plugin_name] = "loaded"
        
        print(f"✅ Plugin loaded: {plugin_name}")
    
    async def unload_plugin(self, plugin_name: str):
        """Safely unload plugin."""
        
        if plugin_name not in self.plugins:
            return
        
        # Check if other plugins depend on this one
        dependents = []
        for name, plugin in self.plugins.items():
            if plugin_name in plugin.dependencies:
                dependents.append(name)
        
        if dependents:
            print(f"⚠️ Cannot unload {plugin_name}: dependencies in {dependents}")
            return False
        
        # Cleanup plugin
        plugin = self.plugins[plugin_name]
        await plugin.cleanup()
        
        # Remove from system
        del self.plugins[plugin_name]
        del self.plugin_states[plugin_name]
        
        print(f"🗑️ Plugin unloaded: {plugin_name}")
        return True

# Dynamic loading implementation
class DynamicLoader:
    """Load plugins dynamically at runtime."""
    
    def __init__(self, plugins_directory: Path):
        self.plugins_dir = plugins_directory
        self.watcher_task = None
        
    async def start_watching(self):
        """Start watching for plugin changes."""
        self.watcher_task = asyncio.create_task(self._watch_plugins())
    
    async def _watch_plugins(self):
        """Watch for plugin file changes."""
        
        import time
        from pathlib import Path
        
        known_files = {}
        
        while True:
            try:
                # Scan plugin directory
                for plugin_file in self.plugins_dir.glob("*_plugin.py"):
                    current_mtime = plugin_file.stat().st_mtime
                    
                    if plugin_file.name not in known_files:
                        # New plugin detected
                        print(f"🆕 New plugin detected: {plugin_file.name}")
                        known_files[plugin_file.name] = current_mtime
                        
                    elif known_files[plugin_file.name] != current_mtime:
                        # Plugin modified
                        print(f"🔄 Plugin modified: {plugin_file.name}")
                        known_files[plugin_file.name] = current_mtime
                        # TODO: Trigger reload
                
                await asyncio.sleep(1.0)  # Check every second
                
            except Exception as e:
                print(f"⚠️ Plugin watcher error: {e}")
                await asyncio.sleep(5.0)
```

---

## 📚 **Aula 2: Transport Implementations** (150min)

### 🌐 **HTTP Transport Full Implementation**

```python
import aiohttp
import json
from typing import AsyncIterator

class ProductionHTTPTransport(Transport):
    """Production-ready HTTP transport."""
    
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.session = None
        self.websocket = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        
    async def connect(self, options: Dict[str, Any]) -> bool:
        """Production HTTP connection."""
        
        try:
            # Create session with optimizations
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            connector = aiohttp.TCPConnector(
                limit=100,  # Connection pool size
                limit_per_host=10,
                keepalive_timeout=60,
                enable_cleanup_closed=True
            )
            
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector,
                headers={"User-Agent": "Claude-SDK-Python/1.0"}
            )
            
            # Test connection
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status != 200:
                    raise Exception(f"Server unhealthy: {response.status}")
            
            # Establish WebSocket
            self.websocket = await self.session.ws_connect(
                f"{self.base_url.replace('http', 'ws')}/stream",
                heartbeat=30  # Keep connection alive
            )
            
            self.connected = True
            return True
            
        except Exception as e:
            await self._cleanup_failed_connection()
            raise e

# WebSocket transport
class WebSocketTransport(Transport):
    """High-performance WebSocket transport."""
    
    async def connect(self, options: Dict[str, Any]) -> bool:
        """WebSocket connection with advanced features."""
        
        import websockets
        
        # Connection with compression and extensions
        self.websocket = await websockets.connect(
            f"ws://localhost:8765/claude",
            compression="deflate",  # Enable compression
            max_size=10_000_000,    # 10MB max message size
            ping_interval=20,       # Keep-alive ping
            ping_timeout=10
        )
        
        self.connected = True
        return True
    
    async def send_message(self, message: str) -> bool:
        """Send with WebSocket optimization."""
        
        # Send as binary for better performance
        message_bytes = json.dumps({"content": message}).encode('utf-8')
        await self.websocket.send(message_bytes)
        
        return True
```

---

## 📚 **Aula 3: Instrumentation & Observability** (120min)

### 📊 **Production Metrics System**

```python
import time
from typing import Dict, Any
from dataclasses import dataclass, field
import asyncio

@dataclass
class MetricsSnapshot:
    """Point-in-time metrics snapshot."""
    timestamp: float = field(default_factory=time.time)
    message_count: int = 0
    error_count: int = 0
    avg_response_time: float = 0.0
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0

class ProductionMetricsCollector:
    """Enterprise-grade metrics collection."""
    
    def __init__(self):
        self.metrics_history: List[MetricsSnapshot] = []
        self.real_time_metrics = {}
        self.alert_callbacks = []
        
    async def collect_system_metrics(self) -> MetricsSnapshot:
        """Collect comprehensive system metrics."""
        
        try:
            import psutil
            
            # System metrics
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Application metrics
            snapshot = MetricsSnapshot(
                memory_usage_mb=memory.used / 1024 / 1024,
                cpu_usage_percent=cpu_percent,
                message_count=self.real_time_metrics.get("messages", 0),
                error_count=self.real_time_metrics.get("errors", 0)
            )
            
            self.metrics_history.append(snapshot)
            
            # Trim history
            if len(self.metrics_history) > 1000:
                self.metrics_history.pop(0)
            
            return snapshot
            
        except ImportError:
            # Fallback metrics without psutil
            return MetricsSnapshot()
    
    async def start_real_time_collection(self, interval: float = 5.0):
        """Start real-time metrics collection."""
        
        while True:
            snapshot = await self.collect_system_metrics()
            
            # Check for alerts
            await self._check_alerts(snapshot)
            
            await asyncio.sleep(interval)
    
    async def _check_alerts(self, snapshot: MetricsSnapshot):
        """Check metrics against alert thresholds."""
        
        alerts = []
        
        if snapshot.memory_usage_mb > 500:  # > 500MB
            alerts.append(f"High memory usage: {snapshot.memory_usage_mb:.1f}MB")
        
        if snapshot.cpu_usage_percent > 80:  # > 80%
            alerts.append(f"High CPU usage: {snapshot.cpu_usage_percent:.1f}%")
        
        if snapshot.error_count > 10:  # > 10 errors
            alerts.append(f"High error count: {snapshot.error_count}")
        
        # Trigger alert callbacks
        for alert in alerts:
            for callback in self.alert_callbacks:
                try:
                    await callback(alert, snapshot)
                except Exception as e:
                    print(f"⚠️ Alert callback error: {e}")

# Distributed tracing
class DistributedTracer:
    """Trace operations across system components."""
    
    def __init__(self):
        self.active_traces = {}
        self.completed_traces = []
        
    def start_trace(self, operation_name: str, context: Dict[str, Any] = None) -> str:
        """Start new trace."""
        
        trace_id = f"trace_{int(time.time() * 1000000)}"  # Microsecond precision
        
        self.active_traces[trace_id] = {
            "operation": operation_name,
            "start_time": time.time(),
            "context": context or {},
            "spans": []
        }
        
        return trace_id
    
    def add_span(self, trace_id: str, span_name: str, duration: float, metadata: Dict[str, Any] = None):
        """Add span to trace."""
        
        if trace_id in self.active_traces:
            span = {
                "name": span_name,
                "duration": duration,
                "metadata": metadata or {},
                "timestamp": time.time()
            }
            
            self.active_traces[trace_id]["spans"].append(span)
    
    def end_trace(self, trace_id: str, success: bool = True):
        """End trace and move to completed."""
        
        if trace_id in self.active_traces:
            trace = self.active_traces[trace_id]
            trace["end_time"] = time.time()
            trace["total_duration"] = trace["end_time"] - trace["start_time"]
            trace["success"] = success
            
            self.completed_traces.append(trace)
            del self.active_traces[trace_id]
            
            # Trim completed traces
            if len(self.completed_traces) > 500:
                self.completed_traces.pop(0)
```

---

## 📚 **Aula 4: SDK Extension Patterns** (90min)

### 🔧 **Middleware & Interceptors**

```python
class SDKMiddleware:
    """Professional middleware for SDK operations."""
    
    async def before_query(self, prompt: str, options: Any) -> tuple[str, Any]:
        """Process before query execution."""
        return prompt, options
    
    async def after_response(self, response: Any, context: Dict[str, Any]) -> Any:
        """Process after response received."""
        return response
    
    async def on_error(self, error: Exception, context: Dict[str, Any]) -> bool:
        """Handle errors. Return True if handled."""
        return False

class MiddlewareStack:
    """Manage middleware execution order."""
    
    def __init__(self):
        self.middleware: List[SDKMiddleware] = []
    
    def add_middleware(self, middleware: SDKMiddleware):
        self.middleware.append(middleware)
    
    async def execute_query_with_middleware(self, query_func: Callable, prompt: str, options: Any):
        """Execute query through middleware stack."""
        
        # Before hooks
        processed_prompt, processed_options = prompt, options
        for mw in self.middleware:
            processed_prompt, processed_options = await mw.before_query(processed_prompt, processed_options)
        
        try:
            # Execute query
            response = await query_func(processed_prompt, processed_options)
            
            # After hooks
            for mw in reversed(self.middleware):
                response = await mw.after_response(response, {"prompt": prompt})
            
            return response
            
        except Exception as e:
            # Error hooks
            handled = False
            for mw in reversed(self.middleware):
                if await mw.on_error(e, {"prompt": prompt}):
                    handled = True
                    break
            
            if not handled:
                raise

# Custom message types
class CustomMessageType:
    """Framework for custom message types."""
    
    def __init__(self, type_name: str, schema: Dict[str, Any]):
        self.type_name = type_name
        self.schema = schema
        self.validators = []
    
    def add_validator(self, validator_func: Callable):
        """Add custom validator."""
        self.validators.append(validator_func)
    
    def validate(self, message_data: Dict[str, Any]) -> bool:
        """Validate message against schema and custom validators."""
        
        # Schema validation
        for field, field_type in self.schema.items():
            if field not in message_data:
                return False
            if not isinstance(message_data[field], field_type):
                return False
        
        # Custom validators
        for validator in self.validators:
            if not validator(message_data):
                return False
        
        return True

# Protocol extensions
class ProtocolExtension:
    """Extend Claude protocol with custom features."""
    
    def __init__(self):
        self.custom_types = {}
        self.protocol_handlers = {}
    
    def register_custom_type(self, type_name: str, handler: Callable):
        """Register custom message type handler."""
        self.custom_types[type_name] = handler
    
    async def process_extended_message(self, message: Dict[str, Any]) -> Any:
        """Process message with protocol extensions."""
        
        message_type = message.get("type")
        
        if message_type in self.custom_types:
            handler = self.custom_types[message_type]
            return await handler(message)
        
        # Fallback to standard processing
        return message
```

**Exercícios:** Implement custom middleware, create protocol extension, build plugin with hot-reload.

---

**Próximas Aulas:** Transport variety, metrics deep dive, extension patterns mastery.

**Próximo Módulo:** [Production Architecture](curso_modulo_06_aula_01.md)