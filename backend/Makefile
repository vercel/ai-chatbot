.PHONY: help install run test clean format lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	uv sync

install-dev: ## Install with dev dependencies
	uv sync --dev

run: ## Run the FastAPI server
	uv run uvicorn app.main:app --reload --port 8000

test: ## Run tests
	uv run pytest

test-watch: ## Run tests in watch mode
	uv run pytest-watch

format: ## Format code with black
	uv run black app/ tests/

lint: ## Lint code with ruff
	uv run ruff check app/ tests/
	uv run ruff format --check app/ tests/

fix: ## Auto-fix linting issues
	uv run ruff check --fix app/ tests/
	uv run ruff format app/ tests/

clean: ## Clean cache and temporary files
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov

update: ## Update all dependencies
	uv sync --upgrade

add: ## Add a dependency (usage: make add PACKAGE=package-name)
	uv add $(PACKAGE)

add-dev: ## Add a dev dependency (usage: make add-dev PACKAGE=package-name)
	uv add --dev $(PACKAGE)

