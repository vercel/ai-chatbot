#!/usr/bin/env python3
"""
Main entry point for claude_code_sdk module execution.
Allows running: python -m claude_code_sdk
"""

# Import from src module
import sys
import os
import anyio

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import and run main from src
from src.__main__ import main

if __name__ == "__main__":
    anyio.run(main)