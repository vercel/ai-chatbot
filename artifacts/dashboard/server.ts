import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';

const createFallbackDashboard = (title: string, context: DashboardContext) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            padding: 30px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #f0f0f0; 
            padding-bottom: 20px;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 30px 0;
        }
        .stat-card { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
        }
        .stat-number { 
            font-size: 2em; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .message-list { 
            margin-top: 30px;
        }
        .message { 
            background: #f8f9fa; 
            margin: 10px 0; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #007bff;
        }
        .message.user { 
            border-left-color: #28a745;
        }
        .message.assistant { 
            border-left-color: #007bff;
        }
        .timestamp { 
            color: #666; 
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${context.messages.length}</div>
                <div>Total Messages</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${context.messages.filter(m => m.role === 'user').length}</div>
                <div>User Messages</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${context.messages.filter(m => m.role === 'assistant').length}</div>
                <div>AI Responses</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${context.messages.filter(m => m.toolInvocations?.length).length}</div>
                <div>Tool Uses</div>
            </div>
        </div>

        <div class="message-list">
            <h2>Conversation Timeline</h2>
            ${context.messages.map((msg, index) => `
                <div class="message ${msg.role}">
                    <strong>${msg.role === 'user' ? 'User' : 'Assistant'}:</strong>
                    <p>${msg.content}</p>
                    ${msg.toolInvocations ? `
                        <div style="background: #e9ecef; padding: 10px; margin-top: 10px; border-radius: 4px;">
                            <strong>Tools Used:</strong> ${msg.toolInvocations.map(t => t.toolName).join(', ')}
                        </div>
                    ` : ''}
                    <div class="timestamp">${msg.createdAt?.toLocaleString() || 'Now'}</div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
`;

interface DashboardContext {
  chatId?: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: Date;
    toolInvocations?: Array<{
      toolName: string;
      args: any;
      result?: any;
    }>;
  }>;
}

const getDashboardPrompt = (context: DashboardContext) => `
You are creating an interactive HTML dashboard from a chat conversation. 

Chat Context:
- Chat ID: ${context.chatId || 'Unknown'}
- Total Messages: ${context.messages.length}

Messages Data:
${context.messages.map((msg, index) => `
Message ${index + 1} (${msg.role}):
${msg.content}
${msg.toolInvocations ? `
Tool Invocations:
${msg.toolInvocations.map(tool => `- ${tool.toolName}: ${JSON.stringify(tool.args)}`).join('\n')}
` : ''}
---
`).join('\n')}

IMPORTANT: Generate a COMPLETE, SELF-CONTAINED HTML document that includes:

1. **Complete HTML Structure**:
   - DOCTYPE declaration
   - HTML, HEAD, and BODY tags
   - Meta tags for charset, viewport, and description
   - Title tag with meaningful title

2. **Embedded Styling**: Include ALL CSS within <style> tags in the head:
   - Modern, responsive design
   - Professional color scheme (blues, grays, whites)
   - Grid layouts for sections
   - Cards for different analytics
   - Interactive hover effects
   - Mobile-responsive breakpoints

3. **Dashboard Content**:
   - Header with title and generation timestamp
   - Overview cards showing key statistics
   - Message distribution charts
   - Tool usage analytics (if tools were used)
   - Interactive timeline
   - Search and filter functionality

4. **Interactive JavaScript**: Include ALL JavaScript within <script> tags:
   - Chart.js library from CDN for visualizations
   - Search functionality
   - Filtering capabilities
   - Toggle expandable sections
   - Responsive interactions

5. **Special SQL Analysis** (if SQL tools present):
   - Dedicated SQL queries section
   - Query complexity analysis
   - Database operations summary
   - Performance insights

6. **Data Visualization Requirements**:
   - Bar charts for message distribution
   - Line charts for conversation timeline
   - Pie charts for tool usage
   - Interactive elements that respond to user actions

CRITICAL: The output must be a complete HTML file that can be rendered directly in an iframe without any external dependencies except for Chart.js CDN. Include all CSS and JavaScript inline.

Example structure:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Dashboard</title>
    <style>
        /* All CSS here */
    </style>
</head>
<body>
    <!-- Dashboard content -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        /* All JavaScript here */
    </script>
</body>
</html>
`;

export const dashboardDocumentHandler = createDocumentHandler<'dashboard'>({
  kind: 'dashboard',
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = '';

    // Extract chat context from title which may contain chatId
    // Parse title to see if it contains a chat ID pattern
    const chatIdMatch = title.match(/chat[:\s]+([a-fA-F0-9-]{36})/i);
    const extractedChatId = chatIdMatch ? chatIdMatch[1] : undefined;

    // Create context with sample data (in real implementation, would fetch from database)
    const context: DashboardContext = {
      chatId: extractedChatId || 'current-dashboard',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'I need help analyzing our sales data from the last quarter. Can you create some SQL queries to extract key metrics?',
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: '2', 
          role: 'assistant',
          content: 'I\'ll help you analyze the sales data. Let me create some SQL queries to extract key metrics.',
          createdAt: new Date(Date.now() - 3000000),
          toolInvocations: [
            {
              toolName: 'snowflakeSqlTool',
              args: { query: 'SELECT COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales WHERE created_at >= \'2024-01-01\'' },
              result: { rows: [{ total_sales: 1250, total_revenue: 485000 }] }
            }
          ]
        },
        {
          id: '3',
          role: 'user', 
          content: 'Great! Can you also break down the sales by region?',
          createdAt: new Date(Date.now() - 2400000),
        },
        {
          id: '4',
          role: 'assistant',
          content: 'I\'ll break down the sales data by region for you.',
          createdAt: new Date(Date.now() - 1800000),
          toolInvocations: [
            {
              toolName: 'snowflakeSqlTool', 
              args: { query: 'SELECT region, COUNT(*) as sales_count, SUM(amount) as revenue FROM sales WHERE created_at >= \'2024-01-01\' GROUP BY region ORDER BY revenue DESC' },
              result: { rows: [
                { region: 'North America', sales_count: 650, revenue: 285000 },
                { region: 'Europe', sales_count: 400, revenue: 125000 },
                { region: 'Asia', sales_count: 200, revenue: 75000 }
              ]}
            }
          ]
        },
        {
          id: '5',
          role: 'user',
          content: 'Perfect! Now I have a good overview of our performance.',
          createdAt: new Date(Date.now() - 600000),
        }
      ]
    };

    // Send metadata to client
    dataStream.writeData({
      type: 'dashboard-metadata',
      content: JSON.stringify({
        chatId: context.chatId,
        messagesCount: context.messages.length,
      }),
    });

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: getDashboardPrompt(context),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: `Create a complete, self-contained HTML dashboard with the title: ${title}. 
      
CRITICAL REQUIREMENTS:
- Start with exactly: <!DOCTYPE html>
- Include complete <html>, <head>, and <body> structure
- Embed ALL CSS within <style> tags in the head
- Embed ALL JavaScript within <script> tags before closing body
- Use Chart.js from CDN for charts
- Create working interactive elements
- Use professional styling with cards, grids, and colors
- Ensure it renders properly in an iframe
- Make it visually appealing with real data visualizations`,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    // Fallback: If AI didn't generate proper HTML, use our fallback
    if (!draftContent.includes('<!DOCTYPE html>') && !draftContent.includes('<html')) {
      console.log('AI did not generate valid HTML, using fallback dashboard');
      draftContent = createFallbackDashboard(title, context);
      
      // Stream the fallback content
      dataStream.writeData({
        type: 'text-delta',
        content: draftContent,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = '';

    // Parse existing HTML to understand current dashboard context
    const existingHtml = document.content;
    
    const updatePrompt = `
You are updating an existing HTML dashboard. Here is the current dashboard HTML:

${existingHtml}

Update Request: ${description}

Please modify the dashboard according to the request while maintaining:
- All existing functionality
- Professional styling and layout
- Interactive elements
- Data visualizations
- Responsive design

Provide the complete updated HTML file.
`;

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updatePrompt,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});