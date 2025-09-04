# ⚡ Aula 3: "Async Programming Mastery" - Concurrency Deep Dive

**Módulo 1 - Aula 3 | Duração: 90min | Nível: Técnico Básico++**

---

## 🎯 **Objetivos de Aprendizagem**

Ao final desta aula, você será capaz de:
- ✅ Dominar event loops e async/await fundamentalmente
- ✅ Debugar código async como um expert
- ✅ Evitar todos os pitfalls comuns de async programming
- ✅ Otimizar performance de código concurrent

---

## 🔄 **PARTE 1: Event Loop Mastery** (30min)

### 🧠 **Async Programming Mental Model**

#### **🎭 Analogia: Restaurante com 1 Garçom Eficiente**

```python
# 🚫 SYNC (Garçom ineficiente):
def sync_waiter():
    order1 = take_order_customer1()    # 2min waiting
    cook1 = cook_food(order1)          # 15min waiting  
    serve1 = serve_customer1(cook1)    # 1min
    
    order2 = take_order_customer2()    # 2min waiting
    cook2 = cook_food(order2)          # 15min waiting
    serve2 = serve_customer2(cook2)    # 1min
    
    # Total: 36min for 2 customers 😱

# ✅ ASYNC (Garçom inteligente):
async def async_waiter():
    # Starts both orders simultaneously
    order1_task = asyncio.create_task(take_order_customer1())
    order2_task = asyncio.create_task(take_order_customer2())
    
    # While orders cook, can do other things
    cook1_task = asyncio.create_task(cook_food(await order1_task))
    cook2_task = asyncio.create_task(cook_food(await order2_task))
    
    # Serve when ready
    await serve_customer1(await cook1_task)
    await serve_customer2(await cook2_task)
    
    # Total: 18min for 2 customers 🚀 (50% faster!)
```

### 🔬 **Event Loop Internals Deep Dive**

#### **⚙️ Como o Event Loop Realmente Funciona**

```python
# 🧪 Simulação do Event Loop (simplificado)
import asyncio
import time
from collections import deque

class SimpleEventLoop:
    """Simulação educacional do asyncio event loop."""
    
    def __init__(self):
        self.ready_queue = deque()      # Tasks prontos para executar
        self.waiting_tasks = {}         # Tasks esperando I/O
        self.time_heap = []            # Tasks com sleep/timeout
        self.running = False
        
    def call_soon(self, callback):
        """Schedule callback para próxima iteração."""
        self.ready_queue.append(callback)
        
    def call_later(self, delay, callback):
        """Schedule callback após delay."""
        when = time.time() + delay
        self.time_heap.append((when, callback))
        self.time_heap.sort()  # Maintain order
        
    def run_once(self):
        """Single iteration of event loop."""
        # 1. Execute ready tasks
        while self.ready_queue:
            task = self.ready_queue.popleft()
            try:
                task()
            except Exception as e:
                print(f"Task error: {e}")
        
        # 2. Check timed tasks
        now = time.time()
        while self.time_heap and self.time_heap[0][0] <= now:
            _, callback = self.time_heap.pop(0)
            self.ready_queue.append(callback)
            
        # 3. Check I/O (simplified - just sleep)
        if not self.ready_queue and not self.time_heap:
            return False  # Nothing to do
        
        return True
    
    def run_until_complete(self, coro):
        """Run coroutine until completion."""
        self.running = True
        task = asyncio.ensure_future(coro)
        
        while not task.done() and self.running:
            if not self.run_once():
                break
                
        return task.result() if task.done() else None

# 🎯 Real asyncio internals:
import asyncio

def analyze_event_loop():
    """Analyze current event loop."""
    loop = asyncio.get_event_loop()
    print(f"Loop type: {type(loop).__name__}")
    print(f"Running: {loop.is_running()}")
    print(f"Closed: {loop.is_closed()}")
    print(f"Debug mode: {loop.get_debug()}")
    
    # Policy analysis
    policy = asyncio.get_event_loop_policy()
    print(f"Policy: {type(policy).__name__}")
```

#### **🚀 asyncio.run() vs Manual Loop Management**

