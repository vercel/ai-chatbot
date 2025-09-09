import { getMessageById } from './lib/db/queries.ts';

async function testGetMessageById() {
  try {
    console.log('Testing getMessageById...');
    const result = await getMessageById({ id: 'test-id' });
    console.log('Success:', result);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testGetMessageById();
