# AI Chatbot Test Suite

This directory contains a comprehensive test suite for the AI chatbot application, providing 80%+ code coverage for critical paths and robust testing infrastructure.

## 📁 Test Structure

```
__tests__/
├── auth/                          # Authentication and security tests
│   └── guest-security.test.ts     # Guest user authentication and validation
├── repositories/                  # Repository pattern tests
│   └── artifact-repository.test.ts # Artifact repository CRUD operations
├── middleware/                    # Middleware tests
│   └── rate-limit.test.ts         # Rate limiting functionality
├── cache/                         # Caching system tests
│   └── redis-client.test.ts       # Redis client operations
├── ai/                           # AI integration tests
│   └── claude-unified.test.ts     # Claude AI provider management
├── utils/                        # Test utilities and helpers
│   ├── mocks/                    # Mock implementations
│   │   ├── server.ts             # MSW API mocking server
│   │   ├── next-mocks.ts         # Next.js specific mocks
│   │   └── __mocks__/            # Static file mocks
│   ├── helpers/                  # Test helper functions
│   │   └── test-helpers.ts       # Common test utilities
│   └── setup-tests.ts            # Advanced test setup utilities
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Global Jest setup
└── README.md                     # This documentation
```

## 🧪 Test Categories

### Unit Tests
- **Guest Security**: Token generation, validation, feature access control
- **Artifact Repository**: CRUD operations, data validation, search functionality
- **Rate Limiting**: Redis/memory backend, client identification, limits enforcement
- **Redis Client**: Connection management, health checks, command execution
- **Claude Unified**: Provider management, chat functionality, error handling

### Integration Tests
- API endpoint testing with MSW
- Database operations with mocked connections
- Authentication flows
- File upload handling
- Streaming responses

### Test Coverage Goals
- **Critical Components**: 90%+ coverage
  - Authentication and security
  - Rate limiting
  - AI integrations
- **Standard Components**: 80%+ coverage
  - Repositories
  - Cache operations
  - Utilities

## 🚀 Getting Started

### Install Dependencies
```bash
pnpm install
```

### Run Tests
```bash
# Run all tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run CI tests (no watch, with coverage)
pnpm test:ci
```

### Run Specific Tests
```bash
# Run specific test file
pnpm test auth/guest-security.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="rate limit"

# Run tests in specific directory
pnpm test repositories/
```

## 🛠️ Test Utilities

### Mock Service Worker (MSW)
We use MSW for API mocking to provide realistic HTTP responses:

```typescript
import { server } from '@/__tests__/utils/mocks/server';

// Add custom handler for specific test
server.use(
  http.post('/api/custom-endpoint', () => {
    return HttpResponse.json({ success: true });
  })
);
```

### Test Helpers
Common utilities for creating test data:

```typescript
import testHelpers from '@/__tests__/utils/helpers/test-helpers';

// Create mock user
const user = testHelpers.createMockUser({ name: 'Custom User' });

// Create mock request
const request = testHelpers.createMockRequest({
  method: 'GET',
  headers: { 'x-user-id': 'test-user' }
});

// Freeze time for predictable tests
const unfreezeTime = testHelpers.freezeTime('2024-01-01');
// ... test code ...
unfreezeTime();
```

### Setup Functions
Specialized setup for different test scenarios:

```typescript
import setupTests from '@/__tests__/utils/setup-tests';

// Database tests
const mockDb = setupTests.setupDatabaseTests();

// Redis tests  
const mockRedis = setupTests.setupRedisTests();

// Authentication tests
const { mockUser, mockAuthenticated } = setupTests.setupAuthTests();
```

## 📋 Test Patterns

### Basic Test Structure
```typescript
describe('Component/Feature Name', () => {
  let mockDependency: jest.MockedFunction<any>;

  beforeEach(() => {
    mockDependency = jest.fn();
    jest.clearAllMocks();
  });

  describe('method name', () => {
    it('should do something when given valid input', () => {
      // Arrange
      const input = 'test-input';
      mockDependency.mockReturnValue('expected-output');

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected-output');
      expect(mockDependency).toHaveBeenCalledWith(input);
    });
  });
});
```

