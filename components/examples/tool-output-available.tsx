'use client';

import { CodeBlock } from '@/components/elements/code-block';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/elements/tool';
import type { ToolUIPart } from 'ai';
import { nanoid } from 'nanoid';

const toolCall: ToolUIPart = {
  type: 'tool-database_query' as const,
  toolCallId: nanoid(),
  state: 'output-available' as const,
  input: {
    query: 'SELECT COUNT(*) FROM users WHERE created_at >= ?',
    params: ['2024-01-01'],
    database: 'analytics',
  },
  output: [
    {
      'User ID': 1,
      Name: 'John Doe',
      Email: 'john@example.com',
      'Created At': '2024-01-15',
    },
    {
      'User ID': 2,
      Name: 'Jane Smith',
      Email: 'jane@example.com',
      'Created At': '2024-01-20',
    },
    {
      'User ID': 3,
      Name: 'Bob Wilson',
      Email: 'bob@example.com',
      'Created At': '2024-02-01',
    },
    {
      'User ID': 4,
      Name: 'Alice Brown',
      Email: 'alice@example.com',
      'Created At': '2024-02-10',
    },
    {
      'User ID': 5,
      Name: 'Charlie Davis',
      Email: 'charlie@example.com',
      'Created At': '2024-02-15',
    },
  ],
  errorText: undefined,
};

const Example = () => (
  <div style={{ height: '500px' }}>
    <Tool>
      <ToolHeader state={toolCall.state} type={toolCall.type} />
      <ToolContent>
        <ToolInput input={toolCall.input} />
        {toolCall.state === 'output-available' && (
          <ToolOutput
            errorText={toolCall.errorText}
            output={
              <CodeBlock
                code={JSON.stringify(toolCall.output)}
                language="json"
              />
            }
          />
        )}
      </ToolContent>
    </Tool>
  </div>
);

export default Example;
