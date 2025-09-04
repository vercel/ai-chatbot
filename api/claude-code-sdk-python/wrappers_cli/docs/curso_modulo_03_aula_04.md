# 🔍 Aula 4: "Debugging & Monitoring" - Observability Engineering

**Módulo 3 - Aula 4 | Duração: 90min | Nível: Intermediário++**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Implementar logging strategies profissionais
- ✅ Desenvolver performance monitoring em tempo real
- ✅ Criar error tracking systems
- ✅ Construir user behavior analytics

---

## 📊 **PARTE 1: Advanced Logging Architecture** (30min)

### 🎯 **Professional Logging System**

```python
import logging
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
import threading
import queue

@dataclass
class LogEntry:
    """Structured log entry."""
    timestamp: str
    level: str
    component: str
    message: str
    context: Dict[str, Any]
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    performance_data: Optional[Dict[str, float]] = None

class StructuredLogger:
    """Professional structured logging system."""
    
    def __init__(self, log_path: Path, max_file_size: int = 50 * 1024 * 1024):
        self.log_path = log_path
        self.max_file_size = max_file_size
        self.log_queue = queue.Queue()
        self.session_id = None
        self.context_data = {}
        
        # Setup file handler with rotation
        self.setup_logging()
        
        # Start background log writer
        self.log_writer_thread = threading.Thread(target=self._log_writer_loop, daemon=True)
        self.log_writer_thread.start()
    
    def setup_logging(self):
        """Setup logging configuration."""
        
        # Create log directory
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Configure Python logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_path),
                logging.StreamHandler()  # Console output
            ]
        )
        
        # Create component-specific loggers
        self.cli_logger = logging.getLogger('claude_cli')
        self.sdk_logger = logging.getLogger('claude_sdk')
        self.performance_logger = logging.getLogger('performance')
    
    def set_session_context(self, session_id: str, user_context: Dict[str, Any] = None):
        """Set session context for all subsequent logs."""
        self.session_id = session_id
        self.context_data.update(user_context or {})
        
        self.log_info("session", f"Session started: {session_id}", {
            "session_start": True,
            "context": user_context
        })
    
    def log_info(self, component: str, message: str, context: Dict[str, Any] = None):
        """Log info level message."""
        self._log_entry("INFO", component, message, context)
    
    def log_warning(self, component: str, message: str, context: Dict[str, Any] = None):
        """Log warning level message."""
        self._log_entry("WARNING", component, message, context)
    
    def log_error(self, component: str, message: str, context: Dict[str, Any] = None):
        """Log error level message."""
        self._log_entry("ERROR", component, message, context)
    
    def log_performance(self, component: str, operation: str, duration: float, context: Dict[str, Any] = None):
        """Log performance metrics."""
        performance_data = {
            "operation": operation,
            "duration_ms": duration * 1000,
            "timestamp": time.time()
        }
        
        self._log_entry("PERFORMANCE", component, f"{operation} completed", context, performance_data)
    
    def _log_entry(self, level: str, component: str, message: str, context: Dict[str, Any] = None, performance_data: Dict[str, float] = None):
        """Internal log entry creation."""
        
        entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            level=level,
            component=component,
            message=message,
            context={**self.context_data, **(context or {})},
            session_id=self.session_id,
            performance_data=performance_data
        )
        
        # Queue for background writing
        self.log_queue.put(entry)
        
        # Also log to Python logging system
        python_logger = getattr(self, f"{component}_logger", self.cli_logger)
        getattr(python_logger, level.lower())(message)
    
    def _log_writer_loop(self):
        """Background thread for writing logs."""
        
        while True:
            try:
                # Get log entry (blocking)
                entry = self.log_queue.get(timeout=1.0)
                
                # Write to structured log file
                structured_log_path = self.log_path.with_suffix('.jsonl')
                with open(structured_log_path, 'a') as f:
                    json.dump(asdict(entry), f)
                    f.write('\n')
                
                # Check file rotation
                if structured_log_path.stat().st_size > self.max_file_size:
                    self._rotate_log_file(structured_log_path)
                
            except queue.Empty:
                continue
            except Exception as e:
                # Fallback to stderr for logging errors
                print(f"Logging error: {e}", file=sys.stderr)
    
    def _rotate_log_file(self, log_file: Path):
        """Rotate log file when it gets too large."""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archived_name = f"{log_file.stem}_{timestamp}{log_file.suffix}"
        archived_path = log_file.with_name(archived_name)
        
        log_file.rename(archived_path)
        print(f"📦 Log file rotated: {archived_path.name}")

# Performance monitoring integration
class PerformanceMonitor:
    """Real-time performance monitoring."""
    
    def __init__(self, logger: StructuredLogger):
        self.logger = logger
        self.active_operations: Dict[str, float] = {}
        self.performance_history: List[Dict[str, Any]] = []
        self.alert_thresholds = {
            "query_time": 10.0,  # seconds
            "connection_time": 5.0,  # seconds
            "memory_usage": 500 * 1024 * 1024,  # 500MB
        }
    
    def start_operation(self, operation_id: str, operation_type: str):
        """Start monitoring an operation."""
        self.active_operations[operation_id] = time.time()
        
        self.logger.log_info("performance", f"Started {operation_type}", {
            "operation_id": operation_id,
            "operation_type": operation_type
        })
    
    def end_operation(self, operation_id: str, operation_type: str, success: bool = True):
        """End monitoring an operation."""
        
        if operation_id not in self.active_operations:
            self.logger.log_warning("performance", f"Unknown operation ended: {operation_id}")
            return
        
        start_time = self.active_operations.pop(operation_id)
        duration = time.time() - start_time
        
        # Log performance
        self.logger.log_performance("cli", operation_type, duration, {
            "operation_id": operation_id,
            "success": success
        })
        
        # Check for performance alerts
        if operation_type == "query" and duration > self.alert_thresholds["query_time"]:
            self.logger.log_warning("performance", f"Slow query detected: {duration:.2f}s", {
                "operation_id": operation_id,
                "threshold": self.alert_thresholds["query_time"]
            })
        
        # Store in history
        self.performance_history.append({
            "operation_id": operation_id,
            "operation_type": operation_type,
            "duration": duration,
            "success": success,
            "timestamp": time.time()
        })
        
        # Limit history size
        if len(self.performance_history) > 1000:
            self.performance_history.pop(0)
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        
        if not self.performance_history:
            return {"no_data": True}
        
        # Analyze by operation type
        by_type = {}
        for entry in self.performance_history:
            op_type = entry["operation_type"]
            if op_type not in by_type:
                by_type[op_type] = []
            by_type[op_type].append(entry["duration"])
        
        # Calculate statistics
        stats = {}
        for op_type, durations in by_type.items():
            stats[op_type] = {
                "count": len(durations),
                "avg_duration": sum(durations) / len(durations),
                "min_duration": min(durations),
                "max_duration": max(durations),
                "success_rate": len([d for d in durations if d > 0]) / len(durations)
            }
        
        return stats
    
    def generate_performance_report(self) -> str:
        """Generate human-readable performance report."""
        
        stats = self.get_performance_stats()
        
        if stats.get("no_data"):
            return "📊 No performance data available"
        
        report = ["📊 PERFORMANCE REPORT", "=" * 25]
        
        for op_type, metrics in stats.items():
            report.extend([
                f"\n🔹 {op_type.upper()}:",
                f"   Executions: {metrics['count']}",
                f"   Average: {metrics['avg_duration']:.3f}s",
                f"   Range: {metrics['min_duration']:.3f}s - {metrics['max_duration']:.3f}s",
                f"   Success rate: {metrics['success_rate']:.1%}"
            ])
        
        return "\n".join(report)
```

