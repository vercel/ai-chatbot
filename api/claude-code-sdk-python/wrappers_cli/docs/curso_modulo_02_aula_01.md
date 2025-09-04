# 🧠 Aula 1: "Context Management Internals" - Memory Architecture

**Módulo 2 - Aula 1 | Duração: 75min | Nível: Intermediário**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar como Claude Code CLI mantém contexto
- ✅ Implementar strategies de context optimization
- ✅ Analisar token counting e context windows
- ✅ Desenvolver context overflow handling

---

## 🧠 **PARTE 1: Context Architecture Deep Dive** (25min)

### 🔍 **Como Context Realmente Funciona**

```python
# Context é mantido pelo Claude CLI em estrutura JSON
# Cada mensagem adiciona ao contexto total

class ContextManager:
    """Simulação de como Claude CLI gerencia contexto."""
    
    def __init__(self, max_tokens=100000):
        self.messages = []
        self.max_tokens = max_tokens
        self.current_tokens = 0
        
    def add_message(self, message: dict):
        """Adiciona mensagem ao contexto."""
        # Estimate token count (rough)
        estimated_tokens = self._estimate_tokens(message)
        
        # Check if exceeds limit
        if self.current_tokens + estimated_tokens > self.max_tokens:
            self._handle_context_overflow()
        
        self.messages.append(message)
        self.current_tokens += estimated_tokens
        
        return self.current_tokens
    
    def _estimate_tokens(self, message: dict) -> int:
        """Estimate token count for message."""
        # Rough estimation: 4 chars = 1 token
        total_chars = 0
        
        for block in message.get("content", []):
            if block.get("type") == "text":
                total_chars += len(block.get("text", ""))
            elif block.get("type") == "thinking":
                total_chars += len(block.get("content", ""))
        
        return total_chars // 4
    
    def _handle_context_overflow(self):
        """Handle context window overflow."""
        print("⚠️ Context overflow - implementing truncation strategy")
        
        # Strategy 1: Remove oldest messages
        while self.current_tokens > self.max_tokens * 0.8:
            if not self.messages:
                break
                
            removed = self.messages.pop(0)
            removed_tokens = self._estimate_tokens(removed)
            self.current_tokens -= removed_tokens
            
        print(f"🔄 Context reduced to {self.current_tokens} tokens")
    
    def get_context_summary(self):
        """Get current context statistics."""
        return {
            "message_count": len(self.messages),
            "token_count": self.current_tokens,
            "utilization": self.current_tokens / self.max_tokens,
            "messages_by_type": self._count_by_type()
        }
    
    def _count_by_type(self):
        """Count messages by type."""
        counts = {}
        for msg in self.messages:
            msg_type = msg.get("type", "unknown")
            counts[msg_type] = counts.get(msg_type, 0) + 1
        return counts
```

### 🎯 **Context Persistence Strategies**

```python
import json
from pathlib import Path
from datetime import datetime

class PersistentContextManager(ContextManager):
    """Context manager with disk persistence."""
    
    def __init__(self, session_file: Path, max_tokens=100000):
        super().__init__(max_tokens)
        self.session_file = session_file
        self.load_context()
    
    def load_context(self):
        """Load context from disk."""
        if self.session_file.exists():
            try:
                with open(self.session_file, 'r') as f:
                    for line in f:
                        if line.strip():
                            message = json.loads(line)
                            self.messages.append(message)
                            self.current_tokens += self._estimate_tokens(message)
                            
                print(f"📂 Loaded {len(self.messages)} messages from session")
                
            except Exception as e:
                print(f"❌ Error loading context: {e}")
                self.messages = []
                self.current_tokens = 0
    
    def save_message(self, message: dict):
        """Save message to disk immediately."""
        try:
            with open(self.session_file, 'a') as f:
                json.dump(message, f)
                f.write('\n')
                
        except Exception as e:
            print(f"❌ Error saving message: {e}")
    
    def add_message(self, message: dict):
        """Add message with automatic persistence."""
        tokens = super().add_message(message)
        self.save_message(message)
        return tokens
    
    def clear_context(self):
        """Clear context and remove session file."""
        self.messages = []
        self.current_tokens = 0
        
        if self.session_file.exists():
            self.session_file.unlink()
            
        print("🔄 Context cleared and session file removed")
```

---

