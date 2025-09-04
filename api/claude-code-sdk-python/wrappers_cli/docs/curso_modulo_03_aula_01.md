# 🎨 Aula 1: "CLI UX Engineering" - Design Patterns

**Módulo 3 - Aula 1 | Duração: 90min | Nível: Intermediário**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Dominar design patterns para CLI profissional
- ✅ Implementar command pattern e menu systems
- ✅ Desenvolver input validation robusta
- ✅ Criar error reporting de classe mundial

---

## 🏗️ **PARTE 1: Command Pattern Implementation** (30min)

### 🎯 **Professional CLI Architecture**

```python
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class CommandResult(Enum):
    """Command execution results."""
    SUCCESS = "success"
    ERROR = "error"
    CANCELLED = "cancelled"
    PARTIAL = "partial"

@dataclass
class CommandContext:
    """Context passed to commands."""
    user_input: str
    session_data: Dict[str, Any]
    client: Any  # ClaudeSDKClient
    ui_state: Dict[str, Any]

class Command(ABC):
    """Abstract base command for CLI operations."""
    
    def __init__(self, name: str, description: str, aliases: List[str] = None):
        self.name = name
        self.description = description
        self.aliases = aliases or []
        self.execution_count = 0
        self.total_execution_time = 0.0
        
    @abstractmethod
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute the command."""
        pass
    
    @abstractmethod
    def get_help_text(self) -> str:
        """Get detailed help for this command."""
        pass
    
    def can_execute(self, context: CommandContext) -> bool:
        """Check if command can execute in current context."""
        return True
    
    async def validate_input(self, context: CommandContext) -> bool:
        """Validate input before execution."""
        return True
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get command performance statistics."""
        avg_time = self.total_execution_time / max(self.execution_count, 1)
        return {
            "execution_count": self.execution_count,
            "average_time": avg_time,
            "total_time": self.total_execution_time
        }

# Concrete command implementations
class ChatCommand(Command):
    """Handle regular chat messages."""
    
    def __init__(self):
        super().__init__(
            name="chat",
            description="Send message to Claude",
            aliases=[]
        )
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute chat command."""
        import time
        start_time = time.time()
        
        try:
            # Send message to Claude
            await context.client.query(context.user_input)
            
            # Process response
            async for message in context.client.receive_response():
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            print(f"🤖 Claude: {block.text}")
            
            # Update stats
            execution_time = time.time() - start_time
            self.execution_count += 1
            self.total_execution_time += execution_time
            
            return CommandResult.SUCCESS
            
        except Exception as e:
            print(f"❌ Chat error: {e}")
            return CommandResult.ERROR
    
    def get_help_text(self) -> str:
        return "Send a message to Claude. Just type your message and press Enter."

class ViewerCommand(Command):
    """Handle viewer navigation."""
    
    def __init__(self):
        super().__init__(
            name="viewer",
            description="Navigate conversation sessions",
            aliases=["v"]
        )
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute viewer command."""
        try:
            # Import viewer functions from main CLI
            from claude import session_browser
            await session_browser()
            return CommandResult.SUCCESS
            
        except Exception as e:
            print(f"❌ Viewer error: {e}")
            return CommandResult.ERROR
    
    def get_help_text(self) -> str:
        return """
        Navigate conversation sessions:
        - List sessions
        - Search by ID
        - Filter by project
        - Generate summaries
        """

class ClearCommand(Command):
    """Clear conversation context."""
    
    def __init__(self):
        super().__init__(
            name="clear",
            description="Clear conversation context",
            aliases=["l", "limpar", "n", "novo"]
        )
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute clear command."""
        try:
            # Disconnect and reconnect client
            await context.client.disconnect()
            context.client = context.client.__class__()
            await context.client.connect()
            
            print("🔄 Contexto limpo. Iniciando nova conversa...")
            return CommandResult.SUCCESS
            
        except Exception as e:
            print(f"❌ Clear error: {e}")
            return CommandResult.ERROR
    
    def get_help_text(self) -> str:
        return "Clear conversation context and start fresh."

class ExitCommand(Command):
    """Exit CLI application."""
    
    def __init__(self):
        super().__init__(
            name="exit",
            description="Exit CLI application",
            aliases=["s", "sair", "quit"]
        )
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute exit command."""
        print("👋 Até logo!")
        return CommandResult.SUCCESS
    
    def get_help_text(self) -> str:
        return "Exit the CLI application."

# Command registry and dispatcher
class CommandRegistry:
    """Registry and dispatcher for CLI commands."""
    
    def __init__(self):
        self.commands: Dict[str, Command] = {}
        self.aliases: Dict[str, str] = {}
        self.command_history: List[str] = []
        
    def register_command(self, command: Command):
        """Register a command with the registry."""
        
        # Register main name
        self.commands[command.name] = command
        
        # Register aliases
        for alias in command.aliases:
            self.aliases[alias] = command.name
            
        print(f"📝 Registered command: {command.name} (aliases: {command.aliases})")
    
    def get_command(self, command_name: str) -> Optional[Command]:
        """Get command by name or alias."""
        
        # Check direct name
        if command_name in self.commands:
            return self.commands[command_name]
        
        # Check aliases
        if command_name in self.aliases:
            real_name = self.aliases[command_name]
            return self.commands[real_name]
        
        return None
    
    async def execute_command(self, command_name: str, context: CommandContext) -> CommandResult:
        """Execute command with full error handling."""
        
        command = self.get_command(command_name)
        if not command:
            print(f"❌ Unknown command: {command_name}")
            self.show_help()
            return CommandResult.ERROR
        
        # Validate before execution
        if not command.can_execute(context):
            print(f"❌ Command '{command_name}' cannot execute in current context")
            return CommandResult.ERROR
        
        if not await command.validate_input(context):
            print(f"❌ Invalid input for command '{command_name}'")
            print(f"💡 Help: {command.get_help_text()}")
            return CommandResult.ERROR
        
        # Execute command
        try:
            result = await command.execute(context)
            self.command_history.append(command_name)
            return result
            
        except Exception as e:
            print(f"❌ Command execution error: {e}")
            return CommandResult.ERROR
    
    def show_help(self):
        """Show help for all commands."""
        print("\n📋 COMANDOS DISPONÍVEIS")
        print("=" * 30)
        
        for command in self.commands.values():
            aliases_str = f" ({', '.join(command.aliases)})" if command.aliases else ""
            print(f"🔹 {command.name}{aliases_str}")
            print(f"   {command.description}")
            
            # Performance stats
            stats = command.get_performance_stats()
            if stats["execution_count"] > 0:
                print(f"   📊 Used {stats['execution_count']} times, avg {stats['average_time']:.3f}s")
        
        print()
    
    def get_command_suggestions(self, partial_command: str) -> List[str]:
        """Get command suggestions for autocomplete."""
        suggestions = []
        
        # Match command names
        for name in self.commands.keys():
            if name.startswith(partial_command):
                suggestions.append(name)
        
        # Match aliases
        for alias in self.aliases.keys():
            if alias.startswith(partial_command):
                suggestions.append(alias)
        
        return sorted(suggestions)

# Professional CLI implementation
class ProfessionalCLI:
    """Professional-grade CLI implementation."""
    
    def __init__(self):
        self.registry = CommandRegistry()
        self.session_data = {}
        self.ui_state = {"prompt": "👤 Você: "}
        self.client = None
        self.setup_commands()
        
    def setup_commands(self):
        """Setup all available commands."""
        commands = [
            ChatCommand(),
            ViewerCommand(),
            ClearCommand(),
            ExitCommand()
        ]
        
        for command in commands:
            self.registry.register_command(command)
    
    async def run_interactive_session(self):
        """Run interactive CLI session."""
        
        # Initialize client
        from src import ClaudeSDKClient
        self.client = ClaudeSDKClient()
        await self.client.connect()
        
        # Welcome message
        self.show_welcome()
        
        try:
            while True:
                # Get user input
                try:
                    user_input = input(self.ui_state["prompt"]).strip()
                except EOFError:
                    break
                
                if not user_input:
                    continue
                
                # Check for special commands
                if user_input in ['help', '?']:
                    self.registry.show_help()
                    continue
                
                # Parse command vs chat message
                if user_input.startswith('/'):
                    # Command mode
                    command_name = user_input[1:]
                    context = CommandContext(
                        user_input="",
                        session_data=self.session_data,
                        client=self.client,
                        ui_state=self.ui_state
                    )
                    
                    result = await self.registry.execute_command(command_name, context)
                    if result == CommandResult.SUCCESS and command_name in ['exit', 's', 'sair']:
                        break
                
                else:
                    # Chat mode
                    context = CommandContext(
                        user_input=user_input,
                        session_data=self.session_data,
                        client=self.client,
                        ui_state=self.ui_state
                    )
                    
                    # Check if it's a command alias
                    command = self.registry.get_command(user_input)
                    if command:
                        result = await self.registry.execute_command(user_input, context)
                        if result == CommandResult.SUCCESS and user_input in ['s', 'sair']:
                            break
                    else:
                        # Regular chat
                        await self.registry.execute_command("chat", context)
        
        finally:
            if self.client:
                await self.client.disconnect()
    
    def show_welcome(self):
        """Show welcome message."""
        print("🎯 CLAUDE CLI PROFISSIONAL")
        print("=" * 30)
        print("💬 Digite mensagens para conversar")
        print("🔍 Use 'v' para navegador de sessões")
        print("❓ Use 'help' para ver todos comandos")
        print("🚪 Use 's' para sair")
        print("-" * 30)

# Advanced CLI with autocomplete and history
class AdvancedCLI(ProfessionalCLI):
    """CLI with advanced features like autocomplete."""
    
    def __init__(self):
        super().__init__()
        self.command_history = []
        self.autocomplete_enabled = True
        
    def setup_autocomplete(self):
        """Setup command autocomplete."""
        try:
            import readline
            
            def completer(text: str, state: int) -> Optional[str]:
                """Autocomplete function."""
                suggestions = self.registry.get_command_suggestions(text)
                
                if state < len(suggestions):
                    return suggestions[state]
                return None
            
            readline.set_completer(completer)
            readline.parse_and_bind('tab: complete')
            
            print("✅ Autocomplete enabled (use Tab)")
            
        except ImportError:
            print("⚠️ Autocomplete not available (install readline)")
    
    def add_to_history(self, command: str):
        """Add command to history."""
        if command not in self.command_history:
            self.command_history.append(command)
            
        # Limit history size
        if len(self.command_history) > 100:
            self.command_history.pop(0)
    
    def show_command_history(self):
        """Show recent command history."""
        print("\n📚 HISTÓRICO DE COMANDOS")
        print("-" * 25)
        
        for i, cmd in enumerate(self.command_history[-10:], 1):
            print(f"{i:2d}. {cmd}")
        
        print()
```

