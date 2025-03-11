import cron from 'node-cron';
import { db } from './db/queries';
import { chat } from './db/schema';
import { eq, and } from 'drizzle-orm';

let cronJobInitialized = false;

export async function setupCronJobs(userId: string) {
    // Skip if cron job is already initialized
    if (cronJobInitialized) {
        console.log('Cron jobs already initialized, skipping...');
        return;
    }
    
    // First, ensure we have a system chat
    let systemChatId: string;
    
    try {
        // Try to find existing system chat
        const systemChats = await db.select().from(chat).where(eq(chat.title, '[RESEARCH AGENT]'));
        
        if (systemChats.length > 0) {
            systemChatId = systemChats[0].id;
            console.log('Found existing research agent chat with ID:', systemChatId);
        } else {
            // Create a system chat if it doesn't exist
            const { generateUUID } = await import('./utils');
            systemChatId = generateUUID();
            
            await db.insert(chat).values({
                id: systemChatId,
                createdAt: new Date(),
                title: '[RESEARCH AGENT]',
                userId: userId,
                visibility: 'public' // Make it public so all users can see it
            });
            console.log('Created new research agent chat with ID:', systemChatId);
        }
    } catch (error) {
        console.error('Error setting up research agent chat:', error);
        return; // Exit if we can't set up the system chat
    }

    cron.schedule('*/30 * * * * *', async () => {
        console.log('Running cron job...');
    
        try {
            // Import dependencies
            const { saveMessages } = await import('./db/queries');
            const { generateUUID } = await import('./utils');
            
            const baseURL = process.env.GALADRIEL_BASE_URL ?? 'http://localhost:8000';
            const response = await fetch(`${baseURL}/chat/completions`, {
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
                console.error(`API request failed with status ${response.status}`);
                // Don't save error messages to the database that would cause UI issues
                return;
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
                    console.log('API response data:', data);
                    console.log('Message content type:', typeof data.choices?.[0]?.message?.content);
                    messageContent = data.choices?.[0]?.message?.content || '';
                } catch (error) {
                    console.error('Error parsing JSON response:', error);
                }
            }
            
            // Ensure messageContent is always a string
            if (typeof messageContent === 'object' && messageContent !== null) {
                console.log('Message content is an object:', messageContent);
                try {
                    // Pretty format the JSON with indentation for better readability
                    messageContent = JSON.stringify(messageContent, null, 2);
                } catch (error) {
                    console.error('Error stringifying message content:', error);
                    messageContent = JSON.stringify(messageContent); // Fallback to basic stringify
                }
            } else if (typeof messageContent !== 'string') {
                messageContent = String(messageContent);
            }
            
            if (!messageContent || messageContent.trim() === '' || messageContent === ' ' || messageContent === '[object Object]') {
                console.log('Message content is empty or invalid:', messageContent);
                return;
            }
            
            // Get all research agent chats for all users
            const allSystemChats = await db.select().from(chat).where(eq(chat.title, '[RESEARCH AGENT]'));
            
            if (allSystemChats.length === 0) {
                console.log('No research agent chats found');
                return;
            }
            
            // Update all system chats to move them to the top of the chat list
            for (const systemChat of allSystemChats) {
                // Update the createdAt timestamp to make it appear as the most recent chat
                await db.update(chat)
                    .set({ createdAt: new Date() })
                    .where(eq(chat.id, systemChat.id));
                
                // Save the message to each user's system chat
                await saveMessages({
                    messages: [{
                        id: generateUUID(),
                        chatId: systemChat.id,
                        role: 'assistant',
                        content: messageContent,
                        createdAt: new Date(),
                        isCronMessage: true
                    }]
                });
            }
            
            console.log(`Cron message saved to ${allSystemChats.length} research agent chats`);
            console.log('Cron job completed successfully.');
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    // Mark as initialized
    cronJobInitialized = true;
    console.log('Cron jobs set up.');
}


export async function ensureUserHasSystemChat(userId: string) {
    try {
        // Find the system chat for this user
        const userSystemChats = await db.select()
            .from(chat)
            .where(
                and(
                    eq(chat.title, '[RESEARCH AGENT]'),
                    eq(chat.userId, userId)
                )
            );
        
        if (userSystemChats.length === 0) {
            // Create a system chat for this user
            const { generateUUID } = await import('./utils');
            
            await db.insert(chat).values({
                id: generateUUID(),
                createdAt: new Date(),
                title: '[RESEARCH AGENT]',
                userId: userId,
                visibility: 'public'
            });
            
            console.log('Created research agent chat for user:', userId);
        }
    } catch (error) {
        console.error('Error ensuring research agent chat for user:', error);
    }
}