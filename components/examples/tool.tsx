'use client';

import { Response } from '@/components/elements/response';
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
  output: `| User ID | Name | Email | Created At |
|---------|------|-------|------------|
| 1 | John Doe | john@example.com | 2024-01-15 |
| 2 | Jane Smith | jane@example.com | 2024-01-20 |
| 3 | Bob Wilson | bob@example.com | 2024-02-01 |
| 4 | Alice Brown | alice@example.com | 2024-02-10 |
| 5 | Charlie Davis | charlie@example.com | 2024-02-15 |`,
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
            output={<Response>{toolCall.output as string}</Response>}
          />
        )}
      </ToolContent>
    </Tool>
  </div>
);

export default Example;
