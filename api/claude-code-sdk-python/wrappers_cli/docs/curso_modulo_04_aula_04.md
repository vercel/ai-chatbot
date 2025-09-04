# 🔄 Aula 4: "Client Orchestration Analysis" - Control Flow Mastery

**Módulo 4 - Aula 4 | Duração: 105min | Nível: Intermediário++**

---

## 🎯 **Objetivos**
- ✅ Dominar orchestration patterns
- ✅ Implementar message routing architecture  
- ✅ Desenvolver resource management
- ✅ Criar concurrency control

---

## 🎛️ **Orchestration Architecture**

```python
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class MessageRoute:
    """Message routing configuration."""
    source: str
    destination: str
    transform: Optional[callable] = None
    filter: Optional[callable] = None

class MessageOrchestrator:
    """Orchestrate message flow between components."""
    
    def __init__(self):
        self.routes: List[MessageRoute] = []
        self.middleware_stack: List[callable] = []
        self.message_queue = asyncio.Queue()
        
    def add_route(self, route: MessageRoute):
        """Add message route."""
        self.routes.append(route)
        
    async def orchestrate(self, message: dict) -> List[dict]:
        """Orchestrate message through all routes."""
        
        results = []
        
        for route in self.routes:
            # Apply filters
            if route.filter and not route.filter(message):
                continue
            
            # Apply transformations
            processed_message = message
            if route.transform:
                processed_message = route.transform(message)
            
            # Route to destination
            result = await self._route_to_destination(route.destination, processed_message)
            results.append(result)
        
        return results
    
    async def _route_to_destination(self, destination: str, message: dict) -> dict:
        """Route message to specific destination."""
        
        # Apply middleware stack
        for middleware in self.middleware_stack:
            message = await middleware(message)
        
        # Simulate destination processing
        return {"destination": destination, "processed": message}

# Resource management
class ResourceManager:
    """Manage system resources for optimal performance."""
    
    def __init__(self):
        self.active_connections = {}
        self.memory_pool = []
        self.semaphores = {}
        
    async def acquire_connection(self, connection_type: str):
        """Acquire connection resource."""
        
        if connection_type not in self.semaphores:
            self.semaphores[connection_type] = asyncio.Semaphore(5)  # Max 5 concurrent
        
        await self.semaphores[connection_type].acquire()
        
        connection_id = f"{connection_type}_{time.time()}"
        self.active_connections[connection_id] = {
            "type": connection_type,
            "created": time.time(),
            "usage_count": 0
        }
        
        return connection_id
    
    async def release_connection(self, connection_id: str):
        """Release connection resource."""
        
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            connection_type = conn_info["type"]
            
            # Release semaphore
            if connection_type in self.semaphores:
                self.semaphores[connection_type].release()
            
            # Remove from active connections
            del self.active_connections[connection_id]
            
            print(f"🔄 Released {connection_type} connection")

# Concurrency control
class ConcurrencyController:
    """Control concurrent operations for optimal performance."""
    
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_tasks = {}
        self.completed_tasks = []
        
    async def execute_controlled(self, task_func: callable, task_id: str, *args, **kwargs):
        """Execute task with concurrency control."""
        
        async with self.semaphore:
            start_time = time.time()
            self.active_tasks[task_id] = start_time
            
            try:
                result = await task_func(*args, **kwargs)
                
                # Record completion
                completion_time = time.time() - start_time
                self.completed_tasks.append({
                    "task_id": task_id,
                    "duration": completion_time,
                    "success": True
                })
                
                return result
                
            except Exception as e:
                completion_time = time.time() - start_time
                self.completed_tasks.append({
                    "task_id": task_id,
                    "duration": completion_time,
                    "success": False,
                    "error": str(e)
                })
                raise
            finally:
                if task_id in self.active_tasks:
                    del self.active_tasks[task_id]
```

---

## 🧪 **EXERCÍCIOS**

### **Exercício: Advanced Orchestrator (75min)**

```python
class AdvancedOrchestrator:
    """
    Implementar orchestrator completo.
    
    Features:
    1. Message routing com priority queues
    2. Load balancing entre destinations
    3. Circuit breaker para failed destinations
    4. Metrics collection para all routes
    """
    
    def __init__(self):
        # TODO: Implement advanced orchestration
        pass
    
    async def route_with_load_balancing(self, message: dict) -> dict:
        """Route message com load balancing."""
        # TODO: Implement load balancing logic
        pass
    
    async def handle_destination_failure(self, destination: str, error: Exception):
        """Handle failed destination com circuit breaker."""
        # TODO: Implement circuit breaker pattern
        pass

# Performance target: Route 10,000 messages/second
```

---

**Próxima:** [Módulo 5 - Plugin Architecture Design](curso_modulo_05_aula_01.md)