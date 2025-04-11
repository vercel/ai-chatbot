import {
  Loader2,
  LucideProps,
  Trash,
  Undo,
  Redo,
  Copy,
  MessageSquare as Message,
  Clock,
  Pen,
  LineChart,
  Sparkles,
  CheckCircle,
  Globe,
  Lock,
  MoreHorizontal,
  Share,
  Play,
  Logs,
  Loader,
  AlertTriangle as Warning,
  File,
  Maximize as Fullscreen,
  Image,
  PencilLine as PencilEdit,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  Paperclip,
  Square as Stop,
  Plus,
  X as Cross,
  XCircle as CrossSmall,
  Terminal as TerminalWindow,
  PanelLeftClose as SidebarLeft,
  ChevronDown,
  Sparkle as Summarize,
} from 'lucide-react';

export type IconProps = LucideProps;

export const LoaderIcon = Loader;
export const WarningIcon = Warning;
export const FileIcon = File;
export const FullscreenIcon = Fullscreen;
export const ImageIcon = Image;
export const PencilEditIcon = PencilEdit;
export const SparklesIcon = Sparkles;
export const CopyIcon = Copy;
export const ThumbUpIcon = ThumbsUp;
export const ThumbDownIcon = ThumbsDown;
export const ArrowUpIcon = ArrowUp;
export const PaperclipIcon = Paperclip;
export const StopIcon = Stop;
export const PlusIcon = Plus;
export const CrossIcon = Cross;
export const CrossSmallIcon = CrossSmall;
export const TerminalWindowIcon = TerminalWindow;
export const SidebarLeftIcon = SidebarLeft;
export const MessageIcon = Message;
export const ChevronDownIcon = ChevronDown;
export const CheckCircleFillIcon = CheckCircle;
export const UndoIcon = Undo;
export const RedoIcon = Redo;
export const ClockRewindIcon = Clock;
export const PenIcon = Pen;
export const LineChartIcon = LineChart;
export const GlobeIcon = Globe;
export const LockIcon = Lock;
export const MoreHorizontalIcon = MoreHorizontal;
export const ShareIcon = Share;
export const PlayIcon = Play;
export const LogsIcon = Logs;
export const SummarizeIcon = Summarize;
export const Spinner = Loader2;
export const TrashIcon = Trash;

export function GoogleIcon(props: IconProps) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );
}

export function VercelIcon(props: IconProps) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 76 65" fill="none">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
    </svg>
  );
}
