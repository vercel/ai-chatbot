'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Summarize my progress last week',
      label: 'and prioritize next steps',
      action:
        'Provide a focused weekly progress analysis. Start by searching transcripts from the past 7 days to identify key discussions and decisions. Then check recent Slack messages in your main project channels for updates and team interactions. (not all slack channels are relevant to the project) Review recent Gmail for important communications and approvals through search or listing. Synthesize findings into: 1) Key accomplishments with measurable impact, 2) Decisions made and their implications, 3) Blockers encountered and resolution status, 4) Action items by priority with owners and deadlines. Give me a breakdown highlighting what needs immediate attention this week.',
    },
    {
      title: 'Find my current biggest risks',
      label: 'and suggest mitigation strategies',
      action:
        'Conduct a targeted risk assessment starting with recent communications. Begin by searching transcripts from the past 2 weeks for mentions of risks, concerns, blockers, or delays. Then check recent Slack messages in key project channels for escalations or worried sentiment. Review recent Gmail for urgent requests or deadline warnings. For each identified risk: 1) Assess probability and impact, 2) Identify early warning signals already present, 3) Suggest specific mitigation steps with owners, 4) Recommend preventive measures. Prioritize by potential business impact and time sensitivity. If initial findings suggest deeper investigation is needed, we can expand the search scope.',
    },
    {
      title: 'Help me prepare for my next meeting',
      label: 'what do I need to know?',
      action:
        'Prepare a focused briefing for your next meeting. Check calendar for the immediate upcoming meeting, then gather targeted context: search recent transcripts with these attendees, check recent Slack conversations about the meeting topics, review recent Gmail threads with participants. Create a prep document with: 1) Meeting purpose and desired outcomes, 2) Key discussion points from previous interactions, 3) Outstanding action items to follow up on, 4) Potential questions or concerns to address, 5) Recommended talking points based on recent developments.',
    },
    {
      title: 'Show me what my team is feeling',
      label: 'and who might need support',
      action:
        'Analyze team health and sentiment through recent communications. Start by reviewing recent Slack messages in your main team channels, focusing on tone, response times, and engagement levels. Search recent transcripts for emotional indicators or stress signals. Check recent Gmail for communication patterns. Identify: 1) Individual team members showing signs of stress or disengagement, 2) Team dynamics and collaboration health, 3) Celebration opportunities for wins or milestones, 4) Specific support interventions needed. Provide actionable recommendations for improving team morale and productivity.',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
