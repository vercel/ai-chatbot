# 📡 Aula 3: "Streaming Architecture" - Real-time Processing

**Módulo 2 - Aula 3 | Duração: 90min | Nível: Intermediário++**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar streaming de messages em tempo real
- ✅ Implementar backpressure handling profissional
- ✅ Desenvolver buffer management otimizado
- ✅ Criar interruption mechanisms robustos

---

## 🌊 **PARTE 1: Streaming Fundamentals** (30min)

### 🔬 **Real-time Data Flow Analysis**

```python
import asyncio
import json
from typing import AsyncIterator, Optional
from collections import deque
import time

class StreamingProcessor:
    """Professional streaming processor for Claude responses."""
    
    def __init__(self, buffer_size: int = 1024):
        self.buffer_size = buffer_size
        self.input_buffer = deque(maxlen=buffer_size)
        self.output_queue = asyncio.Queue()
        self.processing_stats = {
            "bytes_processed": 0,
            "messages_parsed": 0,
            "parse_errors": 0,
            "processing_time": 0
        }
        
    async def stream_processor(self, data_stream: AsyncIterator[bytes]) -> AsyncIterator[dict]:
        """Process streaming data with real-time parsing."""
        
        partial_line = ""
        start_time = time.time()
        
        async for chunk in data_stream:
            try:
                # Decode chunk
                text_chunk = chunk.decode('utf-8')
                self.processing_stats["bytes_processed"] += len(chunk)
                
                # Handle partial lines
                lines = (partial_line + text_chunk).split('\n')
                partial_line = lines.pop()  # Keep incomplete line
                
                # Process complete lines
                for line in lines:
                    if line.strip():
                        try:
                            message = json.loads(line)
                            self.processing_stats["messages_parsed"] += 1
                            yield message
                            
                        except json.JSONDecodeError as e:
                            self.processing_stats["parse_errors"] += 1
                            print(f"⚠️ JSON parse error: {e}")
                            
            except UnicodeDecodeError as e:
                print(f"⚠️ Encoding error: {e}")
                continue
        
        # Process final partial line
        if partial_line.strip():
            try:
                message = json.loads(partial_line)
                yield message
            except json.JSONDecodeError:
                print(f"⚠️ Final line parse error: {partial_line[:50]}...")
        
        self.processing_stats["processing_time"] = time.time() - start_time
    
    def get_performance_stats(self) -> dict:
        """Get streaming performance statistics."""
        stats = self.processing_stats.copy()
        
        if stats["processing_time"] > 0:
            stats["bytes_per_second"] = stats["bytes_processed"] / stats["processing_time"]
            stats["messages_per_second"] = stats["messages_parsed"] / stats["processing_time"]
            stats["error_rate"] = stats["parse_errors"] / max(stats["messages_parsed"], 1)
        
        return stats

# Real-world streaming example
async def claude_streaming_example():
    """Example of real Claude CLI streaming."""
    
    processor = StreamingProcessor()
    
    # Simulate Claude CLI subprocess
    process = await asyncio.create_subprocess_exec(
        "claude",
        "--interactive",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    try:
        # Send query
        query = '{"type": "user", "content": "Tell me a story"}\n'
        process.stdin.write(query.encode())
        await process.stdin.drain()
        
        # Stream responses
        async def read_stream():
            while True:
                chunk = await process.stdout.read(1024)
                if not chunk:
                    break
                yield chunk
        
        # Process streaming responses
        async for message in processor.stream_processor(read_stream()):
            print(f"📨 Received: {message.get('type')} message")
            
            # Handle different message types
            if message.get("type") == "assistant":
                for block in message.get("content", []):
                    if block.get("type") == "text":
                        print(f"🤖 Claude: {block.get('text', '')}")
                        
    finally:
        process.terminate()
        await process.wait()
        
        # Print performance stats
        stats = processor.get_performance_stats()
        print(f"\n📊 Streaming stats: {stats}")
```

### 🎛️ **Backpressure Handling**