```python
import asyncio
import time

# ✅ Modern approach (Python 3.7+)
async def modern_async():
    await asyncio.sleep(0.1)
    return "Modern way"

result1 = asyncio.run(modern_async())
print(f"Result: {result1}")

# 🔧 Manual loop management (when needed)
async def manual_async():
    await asyncio.sleep(0.1)  
    return "Manual way"

# Get or create loop
try:
    loop = asyncio.get_running_loop()
    # We're already in async context
    result2 = await manual_async()
except RuntimeError:
    # No loop running, create one
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result2 = loop.run_until_complete(manual_async())
    finally:
        loop.close()

# 🎯 When to use manual approach:
# 1. Custom event loop policies
# 2. Integration with other event loops (Qt, GTK)
# 3. Advanced debugging scenarios
# 4. Library development
```

### ⚡ **anyio vs asyncio - Universal Async**

#### **🌐 Why anyio in Claude SDK**

```python
# ❌ asyncio-only approach:
import asyncio

async def asyncio_only_query():
    """Locked to asyncio - limits compatibility."""
    await asyncio.sleep(1)  # Only works with asyncio
    # SDK would only work in asyncio applications

# ✅ anyio approach (used in SDK):
import anyio

async def universal_query():
    """Works with any async backend."""
    await anyio.sleep(1)  # Works with asyncio, trio, curio
    # SDK works in ANY async application!

# 🎯 Real-world impact:
# Web frameworks using different backends:
# - FastAPI (asyncio)
# - Quart (asyncio) 
# - Trio-based apps
# - Curio applications
# All can use Claude SDK without issues!
```

#### **🔬 Backend Comparison**

```python
import time
import anyio

async def backend_benchmark():
    """Compare performance across backends."""
    
    async def cpu_bound_task():
        # Simulate some work
        await anyio.sleep(0.001)
        return sum(range(1000))
    
    backends = ['asyncio', 'trio']
    
    for backend in backends:
        print(f"\n🧪 Testing {backend}:")
        
        start_time = time.time()
        
        async def run_tasks():
            # Run 100 concurrent tasks
            async with anyio.create_task_group() as tg:
                for _ in range(100):
                    tg.start_soon(cpu_bound_task)
        
        try:
            anyio.run(run_tasks, backend=backend)
            duration = time.time() - start_time
            print(f"   Duration: {duration:.3f}s")
            print(f"   Tasks/sec: {100/duration:.1f}")
        except ImportError:
            print(f"   {backend} not available")

# Run comparison
if __name__ == "__main__":
    anyio.run(backend_benchmark)
```

---

## 🧪 **PARTE 2: Common Async Pitfalls & Solutions** (30min)

### 🚨 **Pitfall 1: Blocking the Event Loop**

#### **❌ Problem Code**
```python
import asyncio
import time
import requests  # Sync library

async def bad_example():
    """DON'T DO THIS - blocks event loop!"""
    print("Starting bad async function...")
    
    # 🚫 BLOCKING OPERATION in async function
    response = requests.get("https://httpbin.org/delay/2")  # 2s block!
    
    print("This will only run after 2s of BLOCKING")
    return response.json()

# Result: Event loop is completely blocked for 2 seconds
# Other async tasks cannot run during this time!
```

#### **✅ Solution Code**
```python
import asyncio
import aiohttp  # Async HTTP library

async def good_example():
    """Proper async HTTP - non-blocking."""
    print("Starting good async function...")
    
    # ✅ NON-BLOCKING async operation
    async with aiohttp.ClientSession() as session:
        async with session.get("https://httpbin.org/delay/2") as response:
            print("Other tasks can run while waiting!")
            return await response.json()

# Result: Event loop continues serving other tasks while waiting
```

#### **🔧 Advanced Solution: Thread Pool for Sync Code**
```python
import asyncio
import requests
import concurrent.futures

async def hybrid_solution():
    """When you MUST use sync libraries in async code."""
    
    # ✅ Run blocking code in thread pool
    loop = asyncio.get_event_loop()
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # This runs in separate thread - doesn't block event loop
        response = await loop.run_in_executor(
            executor, 
            requests.get, 
            "https://httpbin.org/delay/2"
        )
        
    print("Event loop stayed responsive!")
    return response.json()

# 🎯 Use cases:
# - Legacy sync libraries 
# - File I/O operations
# - CPU-intensive computations
# - Database queries with sync drivers
```

