# 🔌 Aula 2: "Transport System Engineering" - Infrastructure Deep Dive

**Módulo 4 - Aula 2 | Duração: 120min | Nível: Intermediário++**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar abstração Transport Layer
- ✅ Implementar subprocess transport optimization  
- ✅ Desenvolver HTTP transport alternative
- ✅ Criar transport selection strategies

---

## 🚀 **PARTE 1: Transport Abstraction Mastery** (40min)

### 🔧 **Professional Transport Interface**

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional, Dict, Any
import asyncio

class TransportMetrics:
    """Metrics for transport performance."""
    def __init__(self):
        self.connection_time = 0.0
        self.message_count = 0
        self.error_count = 0
        self.bytes_transferred = 0
        
class Transport(ABC):
    """Abstract transport interface."""
    
    def __init__(self):
        self.metrics = TransportMetrics()
        self.connected = False
        
    @abstractmethod
    async def connect(self, options: Dict[str, Any]) -> bool:
        """Establish connection."""
        pass
    
    @abstractmethod  
    async def send_message(self, message: str) -> bool:
        """Send message."""
        pass
    
    @abstractmethod
    async def receive_messages(self) -> AsyncIterator[str]:
        """Receive streaming messages."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close connection."""
        pass
    
    def get_metrics(self) -> TransportMetrics:
        """Get transport metrics."""
        return self.metrics

