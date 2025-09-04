# 📝 Aula 3: "Command System Extension" - Extensibility Engineering

**Módulo 3 - Aula 3 | Duração: 120min | Nível: Intermediário++**

---

## 🎯 **Objetivos de Aprendizagem**

- ✅ Criar plugin architecture para novos comandos
- ✅ Implementar command registration system
- ✅ Desenvolver dynamic menu generation
- ✅ Configurar configuration management profissional

---

## 🧩 **PARTE 1: Plugin Architecture** (40min)

### 🔌 **Dynamic Command Loading System**

```python
import importlib
import inspect
from pathlib import Path
from typing import Dict, List, Type, Any
from abc import ABC, abstractmethod

class PluginBase(ABC):
    """Base class for CLI plugins."""
    
    def __init__(self):
        self.name = self.__class__.__name__.lower().replace('plugin', '')
        self.version = "1.0.0"
        self.dependencies = []
        self.enabled = True
        
    @abstractmethod
    async def initialize(self, cli_context: Any):
        """Initialize plugin with CLI context."""
        pass
    
    @abstractmethod
    def get_commands(self) -> List[Command]:
        """Return list of commands provided by this plugin."""
        pass
    
    @abstractmethod
    def get_menu_items(self) -> List[Dict[str, Any]]:
        """Return menu items for this plugin."""
        pass
    
    def get_config_schema(self) -> Dict[str, Any]:
        """Return configuration schema for this plugin."""
        return {}
    
    async def cleanup(self):
        """Cleanup resources when plugin is disabled."""
        pass

class PluginManager:
    """Manage CLI plugins dynamically."""
    
    def __init__(self, plugins_dir: Path):
        self.plugins_dir = plugins_dir
        self.loaded_plugins: Dict[str, PluginBase] = {}
        self.plugin_configs: Dict[str, Dict[str, Any]] = {}
        self.cli_context = None
        
    async def load_plugins(self, cli_context: Any):
        """Load all plugins from plugins directory."""
        self.cli_context = cli_context
        
        if not self.plugins_dir.exists():
            self.plugins_dir.mkdir(parents=True)
            print(f"📁 Created plugins directory: {self.plugins_dir}")
            return
        
        # Scan for plugin files
        plugin_files = list(self.plugins_dir.glob("*_plugin.py"))
        
        print(f"🔍 Scanning for plugins in {self.plugins_dir}")
        print(f"📦 Found {len(plugin_files)} potential plugins")
        
        for plugin_file in plugin_files:
            await self._load_single_plugin(plugin_file)
    
    async def _load_single_plugin(self, plugin_file: Path):
        """Load single plugin file."""
        
        try:
            # Dynamic import
            module_name = plugin_file.stem
            spec = importlib.util.spec_from_file_location(module_name, plugin_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Find plugin classes
            for name, obj in inspect.getmembers(module):
                if (inspect.isclass(obj) and 
                    issubclass(obj, PluginBase) and 
                    obj != PluginBase):
                    
                    # Instantiate plugin
                    plugin = obj()
                    
                    # Check dependencies
                    if await self._check_dependencies(plugin):
                        await plugin.initialize(self.cli_context)
                        self.loaded_plugins[plugin.name] = plugin
                        print(f"✅ Loaded plugin: {plugin.name} v{plugin.version}")
                    else:
                        print(f"❌ Plugin dependencies not met: {plugin.name}")
                        
        except Exception as e:
            print(f"❌ Failed to load plugin {plugin_file.name}: {e}")
    
    async def _check_dependencies(self, plugin: PluginBase) -> bool:
        """Check if plugin dependencies are satisfied."""
        
        for dependency in plugin.dependencies:
            if dependency not in self.loaded_plugins:
                # Try to import as module
                try:
                    importlib.import_module(dependency)
                except ImportError:
                    return False
        
        return True
    
    def get_all_commands(self) -> Dict[str, Command]:
        """Get all commands from all loaded plugins."""
        
        all_commands = {}
        
        for plugin in self.loaded_plugins.values():
            if plugin.enabled:
                try:
                    commands = plugin.get_commands()
                    for command in commands:
                        all_commands[command.name] = command
                        
                        # Register aliases
                        for alias in command.aliases:
                            all_commands[alias] = command
                            
                except Exception as e:
                    print(f"⚠️ Error getting commands from {plugin.name}: {e}")
        
        return all_commands
    
    def get_dynamic_menu(self) -> List[Dict[str, Any]]:
        """Generate dynamic menu from all plugins."""
        
        menu_items = []
        
        for plugin in self.loaded_plugins.values():
            if plugin.enabled:
                try:
                    items = plugin.get_menu_items()
                    for item in items:
                        item["plugin_source"] = plugin.name
                        menu_items.append(item)
                        
                except Exception as e:
                    print(f"⚠️ Error getting menu items from {plugin.name}: {e}")
        
        return sorted(menu_items, key=lambda x: x.get("priority", 50))
    
    async def reload_plugin(self, plugin_name: str):
        """Reload specific plugin."""
        
        if plugin_name in self.loaded_plugins:
            # Cleanup old plugin
            await self.loaded_plugins[plugin_name].cleanup()
            del self.loaded_plugins[plugin_name]
        
        # Find and reload plugin file
        plugin_file = self.plugins_dir / f"{plugin_name}_plugin.py"
        if plugin_file.exists():
            await self._load_single_plugin(plugin_file)
            print(f"🔄 Reloaded plugin: {plugin_name}")
        else:
            print(f"❌ Plugin file not found: {plugin_file}")

# Example plugin implementation
class HistoryPlugin(PluginBase):
    """Plugin for conversation history management."""
    
    def __init__(self):
        super().__init__()
        self.version = "1.0.0"
        self.dependencies = ["sqlite3"]
        
    async def initialize(self, cli_context: Any):
        """Initialize history plugin."""
        self.cli_context = cli_context
        print(f"🔍 History plugin initialized")
    
    def get_commands(self) -> List[Command]:
        """Return history-related commands."""
        return [
            HistoryListCommand(),
            HistorySearchCommand(), 
            HistoryExportCommand()
        ]
    
    def get_menu_items(self) -> List[Dict[str, Any]]:
        """Return menu items."""
        return [
            {
                "id": "history_list",
                "title": "📚 View History",
                "description": "View conversation history",
                "priority": 30,
                "command": "history"
            },
            {
                "id": "history_search", 
                "title": "🔍 Search History",
                "description": "Search through conversations",
                "priority": 31,
                "command": "search"
            }
        ]

class HistoryListCommand(Command):
    """Command to list conversation history."""
    
    def __init__(self):
        super().__init__(
            name="history",
            description="List conversation history",
            aliases=["h", "hist"]
        )
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """List recent conversations."""
        print("📚 CONVERSATION HISTORY")
        print("-" * 25)
        
        # Mock history for demo
        history_items = [
            "2024-08-30 15:30 - Python functions discussion",
            "2024-08-30 14:20 - Claude SDK troubleshooting", 
            "2024-08-30 13:10 - Async programming help"
        ]
        
        for i, item in enumerate(history_items, 1):
            print(f"{i:2d}. {item}")
        
        return CommandResult.SUCCESS
    
    def get_help_text(self) -> str:
        return "List recent conversation history with timestamps and topics."

# Advanced plugin system
class ConfigurablePlugin(PluginBase):
    """Plugin with configuration support."""
    
    def __init__(self):
        super().__init__()
        self.config = {}
        
    def get_config_schema(self) -> Dict[str, Any]:
        """Define configuration schema."""
        return {
            "max_history_items": {
                "type": "integer",
                "default": 50,
                "min": 1,
                "max": 1000,
                "description": "Maximum number of history items to keep"
            },
            "auto_save": {
                "type": "boolean", 
                "default": True,
                "description": "Automatically save conversation history"
            },
            "export_format": {
                "type": "string",
                "default": "json",
                "choices": ["json", "markdown", "html"],
                "description": "Default export format"
            }
        }
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update plugin configuration."""
        
        schema = self.get_config_schema()
        
        # Validate configuration
        for key, value in new_config.items():
            if key in schema:
                field_schema = schema[key]
                
                # Type validation
                expected_type = field_schema["type"]
                if expected_type == "integer" and not isinstance(value, int):
                    raise ValueError(f"Invalid type for {key}: expected int, got {type(value)}")
                elif expected_type == "boolean" and not isinstance(value, bool):
                    raise ValueError(f"Invalid type for {key}: expected bool, got {type(value)}")
                elif expected_type == "string" and not isinstance(value, str):
                    raise ValueError(f"Invalid type for {key}: expected str, got {type(value)}")
                
                # Value validation
                if "choices" in field_schema and value not in field_schema["choices"]:
                    raise ValueError(f"Invalid value for {key}: {value} not in {field_schema['choices']}")
                
                if "min" in field_schema and value < field_schema["min"]:
                    raise ValueError(f"Value for {key} below minimum: {value} < {field_schema['min']}")
                
                if "max" in field_schema and value > field_schema["max"]:
                    raise ValueError(f"Value for {key} above maximum: {value} > {field_schema['max']}")
                
                self.config[key] = value
            else:
                print(f"⚠️ Unknown config key: {key}")
        
        print(f"✅ Configuration updated for {self.name}")
```

