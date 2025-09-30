import { createClient } from 'redis';
import { WhatsAppMCPClient, type MessageCanonical } from '../adapters/whatsapp/mcp-client';
import { echoWeb } from '../adapters/bridge/echo-web';

async function main(): Promise<void> {
  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
  await redis.connect();

  const mcp = new WhatsAppMCPClient(
    process.env.MCP_WHATSAPP_URL ?? 'ws://whatsapp-mcp:8080',
    process.env.MCP_TOKEN ?? 'dev-token',
  );

  mcp.on('message', async (msg: MessageCanonical) => {
    await redis.xAdd('omni.messages', '*', { data: JSON.stringify(msg) });
    const echo = echoWeb(msg);
    await redis.xAdd('omni.outbox', '*', { data: JSON.stringify(echo) });
    console.log('echoed', echo);
  });

  if (process.env.SIMULATE === '1') {
    // Simulate both a text and an image message for local testing.
    mcp.simulate({ type: 'text', text: 'hello from wa' });
    mcp.simulate({ type: 'image', mediaUrl: 'http://example.com/image.jpg' });
    // give some time for redis writes then quit
    setTimeout(async () => {
      await redis.quit();
    }, 500);
  } else {
    await mcp.connect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