# Optimized subprocess implementation
class OptimizedSubprocessTransport(Transport):
    """Highly optimized subprocess transport."""
    
    def __init__(self):
        super().__init__()
        self.process = None
        self.stdin_buffer = []
        self.stdout_buffer = ""
        self.background_reader_task = None
        
    async def connect(self, options: Dict[str, Any]) -> bool:
        """Connect with advanced process management."""
        
        start_time = time.time()
        
        try:
            # Advanced subprocess configuration
            self.process = await asyncio.create_subprocess_exec(
                "claude",
                "--interactive",
                "--dangerously-skip-permissions",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                # Performance optimizations
                limit=1024*1024,  # 1MB buffer limit
                preexec_fn=None  # Security consideration
            )
            
            # Start background reader
            self.background_reader_task = asyncio.create_task(self._background_reader())
            
            # Verify connection
            await self._verify_connection()
            
            self.connected = True
            self.metrics.connection_time = time.time() - start_time
            
            return True
            
        except Exception as e:
            await self._cleanup_failed_connection()
            raise e
    
    async def _background_reader(self):
        """Background task to continuously read stdout."""
        
        try:
            while self.process and self.process.returncode is None:
                # Read chunk
                chunk = await self.process.stdout.read(4096)
                if not chunk:
                    break
                
                # Add to buffer
                self.stdout_buffer += chunk.decode('utf-8', errors='ignore')
                self.metrics.bytes_transferred += len(chunk)
                
        except Exception as e:
            print(f"⚠️ Background reader error: {e}")
    
    async def send_message(self, message: str) -> bool:
        """Optimized message sending."""
        
        if not self.connected or not self.process:
            return False
        
        try:
            # Format message
            formatted = f'{{"type": "user", "content": "{message}"}}\n'
            message_bytes = formatted.encode('utf-8')
            
            # Send with buffer management
            self.process.stdin.write(message_bytes)
            await self.process.stdin.drain()
            
            self.metrics.message_count += 1
            self.metrics.bytes_transferred += len(message_bytes)
            
            return True
            
        except Exception as e:
            self.metrics.error_count += 1
            raise e
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Optimized message receiving."""
        
        while self.connected and self.process:
            # Process buffer for complete lines
            while '\n' in self.stdout_buffer:
                line, self.stdout_buffer = self.stdout_buffer.split('\n', 1)
                
                if line.strip():
                    yield line.strip()
            
            # Wait for more data
            await asyncio.sleep(0.01)
    
    async def disconnect(self) -> bool:
        """Optimized disconnection."""
        
        if not self.connected:
            return True
        
        try:
            # Stop background reader
            if self.background_reader_task:
                self.background_reader_task.cancel()
                try:
                    await self.background_reader_task
                except asyncio.CancelledError:
                    pass
            
            # Graceful process shutdown
            if self.process:
                self.process.terminate()
                try:
                    await asyncio.wait_for(self.process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    self.process.kill()
                    await self.process.wait()
            
            self.connected = False
            return True
            
        except Exception as e:
            print(f"⚠️ Disconnect error: {e}")
            return False

# HTTP transport implementation
class HTTPTransport(Transport):
    """HTTP-based transport for web integration."""
    
    def __init__(self):
        super().__init__()
        self.session = None
        self.base_url = "http://localhost:8992"
        self.websocket = None
        
    async def connect(self, options: Dict[str, Any]) -> bool:
        """Connect via HTTP/WebSocket."""
        
        import aiohttp
        
        start_time = time.time()
        
        try:
            # Create HTTP session
            self.session = aiohttp.ClientSession()
            
            # Test connection
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status != 200:
                    raise Exception(f"Server not healthy: {response.status}")
            
            # Establish WebSocket for streaming
            self.websocket = await self.session.ws_connect(f"{self.base_url.replace('http', 'ws')}/chat")
            
            self.connected = True
            self.metrics.connection_time = time.time() - start_time
            
            return True
            
        except Exception as e:
            await self._cleanup_failed_connection()
            raise e
    
    async def send_message(self, message: str) -> bool:
        """Send message via WebSocket."""
        
        if not self.websocket:
            return False
        
        try:
            message_data = {
                "type": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            }
            
            await self.websocket.send_json(message_data)
            self.metrics.message_count += 1
            
            return True
            
        except Exception as e:
            self.metrics.error_count += 1
            raise e
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """Receive messages via WebSocket."""
        
        try:
            async for msg in self.websocket:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    yield msg.data
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    raise Exception(f"WebSocket error: {msg.data}")
                
        except Exception as e:
            print(f"⚠️ Receive error: {e}")
    
    async def disconnect(self) -> bool:
        """Disconnect HTTP transport."""
        
        try:
            if self.websocket:
                await self.websocket.close()
                
            if self.session:
                await self.session.close()
            
            self.connected = False
            return True
            
        except Exception as e:
            print(f"⚠️ HTTP disconnect error: {e}")
            return False
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Custom Transport (50min)**

```python
class CustomTransport(Transport):
    """
    Implementar transport customizado.
    
    Escolha uma implementação:
    1. gRPCTransport - High performance RPC
    2. RedisTransport - Using Redis as message broker
    3. FileTransport - File-based communication
    4. MemoryTransport - In-memory for testing
    """
    
    def __init__(self, transport_type: str):
        super().__init__()
        self.transport_type = transport_type
        # TODO: Initialize custom transport
        
    async def connect(self, options: Dict[str, Any]) -> bool:
        # TODO: Implement custom connection logic
        pass
    
    async def send_message(self, message: str) -> bool:
        # TODO: Implement custom send logic
        pass
    
    async def receive_messages(self) -> AsyncIterator[str]:
        # TODO: Implement custom receive logic
        pass
    
    async def disconnect(self) -> bool:
        # TODO: Implement custom disconnect logic
        pass

# Performance comparison
async def benchmark_transports():
    """Benchmark different transport implementations."""
    
    transports = [
        OptimizedSubprocessTransport(),
        HTTPTransport(),
        CustomTransport("memory")
    ]
    
    results = {}
    
    for transport in transports:
        # Benchmark each transport
        start_time = time.time()
        
        await transport.connect({})
        
        # Send test messages
        for i in range(100):
            await transport.send_message(f"Test message {i}")
        
        await transport.disconnect()
        
        metrics = transport.get_metrics()
        results[transport.__class__.__name__] = {
            "connection_time": metrics.connection_time,
            "total_time": time.time() - start_time,
            "throughput": metrics.message_count / (time.time() - start_time)
        }
    
    # Compare results
    print("🏁 TRANSPORT BENCHMARK RESULTS")
    for name, result in results.items():
        print(f"{name}: {result['throughput']:.1f} msgs/sec")
```

### **🎯 Exercício 2: Transport Selection Strategy (30min)**

```python
class TransportSelector:
    """
    Implementar seleção inteligente de transport.
    
    Selection criteria:
    1. Performance requirements
    2. Reliability needs
    3. Network conditions
    4. Security requirements
    """
    
    def __init__(self):
        # TODO: Initialize transport selector
        pass
    
    async def select_optimal_transport(self, requirements: Dict[str, Any]) -> Transport:
        """Select best transport for requirements."""
        # TODO: Implement intelligent selection
        pass
    
    async def test_transport_capabilities(self, transport: Transport) -> Dict[str, Any]:
        """Test transport capabilities."""
        # TODO: Implement capability testing
        pass

# Test transport selection
async def test_transport_selection():
    selector = TransportSelector()
    
    # Test different requirement scenarios
    scenarios = [
        {"performance": "high", "reliability": "medium"},
        {"performance": "medium", "reliability": "high"},
        {"performance": "low", "reliability": "high", "security": "high"}
    ]
    
    for scenario in scenarios:
        transport = await selector.select_optimal_transport(scenario)
        print(f"Scenario {scenario}: Selected {transport.__class__.__name__}")
```

---

## 🎓 **RESUMO**

**Key Insights:** Transport abstraction permite flexibility e optimization específica para cada deployment scenario.

**Próxima:** [Message Parser Deep Engineering](curso_modulo_04_aula_03.md)