### 🚨 **Pitfall 2: asyncio.run() in Running Loop**

#### **❌ Problem Scenario**
```python
import asyncio

async def inner_task():
    return "Hello from inner"

async def problematic_function():
    """This will fail in Jupyter/existing async context."""
    
    # 🚫 WILL CRASH if already in async context
    result = asyncio.run(inner_task())  # RuntimeError!
    return result

# Common in:
# - Jupyter notebooks
# - FastAPI endpoints  
# - Other async applications
```

#### **✅ Universal Solution**
```python
import asyncio
import anyio

async def smart_function():
    """Works in ANY context - async or sync."""
    
    try:
        # Check if we're in async context
        loop = asyncio.get_running_loop()
        # We're already async - just await
        result = await inner_task()
    except RuntimeError:
        # No loop running - safe to use anyio.run
        result = await anyio.run(inner_task)
        
    return result

# Even smarter - detect context automatically:
async def ultra_smart_function():
    """Automatic context detection."""
    import inspect
    
    if inspect.iscoroutinefunction(inner_task):
        # We know it's a coroutine
        try:
            # Try direct await (fastest)
            return await inner_task()
        except RuntimeError:
            # Fallback to anyio
            return await anyio.run(inner_task)
    else:
        # Regular function call
        return inner_task()
```

### 🚨 **Pitfall 3: Forgotten await**

#### **❌ Common Mistakes**
```python
import asyncio

async def async_operation():
    await asyncio.sleep(1)
    return "Done"

async def mistake_demo():
    """Common await mistakes."""
    
    # 🚫 MISTAKE 1: Missing await
    result1 = async_operation()  # Returns coroutine object!
    print(type(result1))  # <class 'coroutine'>
    print(result1)        # <coroutine object async_operation at 0x...>
    
    # 🚫 MISTAKE 2: await on non-async function
    def sync_func():
        return "sync result"
    
    # result2 = await sync_func()  # SyntaxError!
    
    # ✅ CORRECT usage
    result3 = await async_operation()  # Actual result
    print(result3)  # "Done"

# 🔍 Detection tools:
import warnings

def detect_forgotten_awaits():
    """Enable warnings for unawaited coroutines."""
    warnings.simplefilter('always', RuntimeWarning)
    
    # This will trigger warning:
    async def test():
        async_operation()  # Warning: coroutine never awaited
    
    asyncio.run(test())
```

#### **✅ Best Practices for Avoiding Mistakes**

```python
import asyncio
from typing import Awaitable, Union

# 🛠️ Type hints help catch mistakes
async def type_safe_function(data: str) -> str:
    """Clear async function signature."""
    result = await async_operation()  # Type checker ensures await
    return f"Processed: {data} -> {result}"

# 🔧 Wrapper for sync/async compatibility  
def smart_await(obj: Union[Awaitable, object]):
    """Handle both sync and async objects."""
    if asyncio.iscoroutine(obj):
        # It's async - need to await in async context
        return obj
    else:
        # It's sync - return directly
        return obj

# 🧪 Testing with proper async setup
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """Proper async testing."""
    result = await async_operation()
    assert result == "Done"

# 🎯 Development tools:
# 1. mypy for type checking
# 2. pylint async warnings
# 3. pytest-asyncio for testing
# 4. IDE async/await highlighting
```

---

## 🔍 **PARTE 3: Debugging Async Code Like a Pro** (30min)

### 🛠️ **Advanced Debugging Tools**

