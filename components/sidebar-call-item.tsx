import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  ShareIcon,
  SpeechIcon,
  TrashIcon,
  VideoIcon,
} from './icons';
import { memo, useState } from 'react';
import { CallDialog } from './call-dialog';

export interface Call {
  id: string;
  title: string;
  createdAt: Date;
  duration: number;
  callStatus: 'completed' | 'missed' | 'ongoing';
  callType: 'audio' | 'video';
  participantCount: number;
  visibility: 'private' | 'public';
  summary: string;
  transcription: Array<{
    timestamp: number;
    speaker: string;
    text: string;
  }>;
}

const PureCallItem = ({
  call,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  call: Call;
  isActive: boolean;
  onDelete: (callId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          onClick={() => setShowDialog(true)}
        >
          <span className="truncate">{call.title}</span>
        </SidebarMenuButton>

        <DropdownMenu modal={true}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
              showOnHover={!isActive}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <ShareIcon />
                <span>Share</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem className="cursor-pointer flex-row justify-between">
                    <div className="flex flex-row gap-2 items-center">
                      <LockIcon size={12} />
                      <span>Private</span>
                    </div>
                    {call.visibility === 'private' ? <CheckCircleFillIcon /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex-row justify-between">
                    <div className="flex flex-row gap-2 items-center">
                      <GlobeIcon />
                      <span>Public</span>
                    </div>
                    {call.visibility === 'public' ? <CheckCircleFillIcon /> : null}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
              onSelect={() => onDelete(call.id)}
            >
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <CallDialog
        call={call}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
};

export const CallItem = memo(PureCallItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
}); 