---

## ⚙️ **PARTE 2: Configuration Management** (40min)

### 🔧 **Professional Configuration System**

```python
import json
import yaml
from pathlib import Path
from typing import Any, Dict, Optional, Union
from dataclasses import dataclass, asdict
import os

@dataclass 
class CLIConfig:
    """CLI configuration with type safety."""
    
    # Viewer settings
    viewer_api_url: str = "http://localhost:3043"
    viewer_timeout: int = 5
    
    # UI settings
    prompt_style: str = "👤 Você: "
    show_timestamps: bool = True
    color_output: bool = True
    
    # Performance settings
    max_concurrent_requests: int = 3
    request_timeout: int = 30
    cache_enabled: bool = True
    
    # Session settings
    auto_save_sessions: bool = True
    session_storage_path: str = "~/.claude/sessions"
    max_session_history: int = 1000
    
    # Debug settings
    debug_mode: bool = False
    log_level: str = "INFO"
    performance_monitoring: bool = False

class ConfigurationManager:
    """Manage CLI configuration professionally."""
    
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config = CLIConfig()
        self.config_watchers: List[Callable] = []
        
    def load_config(self) -> CLIConfig:
        """Load configuration from file."""
        
        if not self.config_path.exists():
            self.save_config()  # Create default config
            return self.config
        
        try:
            with open(self.config_path, 'r') as f:
                if self.config_path.suffix == '.json':
                    config_data = json.load(f)
                elif self.config_path.suffix in ['.yml', '.yaml']:
                    config_data = yaml.safe_load(f)
                else:
                    raise ValueError(f"Unsupported config format: {self.config_path.suffix}")
            
            # Update config with loaded values
            for key, value in config_data.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)
                else:
                    print(f"⚠️ Unknown config key: {key}")
            
            print(f"📂 Configuration loaded from {self.config_path}")
            return self.config
            
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            print("🔄 Using default configuration")
            return self.config
    
    def save_config(self):
        """Save current configuration to file."""
        
        try:
            config_data = asdict(self.config)
            
            with open(self.config_path, 'w') as f:
                if self.config_path.suffix == '.json':
                    json.dump(config_data, f, indent=2)
                elif self.config_path.suffix in ['.yml', '.yaml']:
                    yaml.dump(config_data, f, default_flow_style=False)
            
            print(f"💾 Configuration saved to {self.config_path}")
            
            # Notify watchers
            for watcher in self.config_watchers:
                try:
                    watcher(self.config)
                except Exception as e:
                    print(f"⚠️ Config watcher error: {e}")
                    
        except Exception as e:
            print(f"❌ Error saving config: {e}")
    
    def update_config(self, updates: Dict[str, Any]):
        """Update configuration with validation."""
        
        original_config = asdict(self.config)
        
        try:
            # Apply updates
            for key, value in updates.items():
                if hasattr(self.config, key):
                    # Type validation
                    original_type = type(getattr(self.config, key))
                    if not isinstance(value, original_type):
                        # Try type conversion
                        try:
                            converted_value = original_type(value)
                            setattr(self.config, key, converted_value)
                        except (ValueError, TypeError):
                            raise ValueError(f"Invalid type for {key}: expected {original_type.__name__}")
                    else:
                        setattr(self.config, key, value)
                else:
                    raise KeyError(f"Unknown configuration key: {key}")
            
            # Validate configuration
            self._validate_config()
            
            # Save if valid
            self.save_config()
            
        except Exception as e:
            # Restore original config on error
            for key, value in original_config.items():
                setattr(self.config, key, value)
            raise e
    
    def _validate_config(self):
        """Validate current configuration."""
        
        # URL validation
        if not self.config.viewer_api_url.startswith(('http://', 'https://')):
            raise ValueError("viewer_api_url must be valid HTTP URL")
        
        # Numeric range validations
        if not 1 <= self.config.viewer_timeout <= 60:
            raise ValueError("viewer_timeout must be between 1 and 60 seconds")
        
        if not 1 <= self.config.max_concurrent_requests <= 20:
            raise ValueError("max_concurrent_requests must be between 1 and 20")
        
        # Path validation
        session_path = Path(self.config.session_storage_path).expanduser()
        try:
            session_path.mkdir(parents=True, exist_ok=True)
        except Exception:
            raise ValueError(f"Cannot create session storage path: {session_path}")
    
    def register_config_watcher(self, callback: Callable[[CLIConfig], None]):
        """Register callback for configuration changes."""
        self.config_watchers.append(callback)
    
    def get_config_summary(self) -> str:
        """Get human-readable configuration summary."""
        
        summary = [
            "⚙️ CURRENT CONFIGURATION",
            "=" * 25,
            f"🌐 Viewer URL: {self.config.viewer_api_url}",
            f"⏱️ Timeouts: {self.config.viewer_timeout}s viewer, {self.config.request_timeout}s requests",
            f"🎨 UI: {'Colors' if self.config.color_output else 'No colors'}, {'Timestamps' if self.config.show_timestamps else 'No timestamps'}",
            f"📊 Performance: {self.config.max_concurrent_requests} concurrent, {'Cache' if self.cache_enabled else 'No cache'}",
            f"💾 Sessions: {'Auto-save' if self.config.auto_save_sessions else 'Manual'}, max {self.config.max_session_history}",
            f"🔧 Debug: {'ON' if self.config.debug_mode else 'OFF'}, level {self.config.log_level}"
        ]
        
        return "\n".join(summary)

# Configuration command
class ConfigCommand(Command):
    """Command for configuration management."""
    
    def __init__(self, config_manager: ConfigurationManager):
        super().__init__(
            name="config",
            description="Manage CLI configuration",
            aliases=["cfg", "settings"]
        )
        self.config_manager = config_manager
    
    async def execute(self, context: CommandContext) -> CommandResult:
        """Execute configuration command."""
        
        # Parse subcommand
        parts = context.user_input.split()
        if len(parts) < 2:
            # Show current config
            print(self.config_manager.get_config_summary())
            return CommandResult.SUCCESS
        
        subcommand = parts[1]
        
        if subcommand == "set" and len(parts) >= 4:
            # Set configuration value
            key = parts[2]
            value = parts[3]
            
            try:
                self.config_manager.update_config({key: value})
                print(f"✅ Configuration updated: {key} = {value}")
            except Exception as e:
                print(f"❌ Configuration error: {e}")
                return CommandResult.ERROR
        
        elif subcommand == "reset":
            # Reset to defaults
            self.config_manager.config = CLIConfig()
            self.config_manager.save_config()
            print("🔄 Configuration reset to defaults")
        
        elif subcommand == "edit":
            # Open config file in editor
            editor = os.environ.get('EDITOR', 'nano')
            subprocess.run([editor, str(self.config_manager.config_path)])
            
            # Reload config
            self.config_manager.load_config()
            print("📝 Configuration file edited and reloaded")
        
        else:
            print("❌ Unknown config subcommand")
            print(self.get_help_text())
            return CommandResult.ERROR
        
        return CommandResult.SUCCESS
    
    def get_help_text(self) -> str:
        return """
        Configuration management:
        
        config                 - Show current configuration
        config set <key> <val> - Set configuration value
        config reset           - Reset to defaults
        config edit            - Edit configuration file
        
        Example: config set viewer_api_url http://localhost:3044
        """
```