---

## 🛡️ **PARTE 2: Input Validation & Error Reporting** (30min)

### 🔍 **Professional Input Validation**

```python
import re
from typing import Union, List, Callable, Any

class InputValidator:
    """Professional input validation system."""
    
    def __init__(self):
        self.validation_rules: Dict[str, List[Callable]] = {}
        self.error_messages: Dict[str, str] = {}
        
    def register_validator(self, input_type: str, validator: Callable[[str], bool], error_msg: str):
        """Register validation rule."""
        if input_type not in self.validation_rules:
            self.validation_rules[input_type] = []
            
        self.validation_rules[input_type].append(validator)
        self.error_messages[f"{input_type}_{len(self.validation_rules[input_type])}"] = error_msg
    
    def validate(self, input_type: str, value: str) -> tuple[bool, List[str]]:
        """Validate input against all rules."""
        
        errors = []
        
        if input_type not in self.validation_rules:
            return True, []
        
        for i, validator in enumerate(self.validation_rules[input_type]):
            try:
                if not validator(value):
                    error_key = f"{input_type}_{i+1}"
                    error_msg = self.error_messages.get(error_key, "Validation failed")
                    errors.append(error_msg)
                    
            except Exception as e:
                errors.append(f"Validation error: {e}")
        
        return len(errors) == 0, errors

# Common validators
def create_length_validator(min_len: int, max_len: int) -> Callable[[str], bool]:
    """Create length validator."""
    def validator(value: str) -> bool:
        return min_len <= len(value) <= max_len
    return validator

def create_pattern_validator(pattern: str) -> Callable[[str], bool]:
    """Create regex pattern validator."""
    compiled_pattern = re.compile(pattern)
    def validator(value: str) -> bool:
        return bool(compiled_pattern.match(value))
    return validator

def create_custom_validator(check_func: Callable[[str], bool]) -> Callable[[str], bool]:
    """Create custom validator."""
    return check_func

# Setup validation rules
validator = InputValidator()

# Session ID validation
validator.register_validator(
    "session_id",
    create_pattern_validator(r'^[a-zA-Z0-9_-]+$'),
    "Session ID deve conter apenas letras, números, _ e -"
)

validator.register_validator(
    "session_id", 
    create_length_validator(8, 64),
    "Session ID deve ter entre 8 e 64 caracteres"
)

# Chat message validation
validator.register_validator(
    "chat_message",
    create_length_validator(1, 10000),
    "Mensagem deve ter entre 1 e 10,000 caracteres"
)

validator.register_validator(
    "chat_message",
    lambda msg: not msg.strip().startswith('/') or len(msg.strip()) > 1,
    "Comandos devem ter pelo menos 1 caractere após '/'"
)

# Advanced error reporting
class ErrorReporter:
    """Professional error reporting system."""
    
    def __init__(self):
        self.error_history = []
        self.error_categories = {
            "validation": "🔍 Validation Error",
            "connection": "🔌 Connection Error", 
            "runtime": "⚡ Runtime Error",
            "user": "👤 User Error",
            "system": "💻 System Error"
        }
    
    def report_error(self, error: Exception, category: str = "runtime", context: Dict[str, Any] = None):
        """Report error with comprehensive information."""
        
        error_info = {
            "timestamp": datetime.now().isoformat(),
            "category": category,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {}
        }
        
        self.error_history.append(error_info)
        
        # Display user-friendly error
        category_icon = self.error_categories.get(category, "❌ Error")
        print(f"\n{category_icon}")
        print(f"   {error_info['error_message']}")
        
        # Provide helpful suggestions
        self._provide_error_suggestions(error_info)
        
        # Technical details (optional)
        if context and context.get("show_technical_details"):
            print(f"\n🔧 Technical Details:")
            print(f"   Type: {error_info['error_type']}")
            print(f"   Time: {error_info['timestamp']}")
    
    def _provide_error_suggestions(self, error_info: Dict[str, Any]):
        """Provide helpful suggestions based on error type."""
        
        error_type = error_info["error_type"]
        error_message = error_info["error_message"].lower()
        
        if "connection" in error_message or error_type == "ConnectionError":
            print("💡 Sugestões:")
            print("   • Verifique se Claude CLI está instalado")
            print("   • Teste: claude --version")
            print("   • Verifique sua conexão de internet")
            
        elif "permission" in error_message or error_type == "PermissionError":
            print("💡 Sugestões:")
            print("   • Verifique permissões do arquivo")
            print("   • Execute: chmod +x wrappers_cli/claude")
            print("   • Verifique se está no diretório correto")
            
        elif "import" in error_message or error_type == "ImportError":
            print("💡 Sugestões:")
            print("   • Execute: pip install -e .")
            print("   • Verifique se está no ambiente virtual correto")
            print("   • Execute: python scripts/environment_diagnostic.py")
            
        elif "timeout" in error_message:
            print("💡 Sugestões:")
            print("   • Claude CLI pode estar lento - aguarde")
            print("   • Verifique conexão de internet")
            print("   • Tente reiniciar o CLI")
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of recent errors."""
        
        if not self.error_history:
            return {"total_errors": 0}
        
        # Analyze recent errors (last 10)
        recent_errors = self.error_history[-10:]
        
        error_counts = {}
        for error in recent_errors:
            category = error["category"]
            error_counts[category] = error_counts.get(category, 0) + 1
        
        return {
            "total_errors": len(self.error_history),
            "recent_errors": len(recent_errors),
            "error_by_category": error_counts,
            "most_recent": recent_errors[-1] if recent_errors else None
        }
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Custom Command Development (40min)**

```python
class CustomCommand(Command):
    """
    Implementar comando customizado para seu use case.
    
    Escolha um dos seguintes:
    1. HistoryCommand - Mostrar histórico de conversas
    2. ExportCommand - Exportar conversa atual  
    3. SettingsCommand - Configurações do CLI
    4. StatsCommand - Estatísticas de uso
    5. DebugCommand - Informações de debug
    """
    
    def __init__(self, command_type: str):
        # TODO: Implement custom command
        # - Define appropriate name, description, aliases
        # - Implement validation logic
        # - Add help text
        # - Handle errors gracefully
        pass
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Implement command execution."""
        # TODO: Implement specific functionality
        pass
    
    def get_help_text(self) -> str:
        """Provide detailed help."""
        # TODO: Return comprehensive help text
        pass

# Integration test
async def test_custom_command():
    """Test custom command integration."""
    
    # Create CLI with custom command
    cli = ProfessionalCLI()
    custom_cmd = CustomCommand("history")  # or your choice
    cli.registry.register_command(custom_cmd)
    
    # Test execution
    context = CommandContext(
        user_input="test input",
        session_data={},
        client=None,
        ui_state={}
    )
    
    result = await cli.registry.execute_command("history", context)
    print(f"Command result: {result}")
```

### **🎯 Exercício 2: Error Handling Mastery (20min)**

```python
class RobustErrorHandler:
    """
    Implementar error handling robusto.
    
    Requirements:
    1. Categorize errors automatically
    2. Provide context-aware suggestions
    3. Log errors for analysis
    4. Recover gracefully from all error types
    """
    
    def __init__(self):
        # TODO: Implement robust error handling
        pass
    
    async def handle_error_with_recovery(self, error: Exception, context: Any) -> bool:
        """Handle error and attempt recovery."""
        # TODO: Implement error recovery strategies
        pass
    
    def generate_error_report(self) -> str:
        """Generate comprehensive error report."""
        # TODO: Generate detailed error analysis
        pass

# Test error scenarios
async def test_error_scenarios():
    """Test comprehensive error handling."""
    
    handler = RobustErrorHandler()
    
    # Test various error types
    test_errors = [
        ConnectionError("Claude CLI not responding"),
        PermissionError("Access denied"),
        ValueError("Invalid input format"),
        TimeoutError("Operation timed out")
    ]
    
    for error in test_errors:
        recovery_success = await handler.handle_error_with_recovery(error, {})
        print(f"Error {type(error).__name__}: Recovery {'✅' if recovery_success else '❌'}")
```

---

## 🎓 **RESUMO**

**Key Insights:** Professional CLI requires systematic command architecture, robust validation, e intelligent error handling.

**Próxima:** [Code Architecture Analysis](curso_modulo_03_aula_02.md)