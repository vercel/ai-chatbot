/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directory for tests
  rootDir: '.',
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.*',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!lib/db/migrations/**',
    '!*.config.js',
  ],
  
  // Coverage thresholds for critical paths
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical components with higher thresholds
    'lib/security/guest-security.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'lib/middleware/rate-limit.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'lib/cache/redis-client.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'lib/repositories/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Coverage report formats
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/',
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
  ],
  
  // Timeout for tests
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Handle static file imports
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__tests__/utils/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Global test variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Detect hanging promises/handles
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Force exit after tests
  forceExit: false,
  
  // Bail on first failure for CI
  bail: process.env.CI ? 1 : false,
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3033',
  },
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Preset for Next.js
  preset: undefined,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|@ai-sdk|ai)/)',
  ],
  
  // Extensions to look for when resolving modules
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Setup for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.(test|spec).(ts|tsx|js|jsx)'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.(test|spec).(ts|tsx|js|jsx)'],
      testEnvironment: 'node',
    },
    {
      displayName: 'default',
      testMatch: [
        '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
        '!<rootDir>/__tests__/unit/**/*',
        '!<rootDir>/__tests__/integration/**/*'
      ],
      testEnvironment: 'jsdom',
    },
  ],
};