---

## 🧪 **EXERCÍCIOS PRÁTICOS**

### **🎯 Exercício 1: Create Custom Plugin (50min)**

```python
class YourCustomPlugin(PluginBase):
    """
    Criar plugin personalizado para funcionalidade específica.
    
    Escolha uma funcionalidade:
    1. NotesPlugin - Sistema de notas integrado
    2. TranslatePlugin - Tradução com Claude
    3. CodeReviewPlugin - Review de código
    4. ProjectPlugin - Gerenciamento de projetos
    5. AnalyticsPlugin - Analytics de uso
    """
    
    def __init__(self):
        super().__init__()
        # TODO: Configure plugin properties
        self.version = "1.0.0"
        self.dependencies = []  # List required dependencies
        
    async def initialize(self, cli_context: Any):
        """Initialize your plugin."""
        # TODO: Setup plugin resources
        pass
    
    def get_commands(self) -> List[Command]:
        """Return plugin commands."""
        # TODO: Implement plugin-specific commands
        return []
    
    def get_menu_items(self) -> List[Dict[str, Any]]:
        """Return plugin menu items."""
        # TODO: Define menu integration
        return []
    
    def get_config_schema(self) -> Dict[str, Any]:
        """Define plugin configuration options."""
        # TODO: Define configuration schema
        return {}

# Test plugin system
async def test_plugin_system():
    """Test complete plugin system."""
    
    # Setup plugin manager
    plugins_dir = Path("./plugins")
    manager = PluginManager(plugins_dir)
    
    # Load plugins
    await manager.load_plugins(cli_context={})
    
    # Test command execution
    commands = manager.get_all_commands()
    print(f"📦 Loaded {len(commands)} commands from plugins")
    
    # Test dynamic menu
    menu = manager.get_dynamic_menu()
    print(f"🎯 Generated menu with {len(menu)} items")
```

