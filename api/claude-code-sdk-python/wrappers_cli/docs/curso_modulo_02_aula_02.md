# 🔄 Aula 2: "Client Lifecycle Deep Dive" - Connection Management

**Módulo 2 - Aula 2 | Duração: 90min | Nível: Intermediário+**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar ciclo de vida completo do ClaudeSDKClient
- ✅ Implementar connection pooling strategies
- ✅ Desenvolver error recovery mechanisms robustos
- ✅ Otimizar resource cleanup patterns

---

## 🔌 **PARTE 1: Connection Lifecycle Analysis** (30min)

### 🎯 **ClaudeSDKClient Internal Flow**

```python
import asyncio
import subprocess
from typing import Optional
from pathlib import Path

class AdvancedClaudeClient:
    """
    Análise do lifecycle completo baseado no cliente real.
    """
    
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.connected = False
        self.connection_time = None
        self.message_count = 0
        self.last_activity = None
        
    async def connect(self):
        """Enhanced connection with detailed monitoring."""
        if self.connected:
            raise Exception("Already connected")
            
        print("🔌 Initiating connection to Claude CLI...")
        
        try:
            # Start subprocess with monitoring
            start_time = time.time()
            
            self.process = await asyncio.create_subprocess_exec(
                "claude",
                "--interactive",
                "--dangerously-skip-permissions",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Wait for ready signal
            await self._wait_for_ready()
            
            self.connection_time = time.time() - start_time
            self.connected = True
            self.last_activity = time.time()
            
            print(f"✅ Connected in {self.connection_time:.3f}s")
            
        except Exception as e:
            await self._cleanup_failed_connection()
            raise Exception(f"Connection failed: {e}")
    
    async def _wait_for_ready(self, timeout: float = 10.0):
        """Wait for Claude CLI to be ready."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # Check if process is still running
            if self.process.poll() is not None:
                stderr_output = await self.process.stderr.read()
                raise Exception(f"Process died: {stderr_output.decode()}")
            
            # Try to send test message
            try:
                test_msg = '{"type": "ping"}\n'
                self.process.stdin.write(test_msg.encode())
                await self.process.stdin.drain()
                
                # Wait for any response (ready signal)
                await asyncio.wait_for(
                    self.process.stdout.readline(),
                    timeout=1.0
                )
                return  # Ready!
                
            except asyncio.TimeoutError:
                await asyncio.sleep(0.1)
                continue
        
        raise Exception(f"Claude CLI not ready after {timeout}s")
    
    async def _cleanup_failed_connection(self):
        """Clean up after failed connection attempt."""
        if self.process:
            try:
                self.process.terminate()
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self.process.kill()
                await self.process.wait()
            finally:
                self.process = None
        
        self.connected = False
        
    async def send_message(self, message: str):
        """Send message with comprehensive error handling."""
        if not self.connected:
            raise Exception("Not connected - call connect() first")
            
        try:
            # Check process health
            if self.process.poll() is not None:
                raise Exception("Process died unexpectedly")
            
            # Send message
            message_data = f'{{"type": "user", "content": "{message}"}}\n'
            self.process.stdin.write(message_data.encode())
            await self.process.stdin.drain()
            
            self.message_count += 1
            self.last_activity = time.time()
            
        except BrokenPipeError:
            await self._handle_broken_pipe()
        except Exception as e:
            await self._handle_send_error(e)
    
    async def _handle_broken_pipe(self):
        """Handle broken pipe errors."""
        print("🔧 Broken pipe detected - attempting reconnection")
        await self.disconnect()
        await asyncio.sleep(1)
        await self.connect()
        
    async def _handle_send_error(self, error: Exception):
        """Handle send errors with recovery."""
        print(f"❌ Send error: {error}")
        # Implement recovery strategy based on error type
        
    async def disconnect(self):
        """Enhanced disconnection with cleanup verification."""
        if not self.connected:
            return
            
        print("🔌 Disconnecting...")
        
        try:
            if self.process:
                # Send shutdown signal
                shutdown_msg = '{"type": "shutdown"}\n'
                self.process.stdin.write(shutdown_msg.encode())
                await self.process.stdin.drain()
                
                # Wait for graceful shutdown
                try:
                    await asyncio.wait_for(self.process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    print("⚠️ Graceful shutdown timeout - forcing termination")
                    self.process.terminate()
                    await asyncio.wait_for(self.process.wait(), timeout=2.0)
                
        except Exception as e:
            print(f"⚠️ Shutdown error: {e}")
        finally:
            self.process = None
            self.connected = False
            
        session_duration = time.time() - (self.last_activity or time.time())
        print(f"✅ Session stats: {self.message_count} messages, {session_duration:.1f}s duration")
```