```python
import asyncio
from typing import Callable, Any

class BackpressureManager:
    """Manage backpressure in streaming scenarios."""
    
    def __init__(self, max_queue_size: int = 100):
        self.max_queue_size = max_queue_size
        self.input_queue = asyncio.Queue(maxsize=max_queue_size)
        self.output_queue = asyncio.Queue()
        self.processing_semaphore = asyncio.Semaphore(10)  # Max 10 concurrent
        self.backpressure_triggered = False
        
    async def controlled_producer(self, data_source: AsyncIterator[Any]):
        """Producer with backpressure awareness."""
        
        async for item in data_source:
            try:
                # Try to put item in queue (non-blocking)
                self.input_queue.put_nowait(item)
                
            except asyncio.QueueFull:
                # Backpressure triggered
                if not self.backpressure_triggered:
                    print("🚨 Backpressure activated - slowing down producer")
                    self.backpressure_triggered = True
                
                # Wait for space in queue
                await self.input_queue.put(item)
                
            else:
                # Queue has space
                if self.backpressure_triggered:
                    print("✅ Backpressure relieved - resuming normal speed")
                    self.backpressure_triggered = False
    
    async def controlled_processor(self, processor_func: Callable):
        """Process items with controlled concurrency."""
        
        while True:
            try:
                # Get item from queue
                item = await asyncio.wait_for(
                    self.input_queue.get(),
                    timeout=1.0
                )
                
                # Process with semaphore control
                async with self.processing_semaphore:
                    result = await processor_func(item)
                    await self.output_queue.put(result)
                
                # Mark task done
                self.input_queue.task_done()
                
            except asyncio.TimeoutError:
                # No more items - exit gracefully
                break
    
    async def get_results(self) -> AsyncIterator[Any]:
        """Get processed results."""
        while True:
            try:
                result = await asyncio.wait_for(
                    self.output_queue.get(),
                    timeout=0.1
                )
                yield result
            except asyncio.TimeoutError:
                break

# Usage example
async def backpressure_demo():
    """Demonstrate backpressure handling."""
    
    manager = BackpressureManager(max_queue_size=5)  # Small queue for demo
    
    # Fast producer
    async def fast_data_source():
        for i in range(50):
            await asyncio.sleep(0.01)  # Fast production
            yield f"data_{i}"
    
    # Slow processor
    async def slow_processor(item):
        await asyncio.sleep(0.1)  # Slow processing
        return f"processed_{item}"
    
    # Run producer and processor concurrently
    producer_task = asyncio.create_task(
        manager.controlled_producer(fast_data_source())
    )
    
    processor_task = asyncio.create_task(
        manager.controlled_processor(slow_processor)
    )
    
    # Collect results
    results = []
    async for result in manager.get_results():
        results.append(result)
        print(f"📤 Result: {result}")
    
    # Wait for completion
    await producer_task
    await processor_task
    
    print(f"✅ Processed {len(results)} items with backpressure control")
```

---

## 🛑 **PARTE 2: Interruption Mechanisms** (30min)

### ⚡ **Real-time Interruption System**

