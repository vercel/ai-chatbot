# 🎭 Aula 4: "Conversation Patterns" - Advanced Flows

**Módulo 2 - Aula 4 | Duração: 75min | Nível: Intermediário++**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar conversation patterns avançados
- ✅ Implementar context injection profissional
- ✅ Desenvolver conversation branching strategies
- ✅ Criar state persistence cross-sessions

---

## 🌳 **PARTE 1: Conversation Tree Architecture** (30min)

### 🔄 **Multi-Branch Conversation Management**

```python
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ConversationNode:
    """Single node in conversation tree."""
    id: str
    parent_id: Optional[str]
    message: dict
    children: List[str]
    timestamp: datetime
    branch_name: Optional[str] = None
    
class ConversationTree:
    """Manage conversation with branching support."""
    
    def __init__(self):
        self.nodes: Dict[str, ConversationNode] = {}
        self.current_node_id: Optional[str] = None
        self.root_id: Optional[str] = None
        self.branches: Dict[str, str] = {}  # branch_name -> node_id
        
    def add_message(self, message: dict, branch_name: Optional[str] = None) -> str:
        """Add message to conversation tree."""
        
        node_id = str(uuid.uuid4())
        parent_id = self.current_node_id
        
        node = ConversationNode(
            id=node_id,
            parent_id=parent_id,
            message=message,
            children=[],
            timestamp=datetime.now(),
            branch_name=branch_name
        )
        
        self.nodes[node_id] = node
        
        # Update parent's children
        if parent_id and parent_id in self.nodes:
            self.nodes[parent_id].children.append(node_id)
        else:
            # First message - set as root
            self.root_id = node_id
            
        # Update current position
        self.current_node_id = node_id
        
        # Register branch if named
        if branch_name:
            self.branches[branch_name] = node_id
            
        return node_id
    
    def create_branch(self, from_node_id: str, branch_name: str) -> bool:
        """Create new branch from specific node."""
        
        if from_node_id not in self.nodes:
            return False
            
        # Set current position to branch point
        self.current_node_id = from_node_id
        self.branches[branch_name] = from_node_id
        
        print(f"🌿 Branch '{branch_name}' created from node {from_node_id[:8]}")
        return True
    
    def switch_to_branch(self, branch_name: str) -> bool:
        """Switch to specific branch."""
        
        if branch_name not in self.branches:
            return False
            
        self.current_node_id = self.branches[branch_name]
        print(f"🔄 Switched to branch '{branch_name}'")
        return True
    
    def get_conversation_path(self, node_id: Optional[str] = None) -> List[dict]:
        """Get linear conversation path from root to specified node."""
        
        target_id = node_id or self.current_node_id
        if not target_id or target_id not in self.nodes:
            return []
        
        # Build path from target back to root
        path_ids = []
        current_id = target_id
        
        while current_id:
            path_ids.append(current_id)
            node = self.nodes[current_id]
            current_id = node.parent_id
        
        # Reverse to get root -> target order
        path_ids.reverse()
        
        # Convert to messages
        return [self.nodes[node_id].message for node_id in path_ids]
    
    def analyze_conversation_structure(self) -> Dict[str, Any]:
        """Analyze conversation tree structure."""
        
        total_nodes = len(self.nodes)
        branch_points = sum(1 for node in self.nodes.values() if len(node.children) > 1)
        max_depth = self._calculate_max_depth()
        
        return {
            "total_messages": total_nodes,
            "branch_points": branch_points,
            "max_depth": max_depth,
            "branches": list(self.branches.keys()),
            "current_path_length": len(self.get_conversation_path())
        }
    
    def _calculate_max_depth(self) -> int:
        """Calculate maximum depth of conversation tree."""
        if not self.root_id:
            return 0
            
        def get_depth(node_id: str) -> int:
            node = self.nodes[node_id]
            if not node.children:
                return 1
            return 1 + max(get_depth(child_id) for child_id in node.children)
        
        return get_depth(self.root_id)
    
    def export_tree_visualization(self) -> str:
        """Export tree as text visualization."""
        if not self.root_id:
            return "Empty conversation tree"
        
        def build_tree_text(node_id: str, indent: int = 0) -> List[str]:
            node = self.nodes[node_id]
            prefix = "  " * indent + ("├─ " if indent > 0 else "")
            
            # Message preview
            msg_preview = str(node.message.get("type", "unknown"))
            if node.branch_name:
                msg_preview += f" [{node.branch_name}]"
            
            lines = [f"{prefix}{msg_preview} ({node.id[:8]})"]
            
            # Add children
            for child_id in node.children:
                lines.extend(build_tree_text(child_id, indent + 1))
            
            return lines
        
        tree_lines = ["🌳 CONVERSATION TREE", "=" * 25]
        tree_lines.extend(build_tree_text(self.root_id))
        
        return "\n".join(tree_lines)

# Usage example
async def conversation_tree_demo():
    """Demonstrate conversation tree usage."""
    
    tree = ConversationTree()
    
    # Build conversation with branches
    tree.add_message({"type": "user", "content": [{"type": "text", "text": "Hello!"}]})
    tree.add_message({"type": "assistant", "content": [{"type": "text", "text": "Hi there!"}]})
    
    # Create branch point
    branch_point = tree.current_node_id
    
    # Branch 1: Math questions
    tree.add_message({"type": "user", "content": [{"type": "text", "text": "What is 2+2?"}]}, "math_branch")
    tree.add_message({"type": "assistant", "content": [{"type": "text", "text": "2+2=4"}]})
    
    # Switch to different branch
    tree.create_branch(branch_point, "code_branch")
    tree.switch_to_branch("code_branch")
    tree.add_message({"type": "user", "content": [{"type": "text", "text": "How to create Python function?"}]})
    
    # Analyze structure
    analysis = tree.analyze_conversation_structure()
    print(f"📊 Tree analysis: {analysis}")
    
    # Visualize
    print(tree.export_tree_visualization())
```

