import { getToolkitNameByOpenAIToolName } from '@/lib/arcade/utils';
import * as Icons from './index';

export const getToolkitIconByToolName = (toolName: string) => {
  const toolkitName = getToolkitNameByOpenAIToolName(toolName);
  switch (toolkitName) {
    case 'discord':
      return Icons.Discord;
    case 'gmail':
      return Icons.Gmail;
    case 'google':
      return Icons.Google;
    case 'linkedin':
      return Icons.LinkedIn;
    case 'notion':
      return Icons.Notion;
    case 'slack':
      return Icons.Slack;
    case 'x':
      return Icons.X;
    case 'zoom':
      return Icons.Zoom;
    case 'github':
      return Icons.GitHub;
    default:
      return null;
  }
};