```python
import asyncio
import signal
from typing import Optional, Callable

class InterruptibleClient:
    """Claude client with advanced interruption capabilities."""
    
    def __init__(self):
        self.current_operation: Optional[asyncio.Task] = None
        self.interrupt_callbacks: List[Callable] = []
        self.graceful_shutdown = True
        self.interrupt_count = 0
        
    def register_interrupt_handler(self, callback: Callable):
        """Register callback for interruption events."""
        self.interrupt_callbacks.append(callback)
    
    async def interruptible_query(self, prompt: str) -> AsyncIterator[dict]:
        """Query that can be interrupted cleanly."""
        
        # Setup interruption handling
        interrupt_event = asyncio.Event()
        
        async def query_task():
            """Main query execution."""
            try:
                # Send query to Claude CLI
                await self._send_query(prompt)
                
                # Stream responses
                async for response in self._stream_responses():
                    # Check for interruption
                    if interrupt_event.is_set():
                        print("🛑 Query interrupted - cleaning up")
                        await self._cleanup_interrupted_query()
                        return
                    
                    yield response
                    
            except asyncio.CancelledError:
                print("🛑 Query cancelled - performing cleanup")
                await self._cleanup_interrupted_query()
                raise
        
        # Setup interrupt signal handler
        def interrupt_handler():
            print("🛑 Interrupt signal received")
            interrupt_event.set()
            self.interrupt_count += 1
            
            # Call registered callbacks
            for callback in self.interrupt_callbacks:
                try:
                    callback()
                except Exception as e:
                    print(f"⚠️ Interrupt callback error: {e}")
        
        # Register signal handlers
        if self.graceful_shutdown:
            loop = asyncio.get_event_loop()
            loop.add_signal_handler(signal.SIGINT, interrupt_handler)
            loop.add_signal_handler(signal.SIGTERM, interrupt_handler)
        
        # Execute query with interruption support
        self.current_operation = asyncio.create_task(query_task())
        
        try:
            async for response in self.current_operation:
                yield response
        finally:
            self.current_operation = None
            
            # Cleanup signal handlers
            if self.graceful_shutdown:
                loop.remove_signal_handler(signal.SIGINT)
                loop.remove_signal_handler(signal.SIGTERM)
    
    async def _send_query(self, prompt: str):
        """Send query to Claude CLI."""
        # Implementation depends on transport layer
        print(f"📤 Sending query: {prompt[:50]}...")
        await asyncio.sleep(0.1)  # Simulate send delay
    
    async def _stream_responses(self) -> AsyncIterator[dict]:
        """Stream responses from Claude CLI."""
        # Simulate streaming responses
        for i in range(10):
            await asyncio.sleep(0.2)  # Simulate response delay
            yield {
                "type": "assistant",
                "content": [{"type": "text", "text": f"Response part {i+1}"}]
            }
    
    async def _cleanup_interrupted_query(self):
        """Clean up after query interruption."""
        print("🧹 Cleaning up interrupted query...")
        
        # Cleanup tasks:
        # 1. Send interrupt signal to Claude CLI
        # 2. Drain remaining responses
        # 3. Reset connection state
        # 4. Log interruption metrics
        
        await asyncio.sleep(0.1)  # Simulate cleanup
        print("✅ Cleanup complete")
    
    async def force_interrupt(self):
        """Force interrupt current operation."""
        if self.current_operation and not self.current_operation.done():
            print("💥 Force interrupting current operation")
            self.current_operation.cancel()
            
            try:
                await self.current_operation
            except asyncio.CancelledError:
                print("✅ Operation successfully cancelled")

# Advanced interruption with user controls
class UserControlledClient(InterruptibleClient):
    """Client with user-friendly interruption controls."""
    
    def __init__(self):
        super().__init__()
        self.user_interrupt_enabled = True
        
    async def start_interactive_session(self):
        """Interactive session with live interruption."""
        
        print("🎮 Interactive session started")
        print("💡 Press Ctrl+C to interrupt current query")
        print("💡 Type 'quit' to exit")
        
        while True:
            try:
                # Get user input
                prompt = await asyncio.get_event_loop().run_in_executor(
                    None, input, "\n👤 You: "
                )
                
                if prompt.lower() in ['quit', 'exit']:
                    break
                
                # Process query with interruption support
                response_parts = []
                
                async for response in self.interruptible_query(prompt):
                    response_parts.append(response)
                    
                    # Display response in real-time
                    if response.get("type") == "assistant":
                        for block in response.get("content", []):
                            if block.get("type") == "text":
                                print(f"🤖 Claude: {block.get('text')}")
                
                print(f"✅ Query completed - {len(response_parts)} response parts")
                
            except KeyboardInterrupt:
                print("\n🛑 Interrupt received")
                await self.force_interrupt()
                print("🔄 Ready for next query")
                
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print("👋 Session ended")
```

### 🔄 **Buffer Management Strategies**