---

## 📈 **PARTE 2: User Behavior Analytics** (30min)

### 🎭 **User Interaction Tracking**

```python
import sqlite3
from typing import Dict, List, Any
from datetime import datetime, timedelta

class UserAnalytics:
    """Track user behavior patterns."""
    
    def __init__(self, analytics_db_path: Path):
        self.db_path = analytics_db_path
        self.session_start = time.time()
        self.init_database()
        
    def init_database(self):
        """Initialize analytics database."""
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    action_type TEXT,
                    action_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_ms INTEGER,
                    success BOOLEAN
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS session_metrics (
                    session_id TEXT PRIMARY KEY,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    total_messages INTEGER,
                    commands_used TEXT,
                    errors_encountered INTEGER,
                    average_response_time REAL
                )
            ''')
    
    def track_action(self, action_type: str, action_data: Dict[str, Any], duration: float = 0, success: bool = True):
        """Track user action."""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO user_actions 
                    (session_id, action_type, action_data, duration_ms, success)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    self.session_id,
                    action_type,
                    json.dumps(action_data),
                    int(duration * 1000),
                    success
                ))
                
        except Exception as e:
            print(f"⚠️ Analytics tracking error: {e}")
    
    def track_command_usage(self, command: str, execution_time: float, success: bool):
        """Track command usage specifically."""
        
        self.track_action("command_execution", {
            "command": command,
            "execution_time": execution_time,
            "success": success
        }, execution_time, success)
    
    def track_conversation_metrics(self, message_count: int, total_tokens: int, response_time: float):
        """Track conversation-specific metrics."""
        
        self.track_action("conversation_activity", {
            "message_count": message_count,
            "total_tokens": total_tokens,
            "avg_response_time": response_time
        })
    
    def generate_usage_insights(self, days: int = 7) -> Dict[str, Any]:
        """Generate usage insights for recent period."""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Most used commands
                cursor = conn.execute('''
                    SELECT action_data, COUNT(*) as usage_count
                    FROM user_actions 
                    WHERE action_type = 'command_execution' 
                    AND timestamp > ?
                    GROUP BY action_data
                    ORDER BY usage_count DESC
                    LIMIT 10
                ''', (cutoff_date,))
                
                command_usage = []
                for row in cursor.fetchall():
                    action_data = json.loads(row[0])
                    command_usage.append({
                        "command": action_data.get("command"),
                        "usage_count": row[1]
                    })
                
                # Error rate analysis
                cursor = conn.execute('''
                    SELECT 
                        COUNT(*) as total_actions,
                        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
                    FROM user_actions
                    WHERE timestamp > ?
                ''', (cutoff_date,))
                
                total, errors = cursor.fetchone()
                error_rate = (errors / max(total, 1)) * 100
                
                # Average performance
                cursor = conn.execute('''
                    SELECT AVG(duration_ms) as avg_duration
                    FROM user_actions
                    WHERE timestamp > ? AND duration_ms > 0
                ''', (cutoff_date,))
                
                avg_duration = cursor.fetchone()[0] or 0
                
                return {
                    "period_days": days,
                    "total_actions": total,
                    "error_rate": error_rate,
                    "avg_duration_ms": avg_duration,
                    "most_used_commands": command_usage,
                    "insights": self._generate_insights(command_usage, error_rate, avg_duration)
                }
                
        except Exception as e:
            print(f"❌ Analytics query error: {e}")
            return {"error": str(e)}
    
    def _generate_insights(self, command_usage: List[Dict], error_rate: float, avg_duration: float) -> List[str]:
        """Generate actionable insights from data."""
        
        insights = []
        
        # Command usage insights
        if command_usage:
            top_command = command_usage[0]["command"]
            insights.append(f"Most used command: '{top_command}' - consider optimizing")
            
            if len(command_usage) > 5:
                insights.append("Diverse command usage - user is exploring features")
            else:
                insights.append("Limited command usage - user may need more guidance")
        
        # Performance insights
        if avg_duration > 5000:  # > 5 seconds
            insights.append("High average response time - investigate performance bottlenecks")
        elif avg_duration < 1000:  # < 1 second
            insights.append("Excellent response times - system performing well")
        
        # Error rate insights
        if error_rate > 10:  # > 10%
            insights.append("High error rate - review error handling and user guidance")
        elif error_rate < 2:  # < 2%
            insights.append("Low error rate - system is stable and user-friendly")
        
        return insights

# Real-time monitoring dashboard
class MonitoringDashboard:
    """Real-time monitoring dashboard for CLI."""
    
    def __init__(self, logger: StructuredLogger, performance_monitor: PerformanceMonitor):
        self.logger = logger
        self.performance_monitor = performance_monitor
        self.dashboard_active = False
        
    async def start_dashboard(self):
        """Start real-time monitoring dashboard."""
        
        self.dashboard_active = True
        print("📊 MONITORING DASHBOARD STARTED")
        print("=" * 35)
        print("Press Ctrl+C to stop monitoring")
        
        try:
            while self.dashboard_active:
                await self._update_dashboard()
                await asyncio.sleep(5)  # Update every 5 seconds
                
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped")
        finally:
            self.dashboard_active = False
    
    async def _update_dashboard(self):
        """Update dashboard display."""
        
        # Clear screen (Unix/Linux/Mac)
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print("📊 CLAUDE CLI MONITORING DASHBOARD")
        print("=" * 40)
        print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Performance metrics
        perf_stats = self.performance_monitor.get_performance_stats()
        if not perf_stats.get("no_data"):
            print("⚡ PERFORMANCE METRICS:")
            for op_type, metrics in perf_stats.items():
                print(f"   {op_type}: {metrics['avg_duration']:.3f}s avg, {metrics['count']} ops")
        
        # System resources
        try:
            import psutil
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            
            print(f"\n💻 SYSTEM RESOURCES:")
            print(f"   CPU: {cpu_percent:.1f}%")
            print(f"   Memory: {memory.percent:.1f}% ({memory.available // 1024 // 1024}MB available)")
            
        except ImportError:
            print("\n💻 SYSTEM: Install psutil for resource monitoring")
        
        # Active operations
        active_ops = len(self.performance_monitor.active_operations)
        print(f"\n🔄 ACTIVE OPERATIONS: {active_ops}")
        
        # Recent errors (placeholder)
        print(f"\n🚨 ERROR RATE: Low")  # Would integrate with error tracking
        
        print(f"\n💡 Press Ctrl+C to stop monitoring")
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Complete Observability Stack (50min)**

```python
class ObservabilityStack:
    """
    Implementar stack completa de observabilidade.
    
    Components to implement:
    1. Structured logging com log levels
    2. Metrics collection e aggregation  
    3. Distributed tracing para requests
    4. Alerting system para anomalies
    5. Dashboard para real-time visualization
    """
    
    def __init__(self, config: Dict[str, Any]):
        # TODO: Initialize complete observability stack
        self.logger = None  # StructuredLogger
        self.metrics = None  # MetricsCollector  
        self.tracer = None  # DistributedTracer
        self.alerting = None  # AlertingSystem
        self.dashboard = None  # MonitoringDashboard
        
    async def setup_observability(self):
        """Setup all observability components."""
        # TODO: Initialize and configure all components
        pass
    
    async def track_user_journey(self, user_action: str):
        """Track complete user journey across components."""
        # TODO: Implement cross-component tracking
        pass
    
    def generate_comprehensive_report(self) -> str:
        """Generate complete observability report."""
        # TODO: Combine data from all observability components
        pass