#### **🔬 Event Loop Debugging**
```python
import asyncio
import logging
import time

# Enable debug mode
asyncio.get_event_loop().set_debug(True)

# Configure logging for asyncio
logging.basicConfig(level=logging.DEBUG)
asyncio_logger = logging.getLogger('asyncio')

async def debug_demo():
    """Demonstrate debugging techniques."""
    
    # 1. Task tracking
    print("Current tasks:")
    for task in asyncio.all_tasks():
        print(f"  Task: {task.get_name()} - {task}")
    
    # 2. Slow callback detection
    async def slow_callback():
        time.sleep(0.1)  # Blocking operation - will be detected!
        
    await slow_callback()
    
    # 3. Memory usage tracking
    import gc
    import sys
    
    tasks_count = len(asyncio.all_tasks())
    memory_usage = sys.getsizeof(gc.get_objects())
    print(f"Tasks: {tasks_count}, Memory objects: {len(gc.get_objects())}")

# Run with debugging
asyncio.run(debug_demo())
```

#### **📊 Performance Profiling**
```python
import asyncio
import time
import cProfile
import pstats

async def profile_async_code():
    """Profile async code performance."""
    
    async def cpu_bound_async():
        # Simulate CPU work
        await asyncio.sleep(0)  # Yield control
        return sum(range(10000))
    
    async def io_bound_async():
        # Simulate I/O wait
        await asyncio.sleep(0.1)
        return "IO complete"
    
    # Profile with cProfile
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Run concurrent tasks
    results = await asyncio.gather(
        *[cpu_bound_async() for _ in range(100)],
        *[io_bound_async() for _ in range(10)]
    )
    
    profiler.disable()
    
    # Analyze results
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(10)  # Top 10 functions

# Advanced profiling with custom metrics
class AsyncProfiler:
    """Custom async performance profiler."""
    
    def __init__(self):
        self.task_stats = {}
        self.start_times = {}
        
    def start_task_timing(self, task_name: str):
        """Start timing a task."""
        self.start_times[task_name] = time.time()
        
    def end_task_timing(self, task_name: str):
        """End timing and record stats."""
        if task_name in self.start_times:
            duration = time.time() - self.start_times[task_name]
            
            if task_name not in self.task_stats:
                self.task_stats[task_name] = []
            
            self.task_stats[task_name].append(duration)
            del self.start_times[task_name]
    
    def report(self):
        """Generate performance report."""
        print("🔍 ASYNC PERFORMANCE REPORT")
        print("=" * 40)
        
        for task_name, durations in self.task_stats.items():
            avg_duration = sum(durations) / len(durations)
            min_duration = min(durations)
            max_duration = max(durations)
            
            print(f"📊 {task_name}:")
            print(f"   Calls: {len(durations)}")
            print(f"   Avg: {avg_duration:.4f}s")
            print(f"   Min: {min_duration:.4f}s") 
            print(f"   Max: {max_duration:.4f}s")
            print()

# Usage example
profiler = AsyncProfiler()

async def profiled_function():
    profiler.start_task_timing("database_query")
    await asyncio.sleep(0.05)  # Simulate DB query
    profiler.end_task_timing("database_query")
    
    profiler.start_task_timing("api_call")
    await asyncio.sleep(0.1)   # Simulate API call
    profiler.end_task_timing("api_call")

async def run_profiling():
    # Run multiple times for statistics
    await asyncio.gather(*[profiled_function() for _ in range(10)])
    profiler.report()
```

### 🔧 **Debugging Tools for Claude SDK**