### **🎯 Exercício 2: Configuration Optimization (30min)**

```python
class SmartConfigManager(ConfigurationManager):
    """
    Enhance configuration manager with smart features.
    
    Add features:
    1. Environment variable overrides
    2. Configuration validation with detailed errors
    3. Configuration migration between versions
    4. Performance-based auto-tuning
    5. Export/import configuration profiles
    """
    
    def __init__(self, config_path: Path):
        super().__init__(config_path)
        # TODO: Add smart configuration features
        
    def load_with_env_overrides(self) -> CLIConfig:
        """Load config with environment variable overrides."""
        # TODO: Implement environment override logic
        pass
    
    def auto_tune_performance(self):
        """Auto-tune configuration based on system performance."""
        # TODO: Implement performance-based tuning
        pass
    
    def migrate_config(self, old_version: str, new_version: str):
        """Migrate configuration between versions."""
        # TODO: Implement config migration
        pass

# Test smart configuration
def test_smart_config():
    config_manager = SmartConfigManager(Path("./config.json"))
    
    # Test various configuration scenarios
    pass
```

---

## 🎓 **RESUMO**

**Key Insights:** Extensible architecture através de plugins permite infinite customization sem modificar core code.

**Próxima:** [Debugging & Monitoring](curso_modulo_03_aula_04.md)