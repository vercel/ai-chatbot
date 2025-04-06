import type { ToolInvocation } from 'ai';
import { SlackSendDmToUser } from './slack-send-dm-to-user';
import { GoogleSendEmail } from './google-send-email';

export const ARCADE_TOOLS_WITH_HUMAN_IN_THE_LOOP = [
  'Slack_SendDmToUser',
  'Google_SendEmail',
];
export const ToolCallArcadeTool = ({
  toolInvocation,
  addToolResult,
}: {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: { toolCallId: string; result: any }) => void;
}) => {
  const { toolName } = toolInvocation;

  if (toolName === 'Slack_SendDmToUser') {
    return (
      <SlackSendDmToUser
        toolInvocation={toolInvocation}
        addToolResult={addToolResult}
      />
    );
  }

  if (toolName === 'Google_SendEmail') {
    return (
      <GoogleSendEmail
        toolInvocation={toolInvocation}
        addToolResult={addToolResult}
      />
    );
  }
};