### Async Testing
```typescript
it('should handle async operations', async () => {
  mockAsyncFunction.mockResolvedValue({ data: 'test' });
  
  const result = await asyncFunction();
  
  expect(result).toEqual({ data: 'test' });
});
```

### Error Testing
```typescript
it('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  await expect(functionUnderTest()).rejects.toThrow('Test error');
});
```

### Mock Implementation
```typescript
it('should use mock implementation', () => {
  const mockCallback = jest.fn((x) => x * 2);
  
  const result = [1, 2, 3].map(mockCallback);
  
  expect(result).toEqual([2, 4, 6]);
  expect(mockCallback).toHaveBeenCalledTimes(3);
});
```

## 🔧 Advanced Testing

### Testing with Next.js
```typescript
import { NextRequest } from 'next/server';
import nextMocks from '@/__tests__/utils/mocks/next-mocks';

// Mock Next.js router
jest.mock('next/navigation', () => nextMocks);

// Create mock Next.js request
const request = new NextRequest('http://localhost:3033/api/test');
```

### Redis Testing
```typescript
import { setupRedisTests } from '@/__tests__/utils/setup-tests';

const mockRedis = setupRedisTests();

it('should interact with Redis', async () => {
  mockRedis.get.mockResolvedValue('cached-value');
  
  const result = await cacheFunction('key');
  
  expect(result).toBe('cached-value');
  expect(mockRedis.get).toHaveBeenCalledWith('key');
});
```

### Streaming Response Testing
```typescript
import { setupStreamingTests } from '@/__tests__/utils/setup-tests';

const { createMockStream } = setupStreamingTests();

it('should handle streaming responses', async () => {
  const stream = createMockStream(['chunk1', 'chunk2', 'chunk3']);
  
  const chunks = [];
  const reader = stream.getReader();
  
  let done = false;
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;
    if (value) {
      chunks.push(new TextDecoder().decode(value));
    }
  }
  
  expect(chunks).toEqual(['chunk1', 'chunk2', 'chunk3']);
});
```

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:

- **HTML Report**: `coverage/lcov-report/index.html` - Interactive coverage browser
- **LCOV Data**: `coverage/lcov.info` - For CI/CD integration
- **JSON Summary**: `coverage/coverage-summary.json` - Programmatic access

### Coverage Thresholds
- **Global**: 80% across all metrics
- **Critical Components**: 85-90% coverage
- **Security Components**: 90%+ coverage

## 🐛 Debugging Tests

### Enable Verbose Logging
```bash
pnpm test --verbose
```

### Debug Specific Test
```bash
pnpm test --testNamePattern="specific test" --verbose
```

### Enable Debug Logs
```bash
DEBUG=* pnpm test
```

### Jest Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 🔍 Best Practices

### 1. Test Naming
- Use descriptive test names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Test Organization
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for setup/cleanup
- Keep tests focused and atomic

### 3. Mocking
- Mock external dependencies
- Use realistic mock data
- Clear mocks between tests

### 4. Assertions
- Use specific matchers (`toBe` vs `toEqual`)
- Test both success and error cases
- Verify side effects and interactions

### 5. Performance
- Avoid unnecessary async/await in tests
- Use `jest.useFakeTimers()` for time-dependent tests
- Mock heavy operations

## 🚨 Troubleshooting

### Common Issues

1. **"Cannot find module" Errors**
   - Check Jest moduleNameMapping in config
   - Ensure proper TypeScript paths

2. **Timeout Errors**
   - Increase test timeout with `jest.setTimeout()`
   - Check for unresolved promises

3. **Memory Leaks**
   - Clear timers and intervals
   - Properly cleanup event listeners
   - Reset global state

4. **Mock Issues**
   - Clear mocks between tests
   - Check mock implementation order
   - Verify mock return values

### Environment Variables
Set these for different test scenarios:
```bash
NODE_ENV=test
CI=true                    # For CI mode
SILENT_TESTS=true         # Suppress console output
```

## 📈 Continuous Integration

The test suite is designed for CI/CD environments:

```bash
# CI test command
pnpm test:ci
```

This will:
- Run all tests without watch mode
- Generate coverage reports
- Exit with appropriate codes for CI
- Suppress unnecessary console output

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Add appropriate mocks and setup
3. Ensure good coverage of new features
4. Update this documentation if needed
5. Run the full test suite before submitting

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)