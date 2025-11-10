# Tests Directory

Test files organized by type and purpose. Uses Playwright for E2E testing.

## Structure

### `e2e/`
End-to-end tests using Playwright:
- **`artifacts.test.ts`** - Artifact creation and editing tests
- **`chat.test.ts`** - Chat functionality tests
- **`reasoning.test.ts`** - AI reasoning tests
- **`session.test.ts`** - Session and authentication tests

### `pages/`
Page object models and page helpers:
- Page objects for test organization and reusability

### `prompts/`
Test prompt fixtures:
- Predefined prompts for testing AI interactions
- Used in E2E tests to simulate user interactions

### `routes/`
API route tests:
- Tests for API endpoints
- Validates request/response handling

### Root Files
- **`fixtures.ts`** - Test data fixtures
- **`helpers.ts`** - Test helper functions and utilities

## Testing Setup

- **Framework**: Playwright for E2E tests
- **Configuration**: `playwright.config.ts` in project root
- **Fixtures**: Shared test data in `fixtures.ts`
- **Helpers**: Reusable test utilities in `helpers.ts`

## Notes

- E2E tests simulate real user interactions
- Tests should be independent and idempotent
- Use fixtures for consistent test data
- Page objects help organize complex test flows