---

## 💉 **PARTE 2: Context Injection Strategies** (25min)

### 🎯 **Dynamic Context Enhancement**

```python
import re
from typing import Dict, List, Callable, Any
from datetime import datetime

class ContextInjector:
    """Professional context injection system."""
    
    def __init__(self):
        self.injection_rules: List[Callable] = []
        self.context_cache: Dict[str, Any] = {}
        self.injection_stats = {
            "total_injections": 0,
            "cache_hits": 0,
            "rule_executions": 0
        }
    
    def register_injection_rule(self, rule_func: Callable[[dict], Optional[dict]]):
        """Register context injection rule."""
        self.injection_rules.append(rule_func)
        
    async def inject_context(self, message: dict, conversation_history: List[dict]) -> dict:
        """Inject relevant context into message."""
        
        enhanced_message = message.copy()
        injected_contexts = []
        
        # Apply all injection rules
        for rule in self.injection_rules:
            try:
                self.injection_stats["rule_executions"] += 1
                context = rule(message, conversation_history)
                
                if context:
                    injected_contexts.append(context)
                    self.injection_stats["total_injections"] += 1
                    
            except Exception as e:
                print(f"⚠️ Injection rule error: {e}")
        
        # Merge injected contexts
        if injected_contexts:
            enhanced_message = self._merge_contexts(enhanced_message, injected_contexts)
        
        return enhanced_message
    
    def _merge_contexts(self, original_message: dict, contexts: List[dict]) -> dict:
        """Merge multiple contexts into message."""
        
        # Create enhanced message
        enhanced = original_message.copy()
        
        # Add context as system message prefix
        context_texts = []
        for context in contexts:
            if "text" in context:
                context_texts.append(context["text"])
        
        if context_texts:
            # Prepend context to user message
            context_block = {
                "type": "text",
                "text": f"[Context: {'; '.join(context_texts)}]\n\n"
            }
            
            # Insert context before original content
            enhanced["content"] = [context_block] + enhanced.get("content", [])
        
        return enhanced

# Predefined injection rules
def code_context_injector(message: dict, history: List[dict]) -> Optional[dict]:
    """Inject code-related context when relevant."""
    
    # Check if message is about code
    text_content = ""
    for block in message.get("content", []):
        if block.get("type") == "text":
            text_content += block.get("text", "")
    
    code_keywords = ["function", "class", "variable", "bug", "error", "code"]
    if any(keyword in text_content.lower() for keyword in code_keywords):
        
        # Look for code blocks in history
        recent_code = []
        for msg in history[-10:]:  # Last 10 messages
            for block in msg.get("content", []):
                if block.get("type") == "text":
                    text = block.get("text", "")
                    # Simple code detection
                    if "def " in text or "class " in text or "import " in text:
                        recent_code.append(text[:100])  # First 100 chars
        
        if recent_code:
            return {
                "type": "code_context",
                "text": f"Recent code discussion: {'; '.join(recent_code)}"
            }
    
    return None

def project_context_injector(message: dict, history: List[dict]) -> Optional[dict]:
    """Inject project-specific context."""
    
    # Detect project references
    text_content = ""
    for block in message.get("content", []):
        if block.get("type") == "text":
            text_content += block.get("text", "")
    
    # Look for file references
    file_pattern = r'\b\w+\.\w+\b'  # Simple file pattern
    files_mentioned = re.findall(file_pattern, text_content)
    
    if files_mentioned:
        return {
            "type": "project_context", 
            "text": f"Files in discussion: {', '.join(files_mentioned[:5])}"
        }
    
    return None

# Advanced context injection system
class SmartContextInjector(ContextInjector):
    """AI-powered context injection."""
    
    def __init__(self):
        super().__init__()
        self.relevance_threshold = 0.7
        self.max_context_tokens = 500
        
    async def intelligent_context_selection(self, message: dict, history: List[dict]) -> List[dict]:
        """Use AI to select most relevant context."""
        
        # Extract message intent
        intent = await self._extract_message_intent(message)
        
        # Score historical messages for relevance
        relevant_messages = []
        for historical_msg in history:
            relevance_score = await self._calculate_relevance(message, historical_msg, intent)
            
            if relevance_score > self.relevance_threshold:
                relevant_messages.append((historical_msg, relevance_score))
        
        # Sort by relevance and limit by token count
        relevant_messages.sort(key=lambda x: x[1], reverse=True)
        
        selected_contexts = []
        token_count = 0
        
        for msg, score in relevant_messages:
            msg_tokens = self._estimate_tokens(msg)
            if token_count + msg_tokens <= self.max_context_tokens:
                selected_contexts.append(msg)
                token_count += msg_tokens
            else:
                break
        
        return selected_contexts
    
    async def _extract_message_intent(self, message: dict) -> str:
        """Extract intent from message using keyword analysis."""
        
        text_content = ""
        for block in message.get("content", []):
            if block.get("type") == "text":
                text_content += block.get("text", "")
        
        # Simple intent classification
        if any(word in text_content.lower() for word in ["how", "what", "why"]):
            return "question"
        elif any(word in text_content.lower() for word in ["create", "make", "build"]):
            return "creation"
        elif any(word in text_content.lower() for word in ["fix", "error", "bug"]):
            return "debugging"
        else:
            return "general"
    
    async def _calculate_relevance(self, current_msg: dict, historical_msg: dict, intent: str) -> float:
        """Calculate relevance score between messages."""
        
        # Extract text from both messages
        current_text = self._extract_text_content(current_msg)
        historical_text = self._extract_text_content(historical_msg)
        
        # Simple relevance calculation
        common_words = set(current_text.lower().split()) & set(historical_text.lower().split())
        relevance = len(common_words) / max(len(current_text.split()), 1)
        
        # Boost relevance based on intent matching
        if intent in historical_text.lower():
            relevance += 0.3
        
        # Time decay - recent messages more relevant
        time_diff = (datetime.now() - historical_msg.get("timestamp", datetime.now())).total_seconds()
        time_factor = max(0.1, 1.0 - (time_diff / 3600))  # Decay over 1 hour
        
        return relevance * time_factor
    
    def _extract_text_content(self, message: dict) -> str:
        """Extract all text content from message."""
        text_parts = []
        
        for block in message.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block.get("text", ""))
            elif block.get("type") == "thinking":
                text_parts.append(block.get("content", ""))
        
        return " ".join(text_parts)
    
    def _estimate_tokens(self, message: dict) -> int:
        """Estimate token count for message."""
        text = self._extract_text_content(message)
        return len(text) // 4  # Rough estimation

# Usage example
async def smart_conversation_example():
    """Example using smart context injection."""
    
    injector = SmartContextInjector()
    
    # Register injection rules
    injector.register_injection_rule(code_context_injector)
    injector.register_injection_rule(project_context_injector)
    
    # Build conversation history
    history = [
        {"type": "user", "content": [{"type": "text", "text": "How to create Python function?"}]},
        {"type": "assistant", "content": [{"type": "text", "text": "def my_function(): pass"}]},
        {"type": "user", "content": [{"type": "text", "text": "What about classes?"}]},
    ]
    
    # New message with context injection
    new_message = {"type": "user", "content": [{"type": "text", "text": "Can you show me function examples?"}]}
    
    enhanced_message = await injector.inject_context(new_message, history)
    
    print("📨 Original message:")
    print(json.dumps(new_message, indent=2))
    print("\n📨 Enhanced message:")
    print(json.dumps(enhanced_message, indent=2))
```

