#!/usr/bin/env python3
"""
Quick verification script to check if FastAPI setup is correct.
Run this after installing dependencies to verify everything is set up properly.
"""

import importlib.util
import sys


def check_import(module_name):
    """Check if a module can be imported."""
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is None:
            return False, f"Module '{module_name}' not found"
        return True, f"✓ {module_name}"
    except Exception as e:
        return False, f"✗ {module_name}: {str(e)}"


def main():
    print("Verifying FastAPI backend setup...\n")

    # Check core dependencies
    dependencies = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "asyncpg",
        "pydantic",
        "pydantic_settings",
        "jose",
        "passlib",
        "httpx",
    ]

    print("Checking dependencies:")
    all_ok = True
    for dep in dependencies:
        ok, message = check_import(dep)
        print(f"  {message}")
        if not ok:
            all_ok = False

    print("\nChecking application modules:")
    app_modules = [
        "app",
        "app.config",
        "app.main",
        "app.core.database",
        "app.core.security",
        "app.api.v1.auth",
        "app.api.v1.chat",
    ]

    for module in app_modules:
        ok, message = check_import(module)
        print(f"  {message}")
        if not ok:
            all_ok = False

    print("\n" + "=" * 50)
    if all_ok:
        print("✓ All checks passed! Setup looks good.")
        print("\nNext steps:")
        print("1. Copy .env.example to .env and configure it")
        print("2. Run: uv run uvicorn app.main:app --reload --port 8000")
        print("   Or use: ./run.sh")
        print("3. Visit http://localhost:8000/docs to see the API")
        return 0
    else:
        print("✗ Some checks failed. Please install missing dependencies:")
        print("  uv sync")
        return 1


if __name__ == "__main__":
    sys.exit(main())