#### **🎯 SDK-Specific Debugging**
```python
import asyncio
import logging
from src import ClaudeSDKClient, query

# Configure logging for Claude SDK debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Enable specific loggers
claude_logger = logging.getLogger('claude_sdk')
subprocess_logger = logging.getLogger('asyncio.subprocess')

async def debug_claude_sdk():
    """Debug Claude SDK operations."""
    
    print("🔍 DEBUGGING CLAUDE SDK")
    print("=" * 30)
    
    # 1. Connection debugging
    client = ClaudeSDKClient()
    
    try:
        print("📡 Connecting to Claude...")
        await client.connect()
        print("✅ Connection successful")
        
        # 2. Query debugging with timing
        start_time = time.time()
        await client.query("What is 2+2?")
        
        print("📨 Processing response...")
        async for message in client.receive_response():
            duration = time.time() - start_time
            print(f"⏱️  Message received after {duration:.3f}s")
            print(f"📄 Message type: {type(message).__name__}")
            
            if hasattr(message, 'content'):
                print(f"📝 Content blocks: {len(message.content)}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        await client.disconnect()
        print("🔌 Disconnected")

# Memory leak detection for long-running applications
import gc
import weakref

class MemoryDebugger:
    """Detect memory leaks in async code."""
    
    def __init__(self):
        self.tracked_objects = []
        
    def track_object(self, obj, name: str):
        """Track object for memory leaks."""
        weak_ref = weakref.ref(obj, lambda ref: self._on_object_deleted(name))
        self.tracked_objects.append((weak_ref, name))
        
    def _on_object_deleted(self, name: str):
        """Called when tracked object is garbage collected."""
        print(f"🗑️  Object deleted: {name}")
        
    def check_leaks(self):
        """Check for potential memory leaks."""
        alive_objects = []
        for weak_ref, name in self.tracked_objects:
            if weak_ref() is not None:
                alive_objects.append(name)
        
        if alive_objects:
            print(f"⚠️  Potential leaks: {alive_objects}")
        else:
            print("✅ No memory leaks detected")

# Usage
memory_debugger = MemoryDebugger()

async def test_memory_leaks():
    """Test for memory leaks in Claude SDK usage."""
    
    for i in range(10):
        client = ClaudeSDKClient()
        memory_debugger.track_object(client, f"client_{i}")
        
        await client.connect()
        await client.disconnect()
        
        # Force garbage collection
        del client
        gc.collect()
    
    # Check for leaks
    memory_debugger.check_leaks()
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Event Loop Mastery (25min)**

**Objetivo:** Implementar custom event loop scheduler

```python
import asyncio
import time
from typing import List, Callable

class SmartScheduler:
    """
    Implemente um scheduler inteligente que:
    1. Prioriza tasks I/O-bound vs CPU-bound
    2. Detecta tasks lentas automaticamente  
    3. Balanceia carga entre tasks
    """
    
    def __init__(self):
        self.io_tasks = []
        self.cpu_tasks = []
        self.slow_tasks = []
        
    async def schedule_task(self, task, task_type: str = "auto"):
        """
        Schedule task com tipo automático ou manual.
        Implemente a lógica de classificação!
        """
        # TODO: Implementar classificação automática
        # TODO: Detectar tasks lentas (> 100ms)
        # TODO: Balancear execução
        pass
    
    async def run_scheduled_tasks(self):
        """Execute tasks de acordo com prioridades."""
        # TODO: Implementar algoritmo de scheduling
        pass

# Teste seu scheduler:
async def test_scheduler():
    scheduler = SmartScheduler()
    
    # Tasks de diferentes tipos
    async def io_task():
        await asyncio.sleep(0.1)  # I/O simulation
        return "IO done"
    
    async def cpu_task():
        sum(range(100000))  # CPU work
        return "CPU done"
        
    # Schedule e execute
    await scheduler.schedule_task(io_task())
    await scheduler.schedule_task(cpu_task())
    await scheduler.run_scheduled_tasks()

# Execute e meça performance!
```

### **🎯 Exercício 2: Async Debugging Detective (20min)**

**Problema:** Código com múltiplos bugs async

```python
import asyncio
import aiohttp

# 🚨 CÓDIGO COM BUGS - ENCONTRE E CORRIJA TODOS!
class BuggyAsyncCode:
    def __init__(self):
        self.data = []
    
    async def fetch_data(self, urls):
        """Fetch data from multiple URLs - HAS BUGS!"""
        
        # Bug 1: Blocking operation
        import requests
        for url in urls:
            response = requests.get(url)  # BUG!
            self.data.append(response.json())
        
        # Bug 2: Missing await
        result = self.process_data()  # BUG!
        return result
    
    def process_data(self):  # Bug 3: Should be async?
        """Process collected data."""
        if not self.data:
            return None
        return {"processed": len(self.data)}
    
    async def run_analysis(self):
        """Main analysis function."""
        urls = [
            "https://httpbin.org/json",
            "https://httpbin.org/uuid", 
            "https://httpbin.org/ip"
        ]
        
        # Bug 4: Exception not handled
        result = await self.fetch_data(urls)
        
        # Bug 5: Incorrect loop usage
        loop = asyncio.get_event_loop()
        final_result = loop.run_until_complete(
            self.additional_processing(result)
        )  # BUG!
        
        return final_result
    
    async def additional_processing(self, data):
        """Additional async processing."""
        await asyncio.sleep(0.1)
        return {"final": data, "timestamp": time.time()}

