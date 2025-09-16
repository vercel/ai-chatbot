// components/icons.tsx
"use client";

import * as React from "react";
import type { SVGProps } from "react";
import {
  // editor
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkLucide,
  Palette,
  // ui/nav
  Home,
  MessageSquare,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Minus,
  Image as ImageLucide,
  FileText,
  Trash2,
  Send,
  User,
  Paperclip,
  Pencil,
  Copy,
  AlertTriangle,
  Info,
  Mail,
  MessageCircle,
  Twitter,
  Lock,
  PanelLeft,
  Globe,
  ChevronDown,
  Triangle,
  Route as RouteLucide,
  ThumbsUp,
  ThumbsDown,
  ListChecks,
  Maximize,
  Play,
  Undo2,
  Redo2,
  Loader2,
  ArrowUp,
  Square,
  MoreHorizontal,
  Share2,
  Download,
  ExternalLink,
  LineChart as LineChartLucide,
  Terminal,
  History,
  Navigation,
  ReceiptText,
  Box,
} from "lucide-react";

/** Props padrão (alinha com lucide) */
export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

/** Re-exports semânticos usados no projeto (editor) */
export const BoldIcon = (p: IconProps) => <Bold {...p} />;
export const ItalicIcon = (p: IconProps) => <Italic {...p} />;
export const UnderlineIcon = (p: IconProps) => <Underline {...p} />;
export const ListIcon = (p: IconProps) => <List {...p} />;
export const ListOrderedIcon = (p: IconProps) => <ListOrdered {...p} />;
export const QuoteIcon = (p: IconProps) => <Quote {...p} />;
export const CodeIcon = (p: IconProps) => <Code {...p} />;
export const LinkIcon = (p: IconProps) => <LinkLucide {...p} />;
export const PaletteIcon = (p: IconProps) => <Palette {...p} />;

/** UI / Navegação / Ações */
export const HomeIcon = (p: IconProps) => <Home {...p} />;
export const ChatIcon = (p: IconProps) => <MessageSquare {...p} />;
export const UploadIcon = (p: IconProps) => <Upload {...p} />;
export const SettingsIcon = (p: IconProps) => <Settings {...p} />;
export const ChevronLeftIcon = (p: IconProps) => <ChevronLeft {...p} />;
export const ChevronRightIcon = (p: IconProps) => <ChevronRight {...p} />;
export const MenuIcon = (p: IconProps) => <Menu {...p} />;
export const XIcon = (p: IconProps) => <X {...p} />;
export const CloseIcon = (p: IconProps) => <X {...p} />;
export const PlusIcon = (p: IconProps) => <Plus {...p} />;
export const MinusIcon = (p: IconProps) => <Minus {...p} />;
export const ImageIcon = (p: IconProps) => <ImageLucide {...p} />;
export const FileIcon = (p: IconProps) => <FileText {...p} />;
export const TrashIcon = (p: IconProps) => <Trash2 {...p} />;
export const SendIcon = (p: IconProps) => <Send {...p} />;
export const UserIcon = (p: IconProps) => <User {...p} />;
export const PaperclipIcon = (p: IconProps) => <Paperclip {...p} />;
export const EditIcon = (p: IconProps) => <Pencil {...p} />;
export const CopyIcon = (p: IconProps) => <Copy {...p} />;
export const AlertIcon = (p: IconProps) => <AlertTriangle {...p} />;
export const InfoIcon = (p: IconProps) => <Info {...p} />;
export const EmailIcon = (p: IconProps) => <Mail {...p} />;
export const SmsIcon = (p: IconProps) => <MessageSquare {...p} />;
export const MessageIcon = (p: IconProps) => <MessageCircle {...p} />;
export const TwitterIcon = (p: IconProps) => <Twitter {...p} />;
export const LockIcon = (p: IconProps) => <Lock {...p} />;
export const SidebarLeftIcon = (p: IconProps) => <PanelLeft {...p} />;
export const GlobeIcon = (p: IconProps) => <Globe {...p} />;
export const ChevronDownIcon = (p: IconProps) => <ChevronDown {...p} />;
export const DeltaIcon = (p: IconProps) => <Triangle {...p} />;
export const RouteIcon = (p: IconProps) => <RouteLucide {...p} />;
export const ThumbUpIcon = (p: IconProps) => <ThumbsUp {...p} />;
export const ThumbDownIcon = (p: IconProps) => <ThumbsDown {...p} />;
export const SummarizeIcon = (p: IconProps) => <ListChecks {...p} />;
export const FullscreenIcon = (p: IconProps) => <Maximize {...p} />;
export const PlayIcon = (p: IconProps) => <Play {...p} />;
export const UndoIcon = (p: IconProps) => <Undo2 {...p} />;
export const RedoIcon = (p: IconProps) => <Redo2 {...p} />;
export const LoaderIcon = (p: IconProps) => <Loader2 {...p} className={["animate-spin", p.className].filter(Boolean).join(" ")} />;
export const ArrowUpIcon = (p: IconProps) => <ArrowUp {...p} />;
export const StopIcon = (p: IconProps) => <Square {...p} />;
export const MoreHorizontalIcon = (p: IconProps) => <MoreHorizontal {...p} />;
export const ShareIcon = (p: IconProps) => <Share2 {...p} />;
export const DownloadIcon = (p: IconProps) => <Download {...p} />;
export const ExternalLinkIcon = (p: IconProps) => <ExternalLink {...p} />;
export const LineChartIcon = (p: IconProps) => <LineChartLucide {...p} />;
export const TerminalWindowIcon = (p: IconProps) => <Terminal {...p} />;
export const ClockRewind = (p: IconProps) => <History {...p} />;
export const GPSIcon = (p: IconProps) => <Navigation {...p} />;
export const InvoiceIcon = (p: IconProps) => <ReceiptText {...p} />;
export const BoxIcon = (p: IconProps) => <Box {...p} />;