### 🔄 **Connection Pool Implementation**

```python
import asyncio
from typing import List, Optional
import time

class ClaudeConnectionPool:
    """Professional connection pooling for high-volume usage."""
    
    def __init__(self, max_connections: int = 5):
        self.max_connections = max_connections
        self.available_connections: List[AdvancedClaudeClient] = []
        self.active_connections: List[AdvancedClaudeClient] = []
        self.total_created = 0
        
    async def get_connection(self) -> AdvancedClaudeClient:
        """Get connection from pool or create new one."""
        
        # Try to reuse existing connection
        if self.available_connections:
            client = self.available_connections.pop()
            self.active_connections.append(client)
            print(f"♻️ Reusing connection (pool size: {len(self.available_connections)})")
            return client
        
        # Create new connection if under limit
        if len(self.active_connections) < self.max_connections:
            client = AdvancedClaudeClient()
            await client.connect()
            
            self.active_connections.append(client)
            self.total_created += 1
            
            print(f"🆕 New connection created (total: {self.total_created})")
            return client
        
        # Wait for connection to become available
        print("⏳ Waiting for available connection...")
        while not self.available_connections:
            await asyncio.sleep(0.1)
        
        return await self.get_connection()
    
    async def return_connection(self, client: AdvancedClaudeClient):
        """Return connection to pool."""
        if client in self.active_connections:
            self.active_connections.remove(client)
            
            # Check if connection is still healthy
            if client.connected and client.process and client.process.poll() is None:
                self.available_connections.append(client)
                print(f"↩️ Connection returned to pool")
            else:
                await client.disconnect()
                print(f"🗑️ Unhealthy connection discarded")
    
    async def close_all(self):
        """Close all connections in pool."""
        all_connections = self.available_connections + self.active_connections
        
        print(f"🔌 Closing {len(all_connections)} connections...")
        
        for client in all_connections:
            try:
                await client.disconnect()
            except Exception as e:
                print(f"⚠️ Error closing connection: {e}")
        
        self.available_connections.clear()
        self.active_connections.clear()
        
        print("✅ All connections closed")

# Usage example
async def pool_usage_example():
    """Example of using connection pool."""
    pool = ClaudeConnectionPool(max_connections=3)
    
    try:
        # Simulate concurrent usage
        async def worker(worker_id: int):
            client = await pool.get_connection()
            try:
                await client.send_message(f"Hello from worker {worker_id}")
                await asyncio.sleep(1)  # Simulate work
            finally:
                await pool.return_connection(client)
        
        # Run multiple workers concurrently
        await asyncio.gather(*[worker(i) for i in range(10)])
        
    finally:
        await pool.close_all()
```

---

## 🛡️ **PARTE 3: Error Recovery Mechanisms** (30min)

### 🚨 **Comprehensive Error Handling**

