"""
Performance profiler para Claude Code SDK.
"""

import time
import asyncio
from typing import Dict, List, Any
from collections import defaultdict

class AsyncProfiler:
    """Profiler simples para operações async."""
    
    def __init__(self):
        self.timings = defaultdict(list)
        self.active_timers = {}
        
    def start_timer(self, operation: str):
        """Inicia timer para operação."""
        self.active_timers[operation] = time.time()
        
    def end_timer(self, operation: str):
        """Finaliza timer e registra resultado."""
        if operation in self.active_timers:
            duration = time.time() - self.active_timers[operation]
            self.timings[operation].append(duration)
            del self.active_timers[operation]
            return duration
        return 0
    
    def get_stats(self, operation: str) -> Dict[str, float]:
        """Obtém estatísticas de uma operação."""
        if operation not in self.timings:
            return {}
            
        times = self.timings[operation]
        return {
            "count": len(times),
            "total": sum(times),
            "average": sum(times) / len(times),
            "min": min(times),
            "max": max(times)
        }
    
    def report(self) -> str:
        """Gera relatório de performance."""
        report = ["🔍 PERFORMANCE REPORT", "=" * 25]
        
        for operation in self.timings:
            stats = self.get_stats(operation)
            report.append(f"\n📊 {operation}:")
            report.append(f"   Calls: {stats['count']}")
            report.append(f"   Avg: {stats['average']:.4f}s")
            report.append(f"   Min: {stats['min']:.4f}s")
            report.append(f"   Max: {stats['max']:.4f}s")
            
        return "\n".join(report)

# Global profiler instance
_global_profiler = AsyncProfiler()

def profile_query(operation_name: str = "query"):
    """Decorator para profilear queries."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            _global_profiler.start_timer(operation_name)
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                _global_profiler.end_timer(operation_name)
        return wrapper
    return decorator

def get_profiler() -> AsyncProfiler:
    """Obtém instância global do profiler."""
    return _global_profiler