import type { DataStreamWriter } from 'ai';
import type { Session } from 'next-auth';
import { createDocument } from './create-document';
import { updateDocument } from './update-document';
import { requestSuggestions } from './request-suggestions';
import { getWeather } from './get-weather';
import { mcp } from './mcp';

type ToolList = Array<keyof ReturnType<typeof tools>>;

function tools({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) {
  return {
    getWeather,
    createDocument: createDocument({ session, dataStream }),
    updateDocument: updateDocument({ session, dataStream }),
    requestSuggestions: requestSuggestions({
      session,
      dataStream,
    }),
    ...mcp.tools,
  };
}

const activeTools: ToolList = [
  'getWeather',
  'createDocument',
  'updateDocument',
  'requestSuggestions',
  ...(mcp.toolList as ToolList),
];

export { tools, activeTools };