# Tarefa: Corrija TODOS os bugs e execute sem erros!
```

### **🎯 Exercício 3: Performance Optimization Challenge (25min)**

**Objetivo:** Otimizar código async para máxima performance

```python
import asyncio
import aiohttp
import time

# 🚀 DESAFIO: Otimize este código para ser 10x mais rápido!

class SlowAsyncProcessor:
    """Processor that needs optimization."""
    
    async def slow_fetch(self, url: str) -> dict:
        """Fetch single URL - muito lento!"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                await asyncio.sleep(0.1)  # Simula processamento lento
                return await response.json()
    
    async def slow_process_batch(self, urls: List[str]) -> List[dict]:
        """Process URLs sequencialmente - muito lento!"""
        results = []
        for url in urls:
            result = await self.slow_fetch(url)
            results.append(result)
        return results
    
    async def slow_analysis(self, data: List[dict]) -> dict:
        """Analyze data - ineficiente!"""
        analysis = {"total": len(data)}
        
        # Processamento sequencial lento
        for item in data:
            await asyncio.sleep(0.01)  # Simula análise lenta
            if "uuid" in str(item):
                analysis["has_uuid"] = True
                
        return analysis

# TAREFA: Reimplemente como FastAsyncProcessor
class FastAsyncProcessor:
    """Sua versão otimizada aqui!"""
    
    async def fast_fetch(self, url: str) -> dict:
        # TODO: Otimize esta função
        pass
    
    async def fast_process_batch(self, urls: List[str]) -> List[dict]:
        # TODO: Use concurrency inteligente
        pass
    
    async def fast_analysis(self, data: List[dict]) -> dict:
        # TODO: Paralelização de análise
        pass

# Benchmark - meta: 10x improvement!
async def benchmark():
    urls = ["https://httpbin.org/uuid"] * 20
    
    # Test slow version
    slow = SlowAsyncProcessor()
    start = time.time()
    slow_result = await slow.slow_process_batch(urls)
    slow_analysis = await slow.slow_analysis(slow_result)
    slow_time = time.time() - start
    
    # Test fast version  
    fast = FastAsyncProcessor()
    start = time.time()
    fast_result = await fast.fast_process_batch(urls)
    fast_analysis = await fast.fast_analysis(fast_result)
    fast_time = time.time() - start
    
    improvement = slow_time / fast_time
    print(f"Improvement: {improvement:.1f}x faster!")
    print(f"Goal: 10x+ improvement")
```

---

## 🎓 **RESUMO & PRÓXIMOS PASSOS**

### **🧠 Key Takeaways**

1. **🔄 Event loops** são single-threaded cooperativos
2. **⚡ anyio** oferece compatibilidade universal  
3. **🚨 Common pitfalls** têm soluções conhecidas
4. **🔍 Debugging async** requer ferramentas específicas

### **📈 Preparação para Aula 4**

**Próxima aula:** "Message Flow Analysis - Data Structures"
**Pre-work:**
- Execute todos exercícios async
- Profile um projeto pessoal com AsyncProfiler

### **💡 Questões Avançadas**

1. Como você implementaria rate limiting em código async?
2. Qual seria sua estratégia para testing de código async?
3. Como otimizaria async code para máxima concurrency sem race conditions?

---

## 🔗 **Recursos Técnicos**

- **📖 Docs:** [Python asyncio documentation](https://docs.python.org/3/library/asyncio.html)
- **🛠️ Tools:** [AsyncProfiler implementation](../src/tools/profiler.py)
- **📊 Benchmark:** [Performance benchmark](../scripts/performance_benchmark.py)
- **🎯 Next:** [Message Flow Analysis](curso_modulo_01_aula_04.md)

---

**🎯 Próxima Aula:** Message Flow Analysis - Data Structures Deep Dive
**📅 Duração:** 50min | **📊 Nível:** Técnico Básico+++