---

## 💾 **PARTE 2: State Persistence Architecture** (20min)

### 🗄️ **Cross-Session State Management**

```python
import json
import pickle
import sqlite3
from pathlib import Path
from typing import Any, Dict, Optional
import hashlib

class ConversationStateManager:
    """Manage conversation state across sessions."""
    
    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.mkdir(exist_ok=True)
        self.db_path = storage_path / "conversations.db"
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for state storage."""
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    session_id TEXT PRIMARY KEY,
                    tree_data BLOB,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS conversation_snapshots (
                    snapshot_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    snapshot_data BLOB,
                    snapshot_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES conversations (session_id)
                )
            ''')
    
    async def save_conversation_state(self, session_id: str, tree: ConversationTree, metadata: Dict[str, Any] = None):
        """Save complete conversation state."""
        
        try:
            # Serialize tree data
            tree_data = {
                "nodes": {nid: {
                    "id": node.id,
                    "parent_id": node.parent_id,
                    "message": node.message,
                    "children": node.children,
                    "timestamp": node.timestamp.isoformat(),
                    "branch_name": node.branch_name
                } for nid, node in tree.nodes.items()},
                "current_node_id": tree.current_node_id,
                "root_id": tree.root_id,
                "branches": tree.branches
            }
            
            # Pickle for efficient storage
            pickled_data = pickle.dumps(tree_data)
            metadata_json = json.dumps(metadata or {})
            
            # Save to database
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO conversations 
                    (session_id, tree_data, metadata, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ''', (session_id, pickled_data, metadata_json))
            
            print(f"💾 State saved for session {session_id[:8]}")
            
        except Exception as e:
            print(f"❌ Save error: {e}")
    
    async def load_conversation_state(self, session_id: str) -> Optional[ConversationTree]:
        """Load conversation state from storage."""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    'SELECT tree_data FROM conversations WHERE session_id = ?',
                    (session_id,)
                )
                row = cursor.fetchone()
                
                if not row:
                    return None
            
            # Deserialize tree data
            tree_data = pickle.loads(row[0])
            
            # Reconstruct conversation tree
            tree = ConversationTree()
            tree.current_node_id = tree_data["current_node_id"]
            tree.root_id = tree_data["root_id"]
            tree.branches = tree_data["branches"]
            
            # Reconstruct nodes
            for node_id, node_data in tree_data["nodes"].items():
                node = ConversationNode(
                    id=node_data["id"],
                    parent_id=node_data["parent_id"],
                    message=node_data["message"],
                    children=node_data["children"],
                    timestamp=datetime.fromisoformat(node_data["timestamp"]),
                    branch_name=node_data["branch_name"]
                )
                tree.nodes[node_id] = node
            
            print(f"📂 State loaded for session {session_id[:8]}")
            return tree
            
        except Exception as e:
            print(f"❌ Load error: {e}")
            return None
    
    async def create_snapshot(self, session_id: str, snapshot_name: str, tree: ConversationTree):
        """Create named snapshot of conversation state."""
        
        snapshot_id = hashlib.md5(f"{session_id}_{snapshot_name}_{datetime.now()}".encode()).hexdigest()
        
        try:
            # Serialize current state
            snapshot_data = {
                "tree_state": tree.__dict__,
                "snapshot_metadata": {
                    "name": snapshot_name,
                    "message_count": len(tree.nodes),
                    "branches": list(tree.branches.keys())
                }
            }
            
            pickled_snapshot = pickle.dumps(snapshot_data)
            
            # Save snapshot
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO conversation_snapshots
                    (snapshot_id, session_id, snapshot_data, snapshot_name)
                    VALUES (?, ?, ?, ?)
                ''', (snapshot_id, session_id, pickled_snapshot, snapshot_name))
            
            print(f"📸 Snapshot '{snapshot_name}' created")
            return snapshot_id
            
        except Exception as e:
            print(f"❌ Snapshot error: {e}")
            return None
    
    async def list_sessions(self) -> List[Dict[str, Any]]:
        """List all stored conversation sessions."""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    SELECT session_id, metadata, created_at, updated_at
                    FROM conversations
                    ORDER BY updated_at DESC
                ''')
                
                sessions = []
                for row in cursor.fetchall():
                    sessions.append({
                        "session_id": row[0],
                        "metadata": json.loads(row[1]),
                        "created_at": row[2],
                        "updated_at": row[3]
                    })
                
                return sessions
                
        except Exception as e:
            print(f"❌ List sessions error: {e}")
            return []
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Advanced Conversation Manager (45min)**

```python
class MasterConversationManager:
    """
    Implementar gerenciador de conversa completo.
    
    Features necessárias:
    1. Multi-branch conversation support
    2. Intelligent context injection
    3. Cross-session persistence  
    4. Conversation analysis e insights
    5. Export/import de conversas
    6. Search dentro de conversas
    """
    
    def __init__(self, storage_path: str):
        # TODO: Implement complete conversation management
        self.tree = ConversationTree()
        self.injector = SmartContextInjector()
        self.state_manager = ConversationStateManager(Path(storage_path))
        
    async def start_conversation(self, session_id: str):
        """Start new or resume existing conversation."""
        # TODO: Implement conversation startup
        pass
    
    async def send_message_enhanced(self, message: str, branch_name: Optional[str] = None):
        """Send message with full enhancement."""
        # TODO: Implement enhanced message sending
        # - Apply context injection
        # - Handle branching
        # - Save state automatically
        pass
    
    async def search_conversation_history(self, query: str) -> List[dict]:
        """Search through conversation history."""
        # TODO: Implement conversation search
        pass
    
    async def export_conversation(self, format: str = "json") -> str:
        """Export conversation in various formats."""
        # TODO: Implement export functionality
        # Formats: json, markdown, html, pdf
        pass

