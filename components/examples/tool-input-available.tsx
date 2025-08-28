'use client';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from '@/components/elements/tool';
import { nanoid } from 'nanoid';

const toolCall = {
  type: 'tool-image_generation' as const,
  toolCallId: nanoid(),
  state: 'input-available' as const,
  input: {
    prompt: 'A futuristic cityscape at sunset with flying cars',
    style: 'digital_art',
    resolution: '1024x1024',
    quality: 'high',
  },
  output: undefined,
  errorText: undefined,
};

const Example = () => (
  <div style={{ height: '500px' }}>
    <Tool>
      <ToolHeader state={toolCall.state} type={toolCall.type} />
      <ToolContent>
        <ToolInput input={toolCall.input} />
      </ToolContent>
    </Tool>
  </div>
);

export default Example;