/** Mapeios “genéricos” de canal (WhatsApp/Telegram não têm brand em lucide) */
export const WhatsAppIcon = (p: IconProps) => <MessageCircle {...p} />;
export const TelegramIcon = (p: IconProps) => <Send {...p} />;

/** Ícones custom (marcas/arte vetorial simples) — inline para não depender de libs externas */
export const VercelIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...p} aria-hidden="true">
    <path d="M12 3L23 21H1L12 3Z" fill="currentColor" />
  </svg>
);

export const GitIcon = ({ size = 16, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...p} aria-hidden="true">
    <g clipPath="url(#clip0)">
      <path
        d="M8 0C3.58 0 0 3.579 0 7.997 0 11.536 2.29 14.525 5.47 15.585c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.52-1.04 2.19-.82 2.19-.82.45 1.1.17 1.92.09 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.76-3.65 3.96.29.25.54.74.54 1.49 0 1.08-.01 1.94-.01 2.22 0 .21.15.46.55.38C13.71 14.525 16 11.537 16 7.997 16 3.579 12.42 0 8 0Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const LogoOpenAI = ({ size = 24, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    {...p}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M14.9449 6.54871C15.3128 5.45919 15.1861 4.26567 14.5978 3.27464C13.7131 1.75461 11.9345 0.972595 10.1974 1.3406C9.42464 0.481584 8.3144 -0.006926 7.15045 0C5.37487 -0.003926 3.79946 1.1241 3.2532 2.79113C2.11256 3.02164 1.12799 3.72615 0.551837 4.72468C-0.339497 6.24071 -0.1363 8.15175 1.05451 9.45178C0.686626 10.5413 0.813308 11.7348 1.40162 12.7258C2.28637 14.2459 4.06498 15.0279 5.80204 14.6599C6.5743 15.5189 7.68504 16.0074 8.849 15.9999C10.6256 16.0044 12.2015 14.8754 12.7478 13.2069C13.8884 12.9764 14.873 12.2718 15.4491 11.2733C16.3394 9.75728 16.1357 7.84774 14.9454 6.54771L14.9449 6.54871ZM8.85 14.9544c-.711.001-1.399-.244-1.945-.693l3.229-1.84a.5.5 0 0 0 .26-.447V7.422l1.364.777v3.719a3.1 3.1 0 0 1-2.908 3.036ZM2.321 12.203a2.95 2.95 0 0 1-.362-2.009l3.229 1.84a.75.75 0 0 0 .75 0l3.942-2.246v1.555L6.473 13.3c-1.454.826-3.31.335-4.151-1.097ZM1.472 5.249A2.95 2.95 0 0 1 3.053 3.934v3.79a.5.5 0 0 0 .246.433L7.258 10.423l-1.364.777L2.583 9.343c-1.451-.829-1.949-2.661-1.111-4.095Zm11.211 2.574L8.742 5.577l1.364-.777 3.264 1.86a2.95 2.95 0 0 1 1.112 4.096 2.95 2.95 0 0 1-1.706 1.314V8.276a.5.5 0 0 0-.094-.452ZM14.041 5.806l-3.324-1.897-3.942 2.246V4.6L9.528 2.701c1.454-.828 3.312-.335 4.15 1.1.354.606.482 1.315.363 2.005ZM5.503 8.577 5.504 4.086a.5.5 0 0 1 .25-.453L9.527 2.7a3.08 3.08 0 0 1 2.151-.336 3.15 3.15 0 0 0-2.583.27L5.77 3.634a.5.5 0 0 0-.266.452v4.492ZM6.244 7l1.756-1 1.756 1v2l-1.756 1L6.244 9V7Z" />
  </svg>
);

/** Conveniências/alias */
export const CheckIcon = (p: IconProps) => <Check {...p} />;
export const Share2Icon = (p: IconProps) => <Share2 {...p} />;

/** Logs “genéricos” + LineChart (já acima) */
export const LogsIcon = (p: IconProps) => <List {...p} />;

/** Export default “compat” (para import Icons from "@/components/icons") */
const Icons = {
  BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, ListOrderedIcon, QuoteIcon, CodeIcon, LinkIcon, PaletteIcon,
  HomeIcon, ChatIcon, UploadIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon, MenuIcon, XIcon, CloseIcon,
  PlusIcon, MinusIcon, ImageIcon, FileIcon, TrashIcon, SendIcon, UserIcon, PaperclipIcon, EditIcon, CopyIcon,
  AlertIcon, InfoIcon, EmailIcon, SmsIcon, MessageIcon, TwitterIcon, LockIcon, SidebarLeftIcon, GlobeIcon,
  ChevronDownIcon, DeltaIcon, RouteIcon, ThumbUpIcon, ThumbDownIcon, SummarizeIcon, FullscreenIcon, PlayIcon,
  UndoIcon, RedoIcon, LoaderIcon, ArrowUpIcon, StopIcon, MoreHorizontalIcon, ShareIcon, DownloadIcon, ExternalLinkIcon,
  LineChartIcon, TerminalWindowIcon, ClockRewind, GPSIcon, InvoiceIcon, BoxIcon,
  WhatsAppIcon, TelegramIcon, VercelIcon, GitIcon, LogoOpenAI, LogsIcon, CheckIcon, Share2Icon,
};

export default Icons;
