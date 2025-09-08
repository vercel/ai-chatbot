/**
 * Test Setup Validation Script
 * Validates that all test files and configurations are properly set up
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const stats = fs.statSync(filePath);
    log(`✅ ${description}: ${filePath} (${Math.round(stats.size / 1024)}KB)`, colors.green);
    return true;
  } else {
    log(`❌ ${description}: ${filePath} (missing)`, colors.red);
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  if (exists) {
    const files = fs.readdirSync(dirPath);
    log(`✅ ${description}: ${dirPath} (${files.length} files)`, colors.green);
    return true;
  } else {
    log(`❌ ${description}: ${dirPath} (missing)`, colors.red);
    return false;
  }
}

function validateTestSetup() {
  log('\n🧪 AI Chatbot Test Suite Validation', colors.cyan);
  log('=====================================', colors.cyan);

  let allChecks = [];
  
  // Configuration files
  log('\n📁 Configuration Files:', colors.yellow);
  allChecks.push(checkFile('jest.config.js', 'Jest Configuration'));
  allChecks.push(checkFile('jest.setup.js', 'Jest Setup'));
  allChecks.push(checkFile('package.json', 'Package Configuration'));

  // Test directories
  log('\n📁 Test Directories:', colors.yellow);
  allChecks.push(checkDirectory('__tests__', 'Root Test Directory'));
  allChecks.push(checkDirectory('__tests__/auth', 'Auth Tests'));
  allChecks.push(checkDirectory('__tests__/repositories', 'Repository Tests'));
  allChecks.push(checkDirectory('__tests__/middleware', 'Middleware Tests'));
  allChecks.push(checkDirectory('__tests__/cache', 'Cache Tests'));
  allChecks.push(checkDirectory('__tests__/ai', 'AI Tests'));
  allChecks.push(checkDirectory('__tests__/utils', 'Test Utils'));
  allChecks.push(checkDirectory('__tests__/utils/mocks', 'Mock Files'));
  allChecks.push(checkDirectory('__tests__/utils/helpers', 'Helper Files'));

  // Test files
  log('\n📄 Test Files:', colors.yellow);
  allChecks.push(checkFile('__tests__/auth/guest-security.test.ts', 'Guest Security Tests'));
  allChecks.push(checkFile('__tests__/repositories/artifact-repository.test.ts', 'Artifact Repository Tests'));
  allChecks.push(checkFile('__tests__/middleware/rate-limit.test.ts', 'Rate Limit Tests'));
  allChecks.push(checkFile('__tests__/cache/redis-client.test.ts', 'Redis Client Tests'));
  allChecks.push(checkFile('__tests__/ai/claude-unified.test.ts', 'Claude AI Tests'));

  // Utility files
  log('\n🛠️  Utility Files:', colors.yellow);
  allChecks.push(checkFile('__tests__/utils/mocks/server.ts', 'MSW Server Mock'));
  allChecks.push(checkFile('__tests__/utils/mocks/next-mocks.ts', 'Next.js Mocks'));
  allChecks.push(checkFile('__tests__/utils/__mocks__/fileMock.js', 'File Mock'));
  allChecks.push(checkFile('__tests__/utils/helpers/test-helpers.ts', 'Test Helpers'));
  allChecks.push(checkFile('__tests__/utils/setup-tests.ts', 'Test Setup Utils'));

  // Documentation
  log('\n📚 Documentation:', colors.yellow);
  allChecks.push(checkFile('__tests__/README.md', 'Test Documentation'));

  // Package.json validation
  log('\n📦 Package.json Validation:', colors.yellow);
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check test scripts
    const hasTestScript = packageJson.scripts && packageJson.scripts.test;
    const hasTestWatch = packageJson.scripts && packageJson.scripts['test:watch'];
    const hasTestCoverage = packageJson.scripts && packageJson.scripts['test:coverage'];
    
    if (hasTestScript && hasTestWatch && hasTestCoverage) {
      log('✅ Test scripts configured', colors.green);
      allChecks.push(true);
    } else {
      log('❌ Test scripts missing or incomplete', colors.red);
      allChecks.push(false);
    }

    // Check Jest dependencies
    const jestDeps = [
      'jest',
      '@jest/globals',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'ts-jest',
      'jest-environment-jsdom',
      'msw'
    ];

    const devDeps = packageJson.devDependencies || {};
    const missingDeps = jestDeps.filter(dep => !devDeps[dep]);
    
    if (missingDeps.length === 0) {
      log('✅ All Jest dependencies present', colors.green);
      allChecks.push(true);
    } else {
      log(`❌ Missing dependencies: ${missingDeps.join(', ')}`, colors.red);
      allChecks.push(false);
    }

  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, colors.red);
    allChecks.push(false);
  }

  // Summary
  const passed = allChecks.filter(Boolean).length;
  const total = allChecks.length;
  const percentage = Math.round((passed / total) * 100);
  
  log('\n📊 Validation Summary:', colors.cyan);
  log('===================', colors.cyan);
  
  if (percentage === 100) {
    log(`🎉 All checks passed! (${passed}/${total} - ${percentage}%)`, colors.green);
    log('\n✨ Test suite is ready for use!', colors.green);
    log('\nNext steps:', colors.cyan);
    log('1. Run "pnpm install" to install dependencies');
    log('2. Run "pnpm test" to execute tests');
    log('3. Run "pnpm test:coverage" to see coverage report');
  } else if (percentage >= 90) {
    log(`⚠️  Most checks passed (${passed}/${total} - ${percentage}%)`, colors.yellow);
    log('Minor issues detected, but test suite should be functional', colors.yellow);
  } else {
    log(`❌ Several checks failed (${passed}/${total} - ${percentage}%)`, colors.red);
    log('Please review the missing files and configurations above', colors.red);
  }

  log('\n🔗 Quick Commands:', colors.cyan);
  log('  pnpm install           # Install dependencies');
  log('  pnpm test              # Run all tests');
  log('  pnpm test:watch        # Run tests in watch mode');
  log('  pnpm test:coverage     # Run tests with coverage');
  log('  pnpm test:ci          # Run tests for CI');

  return percentage === 100;
}

// Run validation
if (require.main === module) {
  validateTestSetup();
}

module.exports = { validateTestSetup };