import cron from 'node-cron';
import { db } from './db/queries';
import { chat } from './db/schema';
import { eq } from 'drizzle-orm'; // Import eq from drizzle-orm

export async function setupCronJobs(userId: string) {
    // First, ensure we have a system chat
    let systemChatId: string;
    
    try {
        // Try to find existing system chat
        const systemChats = await db.select().from(chat).where(eq(chat.title, '[SYSTEM_NOTIFICATIONS]'));
        
        if (systemChats.length > 0) {
            systemChatId = systemChats[0].id;
        } else {
            // Create a system chat if it doesn't exist
            const { generateUUID } = await import('./utils');
            systemChatId = generateUUID();
            
            await db.insert(chat).values({
                id: systemChatId,
                createdAt: new Date(),
                title: '[SYSTEM_NOTIFICATIONS]',
                userId: userId,
                visibility: 'public' // Make it public so all users can see it
            });
        }
    } catch (error) {
        console.error('Error setting up system chat:', error);
        return; // Exit if we can't set up the system chat
    }

    cron.schedule('*/30 * * * * *', async () => {
        console.log('Running cron job...');

        try {
            // Import dependencies
            const { saveMessages } = await import('./db/queries');
            const { generateUUID } = await import('./utils');
            
            // Make a direct fetch request to your Galadriel endpoint
            const response = await fetch('http://localhost:8000/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GALADRIEL_API_KEY || ''}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo',
                    messages: [
                        { role: 'user', content: '[CRON CHECK]' }
                    ],
                    stream: false // Request non-streaming response
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            // Handle SSE format if present
            const text = await response.text();
            let messageContent = '';
            
            if (text.startsWith('data:')) {
                // Extract content from SSE format
                const jsonLines = text.split('\n')
                    .filter(line => line.startsWith('data:'))
                    .map(line => line.substring(5).trim());
                
                for (const line of jsonLines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.choices?.[0]?.delta?.content) {
                            messageContent = data.choices[0].delta.content;
                            break;
                        }
                    } catch (error) {
                        console.error('Error parsing JSON line:', error);
                    }
                }
            } else {
                // Try to parse as regular JSON
                try {
                    const data = JSON.parse(text);
                    messageContent = data.choices?.[0]?.message?.content || '';
                } catch (error) {
                    console.error('Error parsing JSON response:', error);
                }
            }
            
            if (messageContent) {
                // Save the message to your database using the system chat ID
                await saveMessages({
                    messages: [{
                        id: generateUUID(),
                        chatId: systemChatId, // Use the system chat ID
                        role: 'assistant',
                        content: messageContent,
                        createdAt: new Date(),
                        isCronMessage: true
                    }]
                });
                
                console.log('Cron message saved successfully');
            }

            console.log('Cron job completed successfully.');
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    console.log('Cron jobs set up.');
}