## ⚡ **PARTE 2: Token Optimization Strategies** (25min)

### 📊 **Token Counting Deep Analysis**

```python
import re
from typing import Dict, List

class AdvancedTokenCounter:
    """Professional token counting with optimization."""
    
    def __init__(self):
        # Token patterns (simplified GPT-style tokenization)
        self.patterns = [
            (r'\w+', 1.0),          # Words: 1 token each
            (r'\s+', 0.1),          # Whitespace: 0.1 token  
            (r'[.!?]', 0.5),        # Punctuation: 0.5 token
            (r'[,;:]', 0.3),        # Light punctuation: 0.3 token
            (r'[\(\)\[\]{}]', 0.2), # Brackets: 0.2 token
        ]
    
    def count_tokens(self, text: str) -> float:
        """Accurate token counting."""
        if not text:
            return 0
            
        remaining_text = text
        total_tokens = 0
        
        for pattern, token_value in self.patterns:
            matches = re.findall(pattern, remaining_text)
            total_tokens += len(matches) * token_value
            
            # Remove matched text
            remaining_text = re.sub(pattern, '', remaining_text)
        
        # Any remaining characters as fractional tokens
        if remaining_text:
            total_tokens += len(remaining_text) * 0.1
            
        return total_tokens
    
    def analyze_message_tokens(self, message: dict) -> Dict[str, float]:
        """Detailed token analysis for message."""
        analysis = {
            "total_tokens": 0,
            "by_block_type": {},
            "optimization_potential": 0
        }
        
        for block in message.get("content", []):
            block_type = block.get("type")
            
            if block_type == "text":
                text = block.get("text", "")
                tokens = self.count_tokens(text)
                analysis["total_tokens"] += tokens
                analysis["by_block_type"][block_type] = tokens
                
                # Check for optimization opportunities
                if len(text) > 500 and tokens > 100:
                    analysis["optimization_potential"] += tokens * 0.2
                    
            elif block_type == "thinking":
                content = block.get("content", "")
                tokens = self.count_tokens(content)
                analysis["total_tokens"] += tokens
                analysis["by_block_type"][block_type] = tokens
        
        return analysis
    
    def suggest_optimizations(self, messages: List[dict]) -> List[str]:
        """Suggest context optimizations."""
        suggestions = []
        total_tokens = 0
        
        for msg in messages:
            analysis = self.analyze_message_tokens(msg)
            total_tokens += analysis["total_tokens"]
            
            if analysis["optimization_potential"] > 50:
                suggestions.append(f"Message with {analysis['total_tokens']:.0f} tokens could be compressed")
        
        if total_tokens > 80000:  # 80% of typical limit
            suggestions.append("Consider implementing context summarization")
            
        if len(messages) > 100:
            suggestions.append("Long conversation - consider periodic context cleanup")
            
        return suggestions

# Usage example
counter = AdvancedTokenCounter()

sample_message = {
    "type": "assistant",
    "content": [
        {"type": "thinking", "content": "The user is asking about Python programming."},
        {"type": "text", "text": "Here's how to create a function in Python: def my_function(): pass"}
    ]
}

analysis = counter.analyze_message_tokens(sample_message)
print(f"Token analysis: {analysis}")
```

### 🚀 **Context Optimization Techniques**

