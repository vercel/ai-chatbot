import { chatAutoViewAgent } from './lib/autoview/chat-agent';

async function testAgent() {
  try {
    console.log('Testing chat agent...');
    const result = await chatAutoViewAgent.generate();
    console.log('Generated successfully:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAgent();