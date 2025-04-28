'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { CallItem, type Call } from './sidebar-call-item';
import { LoaderIcon } from './icons';

type GroupedCalls = {
  today: Call[];
  yesterday: Call[];
  lastWeek: Call[];
  lastMonth: Call[];
  older: Call[];
};

// Dummy data for demonstration
const dummyCalls: Call[] = [
  {
    id: '1',
    title: 'Team Standup Meeting',
    createdAt: new Date(),
    duration: 45,
    callStatus: 'completed',
    callType: 'video',
    participantCount: 8,
    visibility: 'private',
    summary: 'Team discussed current project progress. Key points:\n- Frontend team completed the new dashboard UI\n- Backend team working on API optimization\n- QA team found 3 critical bugs that need immediate attention\n- Next sprint planning scheduled for Friday',
    transcription: [
      {
        timestamp: Date.now() - 2000000,
        speaker: 'Sarah (Project Manager)',
        text: 'Good morning everyone! Let\'s start with updates from the frontend team.',
      },
      {
        timestamp: Date.now() - 1800000,
        speaker: 'Mike (Frontend Lead)',
        text: 'We\'ve completed the dashboard UI redesign. All components are now using the new design system.',
      },
      {
        timestamp: Date.now() - 1600000,
        speaker: 'John (Backend Lead)',
        text: 'On the backend side, we\'re optimizing API response times. Seeing about 40% improvement so far.',
      },
    ],
  },
  {
    id: '2',
    title: 'Client Call - Project Review',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    duration: 30,
    callStatus: 'completed',
    callType: 'audio',
    participantCount: 3,
    visibility: 'private',
    summary: 'Client review of Q1 deliverables. Client expressed satisfaction with progress. Action items:\n- Schedule follow-up for UI feedback\n- Send updated timeline by EOW\n- Review budget allocation for Q2',
    transcription: [
      {
        timestamp: Date.now() - 90000000,
        speaker: 'Client',
        text: 'Overall, we\'re very happy with the progress made in Q1.',
      },
      {
        timestamp: Date.now() - 89000000,
        speaker: 'Project Lead',
        text: 'Thank you! We\'ve worked hard to meet all the milestones.',
      },
    ],
  },
  {
    id: '3',
    title: 'Technical Discussion',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    duration: 15,
    callStatus: 'missed',
    callType: 'video',
    participantCount: 2,
    visibility: 'public',
    summary: 'Meeting was missed due to scheduling conflict. Rescheduled for tomorrow.',
    transcription: [],
  },
  {
    id: '4',
    title: 'Product Planning',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    duration: 60,
    callStatus: 'completed',
    callType: 'video',
    participantCount: 5,
    visibility: 'private',
    summary: 'Product strategy meeting for Q2. Decisions made:\n- Focus on mobile experience\n- Launch beta program in May\n- Prioritize user feedback system\n- Integrate new analytics platform',
    transcription: [
      {
        timestamp: Date.now() - 900000000,
        speaker: 'Product Manager',
        text: 'Based on user feedback, we need to prioritize mobile experience in Q2.',
      },
      {
        timestamp: Date.now() - 890000000,
        speaker: 'UX Designer',
        text: 'I\'ve prepared some mockups for the mobile interface redesign.',
      },
    ],
  },
  {
    id: '5',
    title: 'Monthly Review',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    duration: 90,
    callStatus: 'completed',
    callType: 'video',
    participantCount: 12,
    visibility: 'public',
    summary: 'Monthly all-hands meeting. Topics covered:\n- Company performance review\n- New hire introductions\n- Product roadmap updates\n- Customer success stories\n- Team building activities',
    transcription: [
      {
        timestamp: Date.now() - 3000000000,
        speaker: 'CEO',
        text: 'Welcome everyone to our monthly review. We have a lot of exciting updates to share.',
      },
      {
        timestamp: Date.now() - 2990000000,
        speaker: 'HR Director',
        text: 'I\'d like to introduce our new team members who joined this month.',
      },
    ],
  },
];

const groupCallsByDate = (calls: Call[]): GroupedCalls => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return calls.reduce(
    (groups, call) => {
      const callDate = new Date(call.createdAt);

      if (isToday(callDate)) {
        groups.today.push(call);
      } else if (isYesterday(callDate)) {
        groups.yesterday.push(call);
      } else if (callDate > oneWeekAgo) {
        groups.lastWeek.push(call);
      } else if (callDate > oneMonthAgo) {
        groups.lastMonth.push(call);
      } else {
        groups.older.push(call);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedCalls,
  );
};

export function SidebarCallHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const groupedCalls = groupCallsByDate(dummyCalls);

  const handleDelete = async () => {
    // In a real implementation, this would call an API
    toast.success('Call deleted successfully');
    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous calls!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="flex flex-col gap-6">
              {groupedCalls.today.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Today
                  </div>
                  {groupedCalls.today.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      isActive={call.id === id}
                      onDelete={(callId) => {
                        setDeleteId(callId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedCalls.yesterday.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Yesterday
                  </div>
                  {groupedCalls.yesterday.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      isActive={call.id === id}
                      onDelete={(callId) => {
                        setDeleteId(callId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedCalls.lastWeek.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Last 7 days
                  </div>
                  {groupedCalls.lastWeek.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      isActive={call.id === id}
                      onDelete={(callId) => {
                        setDeleteId(callId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedCalls.lastMonth.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Last 30 days
                  </div>
                  {groupedCalls.lastMonth.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      isActive={call.id === id}
                      onDelete={(callId) => {
                        setDeleteId(callId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedCalls.older.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Older than last month
                  </div>
                  {groupedCalls.older.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      isActive={call.id === id}
                      onDelete={(callId) => {
                        setDeleteId(callId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              call and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 