```python
class ContextOptimizer:
    """Advanced context optimization strategies."""
    
    def __init__(self):
        self.summarization_threshold = 50000  # tokens
        self.compression_ratio = 0.3  # Target 30% of original
        
    def optimize_context(self, messages: List[dict]) -> List[dict]:
        """Apply optimization strategies to context."""
        if not messages:
            return messages
            
        total_tokens = sum(self._count_message_tokens(msg) for msg in messages)
        
        if total_tokens < self.summarization_threshold:
            return messages  # No optimization needed
            
        print(f"🔧 Optimizing context: {total_tokens} tokens")
        
        # Strategy 1: Remove thinking blocks from old messages
        optimized = self._remove_old_thinking(messages)
        
        # Strategy 2: Compress repetitive content
        optimized = self._compress_repetitive_content(optimized)
        
        # Strategy 3: Summarize old conversations
        optimized = self._summarize_old_sections(optimized)
        
        new_total = sum(self._count_message_tokens(msg) for msg in optimized)
        reduction = (total_tokens - new_total) / total_tokens
        
        print(f"✅ Context optimized: {reduction:.1%} reduction")
        return optimized
    
    def _remove_old_thinking(self, messages: List[dict]) -> List[dict]:
        """Remove thinking blocks from older messages."""
        cutoff = len(messages) - 20  # Keep thinking in last 20 messages
        
        optimized = []
        for i, msg in enumerate(messages):
            if i < cutoff and msg.get("type") == "assistant":
                # Remove thinking blocks
                new_content = []
                for block in msg.get("content", []):
                    if block.get("type") != "thinking":
                        new_content.append(block)
                
                optimized_msg = msg.copy()
                optimized_msg["content"] = new_content
                optimized.append(optimized_msg)
            else:
                optimized.append(msg)
                
        return optimized
    
    def _compress_repetitive_content(self, messages: List[dict]) -> List[dict]:
        """Compress repetitive or similar content."""
        # Placeholder for advanced compression
        # Could implement:
        # - Duplicate detection
        # - Similar response merging
        # - Template extraction
        return messages
    
    def _summarize_old_sections(self, messages: List[dict]) -> List[dict]:
        """Summarize old conversation sections."""
        if len(messages) < 50:
            return messages
            
        # Keep recent 30 messages, summarize older ones
        recent_messages = messages[-30:]
        old_messages = messages[:-30]
        
        if old_messages:
            # Create summary message
            summary_text = f"[Previous conversation with {len(old_messages)} messages summarized]"
            summary_message = {
                "type": "system",
                "content": [{"type": "text", "text": summary_text}]
            }
            
            return [summary_message] + recent_messages
        
        return messages
    
    def _count_message_tokens(self, message: dict) -> int:
        """Count tokens in message."""
        total = 0
        for block in message.get("content", []):
            if block.get("type") in ["text", "thinking"]:
                text = block.get("text") or block.get("content", "")
                total += len(text) // 4  # Rough token estimation
        return total
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Context Manager Implementation (30min)**

```python
class ConversationContext:
    """
    Implementar gerenciador de contexto completo.
    
    Requisitos:
    1. Track token usage accurately
    2. Implement smart truncation
    3. Preserve important messages
    4. Optimize for performance
    """
    
    def __init__(self, max_tokens: int = 100000):
        self.max_tokens = max_tokens
        # TODO: Implement complete context management
        
    def add_user_message(self, text: str):
        """Add user message to context."""
        # TODO: Implement
        pass
        
    def add_assistant_response(self, response_data: dict):
        """Add assistant response to context."""
        # TODO: Implement
        pass
        
    def should_truncate(self) -> bool:
        """Check if context needs truncation."""
        # TODO: Implement smart truncation logic
        pass
        
    def truncate_intelligently(self):
        """Perform intelligent context truncation."""
        # TODO: Implement advanced truncation
        # Keep system messages, recent messages, important context
        pass
        
    def export_summary(self) -> str:
        """Export conversation summary."""
        # TODO: Generate human-readable summary
        pass

# Test your implementation
context = ConversationContext()
context.add_user_message("Hello Claude!")
# Add more messages and test truncation
```

### **🎯 Exercício 2: Token Optimization (20min)**

```python
def optimize_prompt_tokens(prompt: str) -> str:
    """
    Otimize prompt para usar menos tokens mantendo meaning.
    
    Técnicas:
    1. Remove unnecessary words
    2. Use abbreviations where appropriate  
    3. Optimize punctuation
    4. Maintain semantic meaning
    """
    # TODO: Implement token optimization
    pass

# Test cases
test_prompts = [
    "Could you please help me understand how to create a function in Python programming language?",
    "I would like to know what is the best way to handle errors in my Python code",
    "Can you explain to me the difference between lists and tuples in Python?"
]

for prompt in test_prompts:
    original_tokens = len(prompt) // 4
    optimized = optimize_prompt_tokens(prompt)
    optimized_tokens = len(optimized) // 4
    
    print(f"Original ({original_tokens}): {prompt}")
    print(f"Optimized ({optimized_tokens}): {optimized}")
    print(f"Saved: {original_tokens - optimized_tokens} tokens\n")
```

---

## 🎓 **RESUMO**

**Key Insights:** Context é memória finita que precisa ser gerenciada inteligentemente para conversas longas.

**Próxima:** [Client Lifecycle Deep Dive](curso_modulo_02_aula_02.md)