# Test observability stack
async def test_observability():
    """Test complete observability implementation."""
    
    stack = ObservabilityStack({
        "log_level": "INFO",
        "metrics_enabled": True,
        "tracing_enabled": True,
        "dashboard_port": 8080
    })
    
    await stack.setup_observability()
    
    # Simulate user interactions
    await stack.track_user_journey("user_login")
    await stack.track_user_journey("send_message")
    await stack.track_user_journey("view_sessions")
    
    # Generate report
    report = stack.generate_comprehensive_report()
    print(report)
```

### **🎯 Exercício 2: Anomaly Detection (30min)**

```python
class AnomalyDetector:
    """
    Implementar detecção de anomalias em real-time.
    
    Detect:
    1. Unusual response times
    2. High error rates
    3. Abnormal usage patterns
    4. Resource consumption spikes
    5. Security-related anomalies
    """
    
    def __init__(self):
        # TODO: Initialize anomaly detection
        self.baseline_metrics = {}
        self.anomaly_threshold = 2.0  # Standard deviations
        
    async def analyze_metrics(self, current_metrics: Dict[str, float]) -> List[str]:
        """Analyze metrics for anomalies."""
        # TODO: Implement statistical anomaly detection
        anomalies = []
        
        # Compare against baseline
        # Use statistical methods (z-score, moving averages)
        # Generate alerts for significant deviations
        
        return anomalies
    
    def update_baseline(self, new_metrics: Dict[str, float]):
        """Update baseline metrics."""
        # TODO: Implement baseline learning
        pass

# Test anomaly detection
async def test_anomaly_detection():
    detector = AnomalyDetector()
    
    # Simulate normal metrics
    normal_metrics = {"response_time": 1.5, "error_rate": 0.02}
    detector.update_baseline(normal_metrics)
    
    # Test anomaly detection
    anomalous_metrics = {"response_time": 15.0, "error_rate": 0.25}
    anomalies = await detector.analyze_metrics(anomalous_metrics)
    
    print(f"Detected anomalies: {anomalies}")
```

---

## 🎓 **RESUMO**

**Key Insights:** Professional observability transforms debugging de reactive para proactive, enabling data-driven optimization.

**Próxima:** [Módulo 4 - Internal Architecture Mastery](curso_modulo_04_aula_01.md)