```python
import asyncio
import logging
from enum import Enum
from typing import Dict, Callable, Any

class ConnectionState(Enum):
    """Connection state tracking."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting" 
    CONNECTED = "connected"
    ERROR = "error"
    RECOVERING = "recovering"

class ResilientClaudeClient:
    """Claude client with advanced error recovery."""
    
    def __init__(self):
        self.state = ConnectionState.DISCONNECTED
        self.retry_count = 0
        self.max_retries = 3
        self.backoff_factor = 2.0
        self.error_handlers: Dict[type, Callable] = {}
        
        # Setup default error handlers
        self._setup_error_handlers()
        
    def _setup_error_handlers(self):
        """Setup error handling strategies."""
        self.error_handlers = {
            subprocess.TimeoutExpired: self._handle_timeout_error,
            BrokenPipeError: self._handle_broken_pipe,
            ConnectionResetError: self._handle_connection_reset,
            PermissionError: self._handle_permission_error,
            FileNotFoundError: self._handle_cli_not_found
        }
    
    async def connect_with_retry(self):
        """Connect with automatic retry logic."""
        self.state = ConnectionState.CONNECTING
        
        for attempt in range(self.max_retries + 1):
            try:
                await self._attempt_connection()
                self.state = ConnectionState.CONNECTED
                self.retry_count = 0
                print(f"✅ Connected on attempt {attempt + 1}")
                return
                
            except Exception as e:
                self.retry_count = attempt + 1
                self.state = ConnectionState.ERROR
                
                if attempt < self.max_retries:
                    delay = self.backoff_factor ** attempt
                    print(f"⚠️ Connection attempt {attempt + 1} failed: {e}")
                    print(f"🔄 Retrying in {delay:.1f}s...")
                    await asyncio.sleep(delay)
                else:
                    self.state = ConnectionState.DISCONNECTED
                    raise Exception(f"Failed to connect after {self.max_retries + 1} attempts: {e}")
    
    async def _attempt_connection(self):
        """Single connection attempt."""
        # Implement actual connection logic
        self.process = await asyncio.create_subprocess_exec(
            "claude",
            "--interactive", 
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Test connection
        await self._verify_connection()
    
    async def _verify_connection(self):
        """Verify connection is working."""
        test_message = '{"type": "ping"}\n'
        self.process.stdin.write(test_message.encode())
        await self.process.stdin.drain()
        
        # Wait for response
        try:
            response = await asyncio.wait_for(
                self.process.stdout.readline(),
                timeout=5.0
            )
            if not response:
                raise Exception("No response from Claude CLI")
        except asyncio.TimeoutError:
            raise Exception("Claude CLI not responding")
    
    async def send_with_recovery(self, message: str):
        """Send message with automatic recovery."""
        if self.state != ConnectionState.CONNECTED:
            await self.connect_with_retry()
        
        try:
            await self._send_message_direct(message)
            
        except Exception as e:
            # Try error-specific recovery
            error_type = type(e)
            if error_type in self.error_handlers:
                await self.error_handlers[error_type](e)
                # Retry after recovery
                await self._send_message_direct(message)
            else:
                raise
    
    async def _send_message_direct(self, message: str):
        """Direct message sending."""
        if self.process.poll() is not None:
            raise ConnectionResetError("Process died")
            
        message_json = f'{{"type": "user", "content": "{message}"}}\n'
        self.process.stdin.write(message_json.encode())
        await self.process.stdin.drain()
    
    # Error handlers
    async def _handle_timeout_error(self, error):
        """Handle timeout errors."""
        print("🕐 Timeout detected - checking process health")
        if self.process and self.process.poll() is None:
            # Process alive but slow - continue waiting
            pass
        else:
            # Process died - reconnect
            await self._reconnect()
    
    async def _handle_broken_pipe(self, error):
        """Handle broken pipe errors."""
        print("🔧 Broken pipe - reconnecting")
        await self._reconnect()
    
    async def _handle_connection_reset(self, error):
        """Handle connection reset."""
        print("🔄 Connection reset - reconnecting")
        await self._reconnect()
        
    async def _handle_permission_error(self, error):
        """Handle permission errors."""
        print("🔒 Permission error - check Claude CLI installation")
        raise Exception("Permission denied - check Claude CLI setup")
        
    async def _handle_cli_not_found(self, error):
        """Handle CLI not found."""
        print("❌ Claude CLI not found - install Claude Code first")
        raise Exception("Claude CLI not installed")
    
    async def _reconnect(self):
        """Internal reconnection logic."""
        self.state = ConnectionState.RECOVERING
        
        # Cleanup old connection
        await self._force_disconnect()
        
        # Reconnect
        await self.connect_with_retry()
        
    async def _force_disconnect(self):
        """Force disconnect without graceful shutdown."""
        if self.process:
            try:
                self.process.terminate()
                await asyncio.wait_for(self.process.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                self.process.kill()
                await self.process.wait()
            finally:
                self.process = None
                
        self.state = ConnectionState.DISCONNECTED
```

### 🧪 **Connection Health Monitoring**

