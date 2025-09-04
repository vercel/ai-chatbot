# 📨 Aula 3: "Message Parser Deep Engineering" - Data Transformation

**Módulo 4 - Aula 3 | Duração: 120min | Nível: Intermediário++**

---

## 🎯 **Objetivos**
- ✅ Dominar JSON parsing optimization
- ✅ Implementar pattern matching profissional
- ✅ Desenvolver type safety guarantees
- ✅ Criar error recovery mechanisms

---

## 🔬 **JSON Parsing Optimization**

```python
import json
import time
from typing import Dict, Any, Optional

class HighPerformanceParser:
    """Ultra-fast JSON parsing for Claude messages."""
    
    def __init__(self):
        self.parse_cache = {}
        self.schema_cache = {}
        
    def parse_optimized(self, json_line: str) -> Optional[Dict[str, Any]]:
        """Optimized parsing with caching."""
        
        # Hash-based caching for repeated patterns
        line_hash = hash(json_line)
        if line_hash in self.parse_cache:
            return self.parse_cache[line_hash]
        
        try:
            parsed = json.loads(json_line)
            
            # Cache if reasonable size
            if len(json_line) < 1000:
                self.parse_cache[line_hash] = parsed
                
            return parsed
            
        except json.JSONDecodeError:
            return None

# Pattern matching mastery
def advanced_message_parsing(raw_data: dict) -> Any:
    """Advanced pattern matching implementation."""
    
    match raw_data.get("type"):
        case "assistant":
            match raw_data.get("content", []):
                case [{"type": "text", "text": text}]:
                    return f"Simple text: {text}"
                case [{"type": "thinking", "content": thinking}, {"type": "text", "text": text}]:
                    return f"Thought process: {thinking} → {text}"
                case content_blocks if len(content_blocks) > 2:
                    return f"Complex response: {len(content_blocks)} blocks"
                case _:
                    return "Unknown assistant format"
        
        case "user":
            return "User message"
        
        case "result":
            return f"Result with usage: {raw_data.get('usage', {})}"
        
        case _:
            return "Unknown message type"

# Error recovery implementation
class ResilientParser:
    """Parser with comprehensive error recovery."""
    
    def __init__(self):
        self.error_recovery_strategies = [
            self._try_fix_json_syntax,
            self._try_partial_parse,
            self._try_fallback_format
        ]
    
    def parse_with_recovery(self, json_line: str) -> Optional[dict]:
        """Parse with automatic error recovery."""
        
        # Try normal parsing first
        try:
            return json.loads(json_line)
        except json.JSONDecodeError as e:
            pass
        
        # Try recovery strategies
        for strategy in self.error_recovery_strategies:
            try:
                recovered = strategy(json_line, e)
                if recovered:
                    return recovered
            except Exception:
                continue
        
        return None
    
    def _try_fix_json_syntax(self, json_line: str, original_error) -> Optional[dict]:
        """Try to fix common JSON syntax errors."""
        
        # Fix common issues
        fixed = json_line
        
        # Fix trailing commas
        fixed = re.sub(r',(\s*[}\]])', r'\1', fixed)
        
        # Fix unquoted strings
        fixed = re.sub(r'(\w+):', r'"\1":', fixed)
        
        try:
            return json.loads(fixed)
        except:
            return None
```

---

## 🧪 **EXERCÍCIOS**

### **Exercício: Ultra-Fast Parser (90min)**

```python
class UltraFastParser:
    """Implementar parser otimizado para 100k+ messages/sec."""
    
    def __init__(self):
        # TODO: Implement ultra-optimized parsing
        pass
    
    def parse_batch(self, json_lines: List[str]) -> List[dict]:
        """Batch parsing optimization."""
        # TODO: Implement batch optimization
        pass

# Target: 100,000 messages/second parsing speed
```

---

**Próxima:** [Client Orchestration Analysis](curso_modulo_04_aula_04.md)