# Test comprehensive conversation management
async def test_conversation_manager():
    manager = MasterConversationManager("/tmp/claude_conversations")
    
    await manager.start_conversation("test_session_001")
    await manager.send_message_enhanced("Hello Claude!")
    
    # Test branching
    await manager.send_message_enhanced("What is Python?", branch_name="python_discussion")
    
    # Test search
    results = await manager.search_conversation_history("Python")
    
    # Test export
    exported = await manager.export_conversation("markdown")
    
    print(f"🎯 Conversation management test completed")
```

### **🎯 Exercício 2: Performance Optimization (20min)**

```python
async def optimize_conversation_performance():
    """
    Otimizar performance de conversas longas.
    
    Challenges:
    1. Conversations com 1000+ messages
    2. Multiple concurrent conversations
    3. Real-time context injection
    4. Memory efficiency
    """
    
    # TODO: Implement performance optimizations
    # - Lazy loading de conversation history
    # - Efficient context caching
    # - Background state saving
    # - Memory usage monitoring
    
    pass

# Performance target: Handle 100+ concurrent conversations
```

---

## 🎓 **RESUMO**

**Key Insights:** Advanced conversation patterns require sophisticated state management e intelligent context handling.

**Próxima:** [Módulo 3 - CLI Engineering](../curso_modulo_03_aula_01.md)