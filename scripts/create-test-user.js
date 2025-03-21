
const { createUser } = require('../lib/db/queries');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    await createUser('test@wizzo.ai', 'Qpqp@1010');
    console.log('Test user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create test user:', error);
    process.exit(1);
  }
}

createTestUser();
