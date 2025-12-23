"""
Health check script for all TiQology services
"""
import requests
import sys

def check_health():
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception:
        sys.exit(1)

if __name__ == "__main__":
    check_health()
