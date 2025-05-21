import { getWeather } from './get-weather';
import { createDocument } from './create-document';
import { updateDocument } from './update-document';
import { requestSuggestions } from './request-suggestions';
import { getN8nTools } from './n8n-mcp'; // Assuming n8n-mcp might move or stay

// Interface for the arguments needed by tool factories
interface ToolArguments {
  userId: string;
  dataStream: any;
  chatId: string;
}

export async function assembleTools({
  userId,
  dataStream,
  chatId,
}: ToolArguments) {
  // Fetch N8n tools dynamically
  const n8nTools = await getN8nTools();
  const n8nToolNames = Object.keys(n8nTools || {});
  console.log(
    `[assembleTools] Fetched n8n tools. Count: ${n8nToolNames.length}, Names: ${
      n8nToolNames.join(', ') || 'None'
    }`,
  );

  // Define standard tools, passing required arguments
  const standardTools = {
    getWeather, // Assumes getWeather doesn't need specific context like userId/dataStream
    createDocument: createDocument({ userId, dataStream, chatId }),
    updateDocument: updateDocument({ userId, dataStream }),
    requestSuggestions: requestSuggestions({ userId, dataStream }),
  };

  // Combine standard and n8n tools
  const combinedTools = {
    ...standardTools,
    ...(n8nTools || {}), // Merge fetched n8n tools
  };

  return combinedTools;
}