```python
import asyncio
from collections import deque
from typing import Any, Optional
import sys

class AdaptiveBuffer:
    """Adaptive buffer that adjusts size based on data flow."""
    
    def __init__(self, initial_size: int = 1024):
        self.buffer = deque()
        self.max_size = initial_size
        self.size_history = deque(maxlen=10)
        self.overflow_count = 0
        self.underflow_count = 0
        
    def add_data(self, data: Any) -> bool:
        """Add data with adaptive sizing."""
        
        if len(self.buffer) >= self.max_size:
            self.overflow_count += 1
            self._handle_overflow()
            return False
        
        self.buffer.append(data)
        
        # Track buffer utilization
        utilization = len(self.buffer) / self.max_size
        self.size_history.append(utilization)
        
        # Adaptive resizing
        if len(self.size_history) == 10:
            avg_utilization = sum(self.size_history) / len(self.size_history)
            self._adjust_buffer_size(avg_utilization)
        
        return True
    
    def get_data(self) -> Optional[Any]:
        """Get data from buffer."""
        if not self.buffer:
            self.underflow_count += 1
            return None
        
        return self.buffer.popleft()
    
    def _handle_overflow(self):
        """Handle buffer overflow."""
        # Strategy: Remove oldest data
        if self.buffer:
            removed = self.buffer.popleft()
            print(f"⚠️ Buffer overflow - removed oldest data")
    
    def _adjust_buffer_size(self, avg_utilization: float):
        """Adjust buffer size based on utilization."""
        
        if avg_utilization > 0.8:  # High utilization - increase size
            new_size = min(self.max_size * 2, 10000)  # Cap at 10K
            if new_size != self.max_size:
                print(f"📈 Buffer size increased: {self.max_size} → {new_size}")
                self.max_size = new_size
                
        elif avg_utilization < 0.2:  # Low utilization - decrease size
            new_size = max(self.max_size // 2, 100)  # Min 100
            if new_size != self.max_size:
                print(f"📉 Buffer size decreased: {self.max_size} → {new_size}")
                self.max_size = new_size
    
    def get_buffer_stats(self) -> dict:
        """Get buffer performance statistics."""
        return {
            "current_size": len(self.buffer),
            "max_size": self.max_size,
            "utilization": len(self.buffer) / self.max_size,
            "overflow_count": self.overflow_count,
            "underflow_count": self.underflow_count,
            "avg_utilization": sum(self.size_history) / len(self.size_history) if self.size_history else 0
        }

# Memory-efficient streaming for large responses
class MemoryEfficientStreamer:
    """Streaming processor optimized for low memory usage."""
    
    def __init__(self, memory_limit_mb: int = 50):
        self.memory_limit = memory_limit_mb * 1024 * 1024  # Convert to bytes
        self.current_memory = 0
        self.processed_count = 0
        
    async def stream_with_memory_control(self, data_stream: AsyncIterator[str]) -> AsyncIterator[dict]:
        """Stream with memory usage control."""
        
        async for data_chunk in data_stream:
            chunk_size = sys.getsizeof(data_chunk)
            
            # Check memory limit
            if self.current_memory + chunk_size > self.memory_limit:
                await self._perform_memory_cleanup()
            
            # Process chunk
            self.current_memory += chunk_size
            
            try:
                # Parse and yield
                if data_chunk.strip():
                    message = json.loads(data_chunk)
                    yield message
                    self.processed_count += 1
                    
            except json.JSONDecodeError:
                pass  # Skip invalid JSON
            finally:
                # Release memory
                self.current_memory -= chunk_size
    
    async def _perform_memory_cleanup(self):
        """Perform memory cleanup when approaching limit."""
        print(f"🧹 Memory cleanup: {self.current_memory / 1024 / 1024:.1f}MB used")
        
        # Force garbage collection
        import gc
        gc.collect()
        
        # Update memory tracking
        self.current_memory = self.current_memory * 0.8  # Conservative estimate
        
        print(f"✅ Memory after cleanup: {self.current_memory / 1024 / 1024:.1f}MB")
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: High-Performance Streamer (40min)**

```python
class UltraStreamProcessor:
    """
    Implementar streaming processor ultra-otimizado.
    
    Requisitos de Performance:
    1. Process 10,000+ messages/second
    2. Memory usage < 100MB constant
    3. Latency < 1ms per message
    4. Zero data loss guarantee
    5. Graceful degradation under load
    """
    
    def __init__(self):
        # TODO: Implement ultra-optimized architecture
        # Hints:
        # - Use asyncio.Queue with appropriate sizes
        # - Implement connection pooling
        # - Use binary protocols where possible
        # - Implement smart buffering strategies
        pass
    
    async def ultra_stream(self, data_source) -> AsyncIterator[dict]:
        """Ultra-fast streaming implementation."""
        # TODO: Implement performance-optimized streaming
        pass
    
    async def benchmark_performance(self):
        """Benchmark against performance targets."""
        # TODO: Implement comprehensive benchmarking
        # Measure: throughput, latency, memory usage, error rate
        pass

# Performance target: 10,000 messages/second, <100MB memory
```

### **🎯 Exercício 2: Resilient Interruption System (30min)**

```python
class ResilientInterruptSystem:
    """
    Sistema de interrupção que nunca perde dados.
    
    Features:
    1. Graceful interruption sem data loss
    2. Recovery de partial responses
    3. User-controlled interruption modes
    4. Automatic cleanup após interruption
    """
    
    def __init__(self):
        # TODO: Implement resilient interruption
        pass
    
    async def interruptible_conversation(self, prompts: List[str]):
        """Conversa que pode ser interrompida safely."""
        # TODO: Implement safe interruption
        pass
    
    async def recover_from_interruption(self):
        """Recover conversation state after interruption."""
        # TODO: Implement state recovery
        pass

# Test interruption scenarios
async def test_interruption_scenarios():
    """Test various interruption scenarios."""
    system = ResilientInterruptSystem()
    
    # Test 1: Mid-response interruption
    # Test 2: Multiple rapid interruptions  
    # Test 3: Network interruption during streaming
    # Test 4: Process crash recovery
    
    pass
```

---

## 🎓 **RESUMO**

**Key Insights:** Streaming architecture requires careful balance entre performance, reliability, e user experience.

**Próxima:** [Conversation Patterns](curso_modulo_02_aula_04.md)