```python
import time
from dataclasses import dataclass
from typing import List

@dataclass
class ConnectionMetrics:
    """Metrics for connection health monitoring."""
    connection_time: float
    message_count: int
    error_count: int
    last_activity: float
    uptime: float
    throughput: float  # messages per second

class ConnectionHealthMonitor:
    """Monitor connection health and performance."""
    
    def __init__(self):
        self.metrics_history: List[ConnectionMetrics] = []
        self.current_session_start = time.time()
        self.error_count = 0
        self.message_count = 0
        
    def record_successful_message(self):
        """Record successful message sending."""
        self.message_count += 1
        
    def record_error(self, error: Exception):
        """Record error occurrence."""
        self.error_count += 1
        print(f"📊 Error recorded: {type(error).__name__}")
        
    def get_current_metrics(self) -> ConnectionMetrics:
        """Get current session metrics."""
        uptime = time.time() - self.current_session_start
        throughput = self.message_count / uptime if uptime > 0 else 0
        
        return ConnectionMetrics(
            connection_time=0,  # Set during connection
            message_count=self.message_count,
            error_count=self.error_count,
            last_activity=time.time(),
            uptime=uptime,
            throughput=throughput
        )
    
    def analyze_health(self) -> Dict[str, str]:
        """Analyze connection health status."""
        metrics = self.get_current_metrics()
        
        health_status = {}
        
        # Error rate analysis
        error_rate = metrics.error_count / max(metrics.message_count, 1)
        if error_rate < 0.01:  # < 1%
            health_status["error_rate"] = "Excellent"
        elif error_rate < 0.05:  # < 5%
            health_status["error_rate"] = "Good"
        else:
            health_status["error_rate"] = "Poor"
        
        # Throughput analysis
        if metrics.throughput > 10:  # > 10 msgs/sec
            health_status["throughput"] = "Excellent"
        elif metrics.throughput > 5:  # > 5 msgs/sec
            health_status["throughput"] = "Good"
        else:
            health_status["throughput"] = "Poor"
        
        # Uptime analysis
        if metrics.uptime > 3600:  # > 1 hour
            health_status["stability"] = "Excellent"
        elif metrics.uptime > 600:  # > 10 minutes
            health_status["stability"] = "Good"
        else:
            health_status["stability"] = "Starting"
            
        return health_status
    
    def generate_health_report(self) -> str:
        """Generate comprehensive health report."""
        metrics = self.get_current_metrics()
        health = self.analyze_health()
        
        report = [
            "📊 CONNECTION HEALTH REPORT",
            "=" * 30,
            f"Uptime: {metrics.uptime:.1f}s",
            f"Messages: {metrics.message_count}",
            f"Errors: {metrics.error_count}",
            f"Throughput: {metrics.throughput:.2f} msgs/sec",
            f"Error Rate: {health['error_rate']}",
            f"Performance: {health['throughput']}",
            f"Stability: {health['stability']}"
        ]
        
        return "\n".join(report)
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Resilient Client Implementation (40min)**

```python
class UltraResilientClient:
    """
    Implementar cliente ultra-resistente a falhas.
    
    Requisitos:
    1. Automatic reconnection com exponential backoff
    2. Message queuing durante disconnections
    3. Health monitoring contínuo
    4. Graceful degradation
    5. Connection pooling opcional
    """
    
    def __init__(self):
        # TODO: Implement ultra-resilient architecture
        pass
    
    async def send_guaranteed(self, message: str) -> bool:
        """Garantir que mensagem será enviada eventually."""
        # TODO: Implement guaranteed delivery
        # - Queue messages during outages
        # - Retry with backoff
        # - Persist undelivered messages
        # - Return success/failure status
        pass
    
    async def maintain_connection(self):
        """Background task para manter conexão saudável."""
        # TODO: Implement connection maintenance
        # - Periodic health checks
        # - Preemptive reconnection
        # - Resource cleanup
        # - Performance monitoring
        pass

# Test scenarios
async def test_resilience():
    """Test client resilience under various failure conditions."""
    client = UltraResilientClient()
    
    # Test 1: Network interruption simulation
    # Test 2: Process crash recovery
    # Test 3: High load resilience
    # Test 4: Memory pressure handling
    
    pass
```

### **🎯 Exercício 2: Connection Pool Optimization (20min)**

```python
class OptimizedConnectionPool:
    """
    Otimizar connection pool para maximum efficiency.
    
    Objetivos:
    1. Minimize connection creation overhead
    2. Maximize connection reuse
    3. Implement intelligent load balancing
    4. Add connection health scoring
    """
    
    def __init__(self):
        # TODO: Advanced pool implementation
        pass
    
    async def get_best_connection(self):
        """Get best available connection based on health metrics."""
        # TODO: Implement connection scoring and selection
        pass
    
    async def rebalance_connections(self):
        """Rebalance connections based on usage patterns."""
        # TODO: Implement dynamic rebalancing
        pass

# Performance target: <10ms connection acquisition time
```

---

## 🎓 **RESUMO**

**Key Insights:** Connection management é foundation para reliable Claude applications.

**Próxima:** [Streaming Architecture](curso_modulo_02_aula_03.md)