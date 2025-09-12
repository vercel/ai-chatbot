// components/icons.tsx
import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
  size?: number | string;
};

function BaseIcon({
  children,
  title,
  size = 24,
  className,
  ...rest
}: IconProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ===== Editor / Rich text ===== */
export const BoldIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M7 5h6a3 3 0 0 1 0 6H7z" />
    <path d="M7 11h7a3 3 0 0 1 0 6H7z" />
  </BaseIcon>
);
export const ItalicIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M19 5H11" />
    <path d="M13 19H5" />
    <path d="M15 5l-6 14" />
  </BaseIcon>
);
export const UnderlineIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M6 4v7a6 6 0 0 0 12 0V4" />
    <path d="M4 20h16" />
  </BaseIcon>
);
export const ListIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </BaseIcon>
);
export const ListOrderedIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M10 6h10M10 12h10M10 18h10" />
    <path d="M4 6h2M4 12h2M4 18h2" />
  </BaseIcon>
);
export const QuoteIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M5 7h6v6H7a2 2 0 0 1-2-2z" />
    <path d="M13 7h6v6h-4a2 2 0 0 1-2-2z" />
  </BaseIcon>
);
export const CodeIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m8 16-4-4 4-4" />
    <path d="m16 8 4 4-4 4" />
  </BaseIcon>
);
export const LinkIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  </BaseIcon>
);
export const PaletteIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="7.5" cy="10.5" r="1" />
    <circle cx="9.5" cy="14.5" r="1" />
    <circle cx="14.5" cy="14.5" r="1" />
    <circle cx="16.5" cy="10.5" r="1" />
  </BaseIcon>
);

/* ===== UI / Navegação ===== */
export const HomeIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 10v10h14V10" />
  </BaseIcon>
);
export const ChatIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </BaseIcon>
);
export const UploadIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M20 20H4" />
  </BaseIcon>
);
export const SettingsIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.5 15.5l1 1.7-1.4 2.4a2 2 0 0 1-2.2.9l-2.6-1.1a4 4 0 0 1-1.6 0l-2.6 1.1a2 2 0 0 1-2.2-.9L5 17.2l1-1.7a4 4 0 0 1 0-1.6L5 12.2l1.4-2.4a2 2 0 0 1 2.2-.9l2.6 1.1a4 4 0 0 1 1.6 0l2.6-1.1a2 2 0 0 1 2.2.9l1.4 2.4-1 1.7a4 4 0 0 1 0 1.6z" />
  </BaseIcon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m15 18-6-6 6-6" />
  </BaseIcon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m9 18 6-6-6-6" />
  </BaseIcon>
);
export const MenuIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </BaseIcon>
);
export const XIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </BaseIcon>
);
export const PlusIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </BaseIcon>
);
export const UserIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M20 21a8 8 0 1 0-16 0" />
    <circle cx="12" cy="8" r="4" />
  </BaseIcon>
);
export const ImageIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m10 13 2 2 3-3 4 4" />
    <circle cx="8" cy="9" r="1.5" />
  </BaseIcon>
);
export const FileIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12V9z" />
    <path d="M14 3v6h6" />
  </BaseIcon>
);
export const SendIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m22 2-7 20-3-9-9-3Z" />
    <path d="M22 2 11 13" />
  </BaseIcon>
);
export const PaperclipIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M21.4 11.1 12 20.5a6 6 0 1 1-8.5-8.5L12.5 3a4 4 0 1 1 5.7 5.7L8.5 18.3" />
  </BaseIcon>
);
export const TrashIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4h8v2" />
  </BaseIcon>
);
export const EditIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </BaseIcon>
);
export const CopyIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <rect x="2" y="2" width="13" height="13" rx="2" />
  </BaseIcon>
);
export const CheckIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m20 6-11 11L4 12" />
  </BaseIcon>
);
export const AlertIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="m10.3 3.9-8.4 14.5A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </BaseIcon>
);
export const InfoIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </BaseIcon>
);

/* ===== Canais ===== */
export const WhatsAppIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M3 12a9 9 0 1 1 4.2 7.6L3 21l1.35-4.2A9 9 0 0 1 3 12Z" />
    <path d="M8 11c1 2 3 4 5 5 1 .5 2-.5 2-1.5V13" />
  </BaseIcon>
);
export const TelegramIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="m21 3-18 9 6 2 2 6 10-17Z" />
    <path d="M9 14l12-11" />
  </BaseIcon>
);
export const EmailIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </BaseIcon>
);
export const SmsIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </BaseIcon>
);
export const TwitterIcon = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.5-1.6.8-2.5 1a3.8 3.8 0 0 0-6.6 3.5 10.8 10.8 0 0 1-7.8-4 3.8 3.8 0 0 0 1.2 5.1c-.6 0-1-.2-1.7-.5 0 1.8 1.3 3.4 3.1 3.8-.5.1-1 .2-1.5.1.4 1.5 1.9 2.6 3.6 2.7A7.7 7.7 0 0 1 2 18.3a10.9 10.9 0 0 0 5.9 1.8c7.1 0 11-5.9 11-11v-.5c.8-.6 1.4-1.3 1.9-2.1Z" />
  </BaseIcon>
);

/* ===== Namespace + default export ===== */
export const Icons = {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  CodeIcon,
  LinkIcon,
  PaletteIcon,
  HomeIcon,
  ChatIcon,
  UploadIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
  PlusIcon,
  UserIcon,
  ImageIcon,
  FileIcon,
  SendIcon,
  PaperclipIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  CheckIcon,
  AlertIcon,
  InfoIcon,
  WhatsAppIcon,
  TelegramIcon,
  EmailIcon,
  SmsIcon,
  TwitterIcon,
};

export default Icons;
