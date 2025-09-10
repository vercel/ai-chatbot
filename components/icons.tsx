// components/icons.tsx
import {
  Bot,
  User,
  Globe,
  Route as RouteIconLuc,
  Sparkles as SparklesIconLuc,
  Plus as PlusIconLuc,
  ThumbsUp as ThumbsUpIconLuc,
  ThumbsDown as ThumbsDownIconLuc,
  FileText as SummarizeIconLuc,
  Paperclip as AttachmentIconLuc,
  Triangle as VercelIconLuc,
  Github as GitIcon,
  Box,
  Home,
  MapPin as GPSBase,
  Receipt as InvoiceIconLuc,
  Zap as LogoOpenAIIconLuc,
  TerminalSquare as TerminalWindowIconLuc,
  Terminal,
  RotateCcw as ClockRewind,
  List as LogsIconLuc,
  Image,
  Maximize as FullscreenIconLuc,
  Download,
  BarChart3 as LineChartIconLuc,
  AlertTriangle as WarningIconLuc,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Palette,
  ChevronDown,
  Triangle as DeltaIconLuc,
  Play,
  Undo,
  Redo,
  MessageSquare as MessageIconLuc,
  X as CrossIconLuc,
  X as CrossSmallIconLuc,
  Loader,
  File,
  Edit as PencilEditIconLuc,
  ArrowUp,
  Paperclip,
  Stop,
  MoreHorizontal,
  Share,
  Lock,
  Trash,
  Copy,
  SidebarLeft,
  CheckCircle,
} from "lucide-react";

export const BotIcon = Bot;
export const UserIcon = User;
export const GlobeIcon = Globe;
export const RouteIcon = RouteIconLuc;
export const SparklesIcon = SparklesIconLuc;
export const PlusIcon = PlusIconLuc;
export const ThumbUpIcon = ThumbsUpIconLuc;
export const ThumbDownIcon = ThumbsDownIconLuc;
export const SummarizeIcon = SummarizeIconLuc;
export const AttachmentIcon = AttachmentIconLuc;
export const VercelIcon = VercelIconLuc;
export const GitIcon = GitIcon;
export const BoxIcon = Box;
export const HomeIcon = Home;
export const GPSIcon = GPSBase;
export const InvoiceIcon = InvoiceIconLuc;
export const LogoOpenAI = LogoOpenAIIconLuc;
export const TerminalWindowIcon = TerminalWindowIconLuc;
export const TerminalIcon = Terminal;
export const ClockRewind = ClockRewind;
export const LogsIcon = LogsIconLuc;
export const ImageIcon = Image;
export const FullscreenIcon = FullscreenBase;
export const DownloadIcon = Download;
export const LineChartIcon = LineChartIconLuc;
export const WarningIcon = WarningIconLuc;
export const BoldIcon = Bold;
export const ItalicIcon = Italic;
export const UnderlineIcon = Underline;
export const ListIcon = List;
export const ListOrderedIcon = ListOrdered;
export const QuoteIcon = Quote;
export const CodeIcon = Code;
export const LinkIcon = Link;
export const PaletteIcon = Palette;
export const ChevronDownIcon = ChevronDown;
export const DeltaIcon = DeltaIconLuc;
export const PlayIcon = Play;
export const UndoIcon = Undo;
export const RedoIcon = Redo;
export const MessageIcon = MessageIconLuc;
export const CrossIcon = CrossIconLuc;
export const CrossSmallIcon = CrossSmallIconLuc;
export const LoaderIcon = Loader;
export const FileIcon = File;
export const PencilEditIcon = PencilEditIconLuc;
export const ArrowUpIcon = ArrowUp;
export const PaperclipIcon = Paperclip;
export const StopIcon = Stop;
export const MoreHorizontalIcon = MoreHorizontal;
export const ShareIcon = Share;
export const LockIcon = Lock;
export const TrashIcon = Trash;
export const CopyIcon = Copy;
export const SidebarLeftIcon = SidebarLeft;
export const CheckCircleFillIcon = CheckCircle;

/**
 * Mapeia os ícones do Lucide para os nomes usados no app.
 * Evita undefined em runtime e mantém tipagem consistente.
 * Não deixe nenhum <svg> cru aqui para não quebrar o parser/compilador.
 */

export const BotIcon = Bot;
export const UserIcon = User;

export const GlobeIcon = Globe;
export const RouteIcon = RouteBase;

export const SparklesIcon = SparklesBase;
export const PlusIcon = PlusBase;

export const ThumbUpIcon = ThumbsUpBase;
export const ThumbDownIcon = ThumbsDownBase;

// Lucide não tem "Summarize"; usamos um análogo semântico:
export const SummarizeIcon = SummarizeBase;

export const GitIcon = Git;

export const HomeIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Home Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5 6.56062L8.00001 2.06062L3.50001 6.56062V13.5L6.00001 13.5V11C6.00001 9.89539 6.89544 8.99996 8.00001 8.99996C9.10458 8.99996 10 9.89539 10 11V13.5L12.5 13.5V6.56062ZM13.78 5.71933L8.70711 0.646409C8.31659 0.255886 7.68342 0.255883 7.2929 0.646409L2.21987 5.71944C2.21974 5.71957 2.21961 5.7197 2.21949 5.71982L0.469676 7.46963L-0.0606537 7.99996L1.00001 9.06062L1.53034 8.53029L2.00001 8.06062V14.25V15H2.75001L6.00001 15H7.50001H8.50001H10L13.25 15H14V14.25V8.06062L14.4697 8.53029L15 9.06062L16.0607 7.99996L15.5303 7.46963L13.7806 5.71993C13.7804 5.71973 13.7802 5.71953 13.78 5.71933ZM8.50001 11V13.5H7.50001V11C7.50001 10.7238 7.72386 10.5 8.00001 10.5C8.27615 10.5 8.50001 10.7238 8.50001 11Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GPSIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>GPS Icon</title>
      <path
        d="M1 6L15 1L10 15L7.65955 8.91482C7.55797 8.65073 7.34927 8.44203 7.08518 8.34045L1 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="bevel"
        fill="transparent"
      />
    </svg>
  );
};

export const InvoiceIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Invoice Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 15.1L12 14.5L10.1524 15.8857C10.0621 15.9534 9.93791 15.9534 9.8476 15.8857L8 14.5L6.14377 15.8922C6.05761 15.9568 5.94008 15.9601 5.85047 15.9003L3.75 14.5L3 15L2.83257 15.1116L1.83633 15.7758L1.68656 15.8756C1.60682 15.9288 1.5 15.8716 1.5 15.7758V15.5958V14.3985V14.1972V1.5V0H3H8H9.08579C9.351 0 9.60536 0.105357 9.79289 0.292893L14.2071 4.70711C14.3946 4.89464 14.5 5.149 14.5 5.41421V6.5V14.2507V14.411V15.5881V15.7881C14.5 15.8813 14.3982 15.9389 14.3183 15.891L14.1468 15.7881L13.1375 15.1825L13 15.1ZM12.3787 5L9.5 2.12132V5H12.3787ZM8 1.5V5V6.5H9.5H13V13.3507L12.7717 13.2138L11.9069 12.6948L11.1 13.3L10 14.125L8.9 13.3L8 12.625L7.1 13.3L5.94902 14.1632L4.58205 13.2519L3.75 12.6972L3 13.1972V1.5H8Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LogoOpenAI = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>OpenAI Logo</title>
      <path
        d="M14.9449 6.54871C15.3128 5.45919 15.1861 4.26567 14.5978 3.27464C13.7131 1.75461 11.9345 0.972595 10.1974 1.3406C9.42464 0.481584 8.3144 -0.00692594 7.15045 7.42132e-05C5.37487 -0.00392587 3.79946 1.1241 3.2532 2.79113C2.11256 3.02164 1.12799 3.72615 0.551837 4.72468C-0.339497 6.24071 -0.1363 8.15175 1.05451 9.45178C0.686626 10.5413 0.813308 11.7348 1.40162 12.7258C2.28637 14.2459 4.06498 15.0279 5.80204 14.6599C6.5743 15.5189 7.68504 16.0074 8.849 15.9999C10.6256 16.0044 12.2015 14.8754 12.7478 13.2069C13.8884 12.9764 14.873 12.2718 15.4491 11.2733C16.3394 9.75728 16.1357 7.84774 14.9454 6.54771L14.9449 6.54871ZM8.85001 14.9544C8.13907 14.9554 7.45043 14.7099 6.90468 14.2604C6.92951 14.2474 6.97259 14.2239 7.00046 14.2069L10.2293 12.3668C10.3945 12.2743 10.4959 12.1008 10.4949 11.9133V7.42173L11.8595 8.19925C11.8742 8.20625 11.8838 8.22025 11.8858 8.23625V11.9558C11.8838 13.6099 10.5263 14.9509 8.85001 14.9544ZM2.32133 12.2028C1.9651 11.5958 1.8369 10.8843 1.95902 10.1938C1.98284 10.2078 2.02489 10.2333 2.05479 10.2503L5.28366 12.0903C5.44733 12.1848 5.65003 12.1848 5.81421 12.0903L9.75604 9.84429V11.3993C9.75705 11.4153 9.74945 11.4308 9.73678 11.4408L6.47295 13.3004C5.01915 14.1264 3.1625 13.6354 2.32184 12.2028H2.32133ZM1.47155 5.24819C1.82626 4.64017 2.38619 4.17516 3.05305 3.93366C3.05305 3.96116 3.05152 4.00966 3.05152 4.04366V7.72424C3.05051 7.91124 3.15186 8.08475 3.31654 8.17725L7.25838 10.4228L5.89376 11.2003C5.88008 11.2093 5.86285 11.2108 5.84765 11.2043L2.58331 9.34327C1.13255 8.51426 0.63494 6.68272 1.47104 5.24869L1.47155 5.24819ZM12.6834 7.82274L8.74157 5.57669L10.1062 4.79968C10.1199 4.79068 10.1371 4.78918 10.1523 4.79568L13.4166 6.65522C14.8699 7.48373 15.3681 9.31827 14.5284 10.7523C14.1732 11.3593 13.6138 11.8243 12.9474 12.0663V8.27575C12.9489 8.08875 12.8481 7.91574 12.6839 7.82274H12.6834ZM14.0414 5.8057C14.0176 5.7912 13.9756 5.7662 13.9457 5.7492L10.7168 3.90916C10.5531 3.81466 10.3504 3.81466 10.1863 3.90916L6.24442 6.15521V4.60017C6.2434 4.58417 6.251 4.56867 6.26367 4.55867L9.52751 2.70063C10.9813 1.87311 12.84 2.36563 13.6781 3.80066C14.0323 4.40667 14.1605 5.11618 14.0404 5.8057H14.0414ZM5.50257 8.57726L4.13744 7.79974C4.12275 7.79274 4.11312 7.77874 4.11109 7.76274V4.04316C4.11211 2.38713 5.47368 1.0451 7.15197 1.0461C7.86189 1.0461 8.54902 1.2921 9.09476 1.74011C9.06993 1.75311 9.02737 1.77661 8.99899 1.79361L5.77012 3.63365C5.60493 3.72615 5.50358 3.89916 5.50459 4.08666L5.50257 8.57626V8.57726ZM6.24391 7.00022L7.99972 5.9997L9.75553 6.99972V9.00027L7.99972 10.0003L6.24391 9.00027V7.00022Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TerminalWindowIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Terminal Window Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1ZM4 11.1339L4.44194 10.6919L6.51516 8.61872C6.85687 8.27701 6.85687 7.72299 6.51517 7.38128L4.44194 5.30806L4 4.86612L3.11612 5.75L3.55806 6.19194L5.36612 8L3.55806 9.80806L3.11612 10.25L4 11.1339ZM8 9.75494H8.6225H11.75H12.3725V10.9999H11.75H8.6225H8V9.75494Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TerminalIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Terminal Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.53035 12.7804L1.00002 13.3108L-0.0606384 12.2501L0.469692 11.7198L4.18936 8.00011L0.469692 4.28044L-0.0606384 3.75011L1.00002 2.68945L1.53035 3.21978L5.60358 7.29301C5.9941 7.68353 5.9941 8.3167 5.60357 8.70722L1.53035 12.7804ZM8.75002 12.5001H8.00002V14.0001H8.75002H15.25H16V12.5001H15.25H8.75002Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const ClockRewind = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Clock Rewind Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.96452 2.5C11.0257 2.5 14 4.96643 14 8C14 11.0336 11.0257 13.5 7.96452 13.5C6.12055 13.5 4.48831 12.6051 3.48161 11.2273L3.03915 10.6217L1.828 11.5066L2.27046 12.1122C3.54872 13.8617 5.62368 15 7.96452 15C11.8461 15 15 11.87 15 8C15 4.13001 11.8461 1 7.96452 1C5.06835 1 2.57851 2.74164 1.5 5.23347V3.75V3H0V3.75V7.25C0 7.66421 0.335786 8 0.75 8H3.75H4.5V6.5H3.75H2.63724C3.29365 4.19393 5.42843 2.5 7.96452 2.5ZM8.75 5.25V4.5H7.25V5.25V7.8662C7.25 8.20056 7.4171 8.51279 7.6953 8.69825L9.08397 9.62404L9.70801 10.0401L10.5401 8.79199L9.91603 8.37596L8.75 7.59861V5.25Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LogsIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Logs Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2H9.75H14.25H15V3.5H14.25H9.75H9V2ZM9 12.5H9.75H14.25H15V14H14.25H9.75H9V12.5ZM9.75 7.25H9V8.75H9.75H14.25H15V7.25H14.25H9.75ZM1 12.5H1.75H2.25H3V14H2.25H1.75H1V12.5ZM1.75 2H1V3.5H1.75H2.25H3V2H2.25H1.75ZM1 7.25H1.75H2.25H3V8.75H2.25H1.75H1V7.25ZM5.75 12.5H5V14H5.75H6.25H7V12.5H6.25H5.75ZM5 2H5.75H6.25H7V3.5H6.25H5.75H5V2ZM5.75 7.25H5V8.75H5.75H6.25H7V7.25H6.25H5.75Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const ImageIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Image Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 2.5C1 1.67157 1.67157 1 2.5 1H13.5C14.3284 1 15 1.67157 15 2.5V13.5C15 14.3284 14.3284 15 13.5 15H2.5C1.67157 15 1 14.3284 1 13.5V2.5ZM2.5 2C2.22386 2 2 2.22386 2 2.5V13.5C2 13.7761 2.22386 14 2.5 14H13.5C13.7761 14 14 13.7761 14 13.5V2.5C14 2.22386 13.7761 2 13.5 2H2.5ZM4 5.5C4 4.67157 4.67157 4 5.5 4H10.5C11.3284 4 12 4.67157 12 5.5V10.5C12 11.3284 11.3284 12 10.5 12H5.5C4.67157 12 4 11.3284 4 10.5V5.5ZM5.5 5C5.22386 5 5 5.22386 5 5.5V10.5C5 10.7761 5.22386 11 5.5 11H10.5C10.7761 11 11 10.7761 11 10.5V5.5C11 5.22386 10.7761 5 10.5 5H5.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const FullscreenIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Fullscreen Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z"
      fill="currentColor"
    />
  </svg>
);

export const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Download Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78032L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78032L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z"
      fill="currentColor"
    />
  </svg>
);

export const LineChartIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Line Chart Icon</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M1 1v11.75A2.25 2.25 0 0 0 3.25 15H15v-1.5H3.25a.75.75 0 0 1-.75-.75V1H1Zm13.297 5.013.513-.547-1.094-1.026-.513.547-3.22 3.434-2.276-2.275a1 1 0 0 0-1.414 0L4.22 8.22l-.53.53 1.06 1.06.53-.53L7 7.56l2.287 2.287a1 1 0 0 0 1.437-.023l3.573-3.811Z"
      clipRule="evenodd"
    />
  </svg>
);

export const WarningIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Warning Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.55846 0.5C9.13413 0.5 9.65902 0.902369 9.90929 1.34788L15.8073 13.5653C16.1279 14.2293 15.6441 15 14.9068 15H1.09316C0.355835 15 -0.127943 14.2293 0.192608 13.5653L6.09065 1.34787C6.34092 0.829454 6.86581 0.5 7.44148 0.5H8.55846ZM8.74997 4.75V5.5V8V8.75H7.24997V8V5.5V4.75H8.74997ZM7.99997 12C8.55226 12 8.99997 11.5523 8.99997 11C8.99997 10.4477 8.55226 10 7.99997 10C7.44769 10 6.99997 10.4477 6.99997 11C6.99997 11.5523 7.44769 12 7.99997 12Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const BoldIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Bold Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 3.5C4 2.67157 4.67157 2 5.5 2H8.5C10.433 2 12 3.567 12 5.5C12 6.47991 11.5201 7.36764 10.7929 7.79289C11.5201 8.21715 12 9.10488 12 10C12 11.933 10.433 13.5 8.5 13.5H5.5C4.67157 13.5 4 12.8284 4 12V3.5ZM6 4V6.5H8.5C9.05228 6.5 9.5 6.05228 9.5 5.5C9.5 4.94772 9.05228 4.5 8.5 4.5H6ZM6 8H8.5C9.05228 8 9.5 8.44772 9.5 9C9.5 9.55228 9.05228 10 8.5 10H6V8Z"
      fill="currentColor"
    />
  </svg>
);

export const ItalicIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Italic Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 2H7.5L6.5 2V3.5L8.5 3.5L7 12.5H5.5L5.5 14H8.5L9.5 14V12.5L7.5 12.5L9 3.5H10.5V2Z"
      fill="currentColor"
    />
  </svg>
);

export const UnderlineIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Underline Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2V8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8V2H10.5V8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8V2H4ZM3 14.5H13V13H3V14.5Z"
      fill="currentColor"
    />
  </svg>
);

export const ListIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>List Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 4.5C2 4.22386 2.22386 4 2.5 4H13.5C13.7761 4 14 4.22386 14 4.5C14 4.77614 13.7761 5 13.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 8C2 7.72386 2.22386 7.5 2.5 7.5H13.5C13.7761 7.5 14 7.72386 14 8C14 8.27614 13.7761 8.5 13.5 8.5H2.5C2.22386 8.5 2 8.27614 2 8ZM2 11.5C2 11.2239 2.22386 11 2.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H2.5C2.22386 12 2 11.7761 2 11.5Z"
      fill="currentColor"
    />
  </svg>
);

export const ListOrderedIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>List Ordered Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 4C2.22386 4 2 4.22386 2 4.5C2 4.77614 2.22386 5 2.5 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H2.5ZM2.5 7.5C2.22386 7.5 2 7.72386 2 8C2 8.27614 2.22386 8.5 2.5 8.5H13.5C13.7761 8.5 14 8.27614 14 8C14 7.72386 13.7761 7.5 13.5 7.5H2.5ZM2.5 11C2.22386 11 2 11.2239 2 11.5C2 11.7761 2.22386 12 2.5 12H13.5C13.7761 12 14 11.7761 14 11.5C14 11.2239 13.7761 11 13.5 11H2.5ZM0 4.5C0 3.67157 0.671573 3 1.5 3C2.32843 3 3 3.67157 3 4.5C3 5.32843 2.32843 6 1.5 6C0.671573 6 0 5.32843 0 4.5ZM0 8C0 7.17157 0.671573 6.5 1.5 6.5C2.32843 6.5 3 7.17157 3 8C3 8.82843 2.32843 9.5 1.5 9.5C0.671573 9.5 0 8.82843 0 8ZM1.5 10.5C0.671573 10.5 0 11.1716 0 12C0 12.8284 0.671573 13.5 1.5 13.5C2.32843 13.5 3 12.8284 3 12C3 11.1716 2.32843 10.5 1.5 10.5Z"
      fill="currentColor"
    />
  </svg>
);

export const QuoteIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Quote Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 4C4.89543 4 4 4.89543 4 6V10C4 11.1046 4.89543 12 6 12H8C9.10457 12 10 11.1046 10 10V6C10 4.89543 9.10457 4 8 4H6ZM6 5.5H8C8.27614 5.5 8.5 5.72386 8.5 6V10C8.5 10.2761 8.27614 10.5 8 10.5H6C5.72386 10.5 5.5 10.2761 5.5 10V6C5.5 5.72386 5.72386 5.5 6 5.5ZM12 4C10.8954 4 10 4.89543 10 6V10C10 11.1046 10.8954 12 12 12H14C15.1046 12 16 11.1046 16 10V6C16 4.89543 15.1046 4 14 4H12ZM12 5.5H14C14.2761 5.5 14.5 5.72386 14.5 6V10C14.5 10.2761 14.2761 10.5 14 10.5H12C11.7239 10.5 11.5 10.2761 11.5 10V6C11.5 5.72386 11.7239 5.5 12 5.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LinkIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Link Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.29289 1.29289C8.68342 0.902369 9.31658 0.902369 9.70711 1.29289L14.7071 6.29289C15.0976 6.68342 15.0976 7.31658 14.7071 7.70711L9.70711 12.7071C9.31658 13.0976 8.68342 13.0976 8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L12.5858 7L8.29289 2.70711C7.90237 2.31658 7.90237 1.68342 8.29289 1.29289ZM1.29289 8.29289C0.902369 7.90237 0.902369 7.26921 1.29289 6.87868L6.29289 1.87868C6.68342 1.48816 7.31658 1.48816 7.70711 1.87868C8.09763 2.26921 8.09763 2.90237 7.70711 3.29289L3.41421 7.5L7.70711 11.7071C8.09763 12.0976 8.09763 12.7308 7.70711 13.1213C7.31658 13.5118 6.68342 13.5118 6.29289 13.1213L1.29289 8.29289Z"
      fill="currentColor"
    />
  </svg>
);

export const PaletteIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Palette Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C5.79086 1 4 2.79086 4 5C4 6.48168 4.79371 7.77029 6 8.46482V12C6 12.5523 6.44772 13 7 13H9C9.55228 13 10 12.5523 10 12V8.46482C11.2063 7.77029 12 6.48168 12 5C12 2.79086 10.2091 1 8 1ZM8 2.5C9.38071 2.5 10.5 3.61929 10.5 5C10.5 5.8174 10.1509 6.54433 9.5703 7.08535C9.54364 7.10937 9.51526 7.13105 9.48515 7.15027C9.45504 7.16949 9.42337 7.18605 9.39071 7.19966C9.35805 7.21327 9.32461 7.22383 9.29071 7.23105C9.25681 7.23827 9.22261 7.242 9.18843 7.24176C8.82743 7.23976 8.5 6.91076 8.5 6.54976V6.54976C8.5 6.18876 8.17257 5.85976 7.81157 5.85776C7.77739 5.85752 7.74319 5.85379 7.70929 5.84657C7.67539 5.83935 7.64195 5.82879 7.60929 5.81518C7.57663 5.80157 7.54496 5.78401 7.51485 5.76479C7.48474 5.74557 7.45636 5.72389 7.4297 5.69987C6.84911 5.15885 6.5 4.43192 6.5 3.5C6.5 2.61929 7.61929 1.5 9 1.5H8Z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Chevron Down Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.46967 6.46967L8 10L11.5303 6.46967L12.0607 7L8 11.0607L3.93934 7L4.46967 6.46967Z"
      fill="currentColor"
    />
  </svg>
);

export const DeltaIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Delta Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2L14 8H10V14H6V8H2L8 2Z"
      fill="currentColor"
    />
  </svg>
);

export const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Play Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 3.5C4 2.67157 4.67157 2 5.5 2H10.5C11.3284 2 12 2.67157 12 3.5V12.5C12 13.3284 11.3284 14 10.5 14H5.5C4.67157 14 4 13.3284 4 12.5V3.5ZM6 4V12H10V4H6Z"
      fill="currentColor"
    />
  </svg>
);

export const UndoIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Undo Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 7.44772 2.44772 7 3 7C3.55228 7 4 7.44772 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C6.89543 4 5.875 4.375 5.08535 5H7C7.55228 5 8 5.44772 8 6C8 6.55228 7.55228 7 7 7H3C2.44772 7 2 6.55228 2 6V2C2 1.44772 2.44772 1 3 1C3.55228 1 4 1.44772 4 2V3.41421C5.18571 2.62396 6.52843 2 8 2Z"
      fill="currentColor"
    />
  </svg>
);

export const RedoIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Redo Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 7.44772 14.4477 7 15 7C15.5523 7 16 7.44772 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C9.47157 0 10.8143 0.62396 12 1.41421V2C12 2.55228 11.5523 3 11 3C10.4477 3 10 2.55228 10 2V0C10 0.447715 9.55228 1 9 1H5C4.44772 1 4 1.44772 4 2C4 2.55228 4.44772 3 5 3H6.91465C6.12496 3.875 5.10457 4 4 4C1.79086 4 0 5.79086 0 8C0 10.2091 1.79086 12 4 12C6.20914 12 8 10.2091 8 8C8 7.44772 8.44772 7 9 7C9.55228 7 10 7.44772 10 8C10 10.2091 11.7909 12 14 12C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4C12.8954 4 11.875 4.375 11.0854 5H13C13.5523 5 14 5.44772 14 6C14 6.55228 13.5523 7 13 7H9C8.44772 7 8 6.55228 8 6V2C8 1.44772 8.44772 1 9 1C9.55228 1 10 1.44772 10 2V3.41421C11.1857 2.62396 12.5284 2 14 2C17.3137 2 20 4.68629 20 8C20 11.3137 17.3137 14 14 14C10.6863 14 8 11.3137 8 8C8 7.44772 8.44772 7 9 7C9.55228 7 10 7.44772 10 8C10 10.2091 11.7909 12 14 12C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4C12.8954 4 11.875 4.375 11.0854 5H13C13.5523 5 14 5.44772 14 6C14 6.55228 13.5523 7 13 7H9C8.44772 7 8 6.55228 8 6V2C8 1.44772 8.44772 1 9 1C9.55228 1 10 1.44772 10 2V3.41421C11.1857 2.62396 12.5284 2 14 2Z"
      fill="currentColor"
    />
  </svg>
);

export const MessageIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Message Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.5 3.5H14.5V11.5C14.5 12.3284 13.8284 13 13 13H3C2.17157 13 1.5 12.3284 1.5 11.5V3.5ZM0 2H1.5H14.5H16V3.5V11.5C16 13.1569 14.6569 14.5 13 14.5H3C1.34315 14.5 0 13.1569 0 11.5V3.5V2ZM4 6.5C4 6.22386 4.22386 6 4.5 6H11.5C11.7761 6 12 6.22386 12 6.5C12 6.77614 11.7761 7 11.5 7H4.5C4.22386 7 4 6.77614 4 6.5ZM4 9.5C4 9.22386 4.22386 9 4.5 9H8.5C8.77614 9 9 9.22386 9 9.5C9 9.77614 8.77614 10 8.5 10H4.5C4.22386 10 4 9.77614 4 9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CrossIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Cross Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.0607 4.93934L13.1213 6L12.0607 7.06066L9.06066 10.0607L8 11.1213L6.93934 10.0607L3.93934 7.06066L3 6L3.93934 4.93934L6.93934 1.93934L8 0.87868L9.06066 1.93934L12.0607 4.93934ZM8 2.5L6.5 4L8 5.5L9.5 4L8 2.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CrossSmallIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Cross Small Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.0607 5.93934L12.1213 7L11.0607 8.06066L8.06066 11.0607L7 12.1213L5.93934 11.0607L2.93934 8.06066L2 7L2.93934 5.93934L5.93934 2.93934L7 1.87868L8.06066 2.93934L11.0607 5.93934ZM7 3.5L5.5 5L7 6.5L8.5 5L7 3.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LoaderIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Loader Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4Z"
      fill="currentColor"
    />
  </svg>
);

export const FileIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>File Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 2H9.5L12.5 5V13.5C12.5 14.3284 11.8284 15 11 15H3.5C2.67157 15 2 14.3284 2 13.5V3.5C2 2.67157 2.67157 2 3.5 2ZM3.5 3.5V13.5H11V6.5H8.5V3.5H3.5ZM9.5 3.5V5.5H11L9.5 3.5Z"
      fill="currentColor"
    />
  </svg>
);

export const PencilEditIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Pencil Edit Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5 2L14 4.5L8.5 10H6V7.5L11.5 2ZM12.5 3L13 3.5L7.5 9H7V8.5L12.5 3ZM2 11.5V14H4.5L10.5 8L8 5.5L2 11.5ZM3 12.5L7 8.5L8.5 10L4.5 14H3V12.5Z"
      fill="currentColor"
    />
  </svg>
);

export const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Plus Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C8.55228 2 9 2.44772 9 3V7H13C13.5523 7 14 7.44772 14 8C14 8.55228 13.5523 9 13 9H9V13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13V9H3C2.44772 9 2 8.55228 2 8C2 7.44772 2.44772 7 3 7H7V3C7 2.44772 7.44772 2 8 2Z"
      fill="currentColor"
    />
  </svg>
);
export const ArrowUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Arrow Up Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 4L11.5 7.5L10.5 8.5L8.5 6.5V12H7.5V6.5L5.5 8.5L4.5 7.5L8 4Z"
      fill="currentColor"
    />
  </svg>
);

export const PaperclipIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Paperclip Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.5 2H7.5V9.5C7.5 10.3284 6.82843 11 6 11C5.17157 11 4.5 10.3284 4.5 9.5C4.5 8.67157 5.17157 8 6 8C6.27614 8 6.5 8.22386 6.5 8.5C6.5 8.77614 6.27614 9 6 9C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11C6.55228 11 7 10.5523 7 10V3H8.5V2Z"
      fill="currentColor"
    />
  </svg>
);

export const StopIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Stop Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 4H12V12H4V4ZM3 3H13V13H3V3Z"
      fill="currentColor"
    />
  </svg>
);

export const MoreHorizontalIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>More Horizontal Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 8C4 7.44772 4.44772 7 5 7C5.55228 7 6 7.44772 6 8C6 8.55228 5.55228 9 5 9C4.44772 9 4 8.55228 4 8ZM7 8C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8ZM10 8C10 7.44772 10.4477 7 11 7C11.5523 7 12 7.44772 12 8C12 8.55228 11.5523 9 11 9C10.4477 9 10 8.55228 10 8Z"
      fill="currentColor"
    />
  </svg>
);

export const ShareIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Share Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C11.4477 6 10.9477 5.77614 10.5858 5.41421L7.70711 7.29289C7.89464 7.68342 8 8.12971 8 8.5C8 8.87029 7.89464 9.31658 7.70711 9.70711L10.5858 11.5858C10.9477 11.2239 11.4477 11 12 11C13.1046 11 14 11.8954 14 13C14 14.1046 13.1046 15 12 15C10.8954 15 10 14.1046 10 13C10 12.8703 10.0259 12.7441 10.074 12.625L7.19526 10.7463C6.83235 11.1082 6.33235 11.3324 5.83235 11.3324C4.72778 11.3324 3.83235 10.437 3.83235 9.33243C3.83235 8.22786 4.72778 7.33243 5.83235 7.33243C6.33235 7.33243 6.83235 7.55663 7.19526 7.91855L10.074 6.03984C10.0259 5.92074 10 5.79457 10 5.66579C10 5.10457 10.4477 4.5 11 4.5C11.5523 4.5 12 4.94772 12 5.5C12 6.05228 11.5523 6.5 11 6.5C10.4477 6.5 10 6.05228 10 5.5C10 4.94772 10.4477 4 11 4C11.5523 4 12 4.44772 12 4.5C12 5.05228 11.5523 5.5 11 5.5C10.4477 5.5 10 6.05228 10 5.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Lock Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C6.89543 2 6 2.89543 6 4V6H5C4.44772 6 4 6.44772 4 7V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V7C12 6.44772 11.5523 6 11 6H10V4C10 2.89543 9.10457 2 8 2ZM8 3.5C8.55228 3.5 9 3.94772 9 4.5V6H7V4.5C7 3.94772 7.44772 3.5 8 3.5ZM5.5 7.5V12.5H10.5V7.5H5.5Z"
      fill="currentColor"
    />
  </svg>
);

export const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Trash Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3H11V4H12V5H4V4H5V3ZM6 4H10V3H6V4ZM4 6H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V6ZM5.5 7.5V12.5H6.5V7.5H5.5ZM7.5 7.5V12.5H8.5V7.5H7.5ZM9.5 7.5V12.5H10.5V7.5H9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Copy Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z"
      fill="currentColor"
    />
  </svg>
);

export const SidebarLeftIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Sidebar Left Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 4.5C2 4.22386 2.22386 4 2.5 4H13.5C13.7761 4 14 4.22386 14 4.5C14 4.77614 13.7761 5 13.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 8C2 7.72386 2.22386 7.5 2.5 7.5H13.5C13.7761 7.5 14 7.72386 14 8C14 8.27614 13.7761 8.5 13.5 8.5H2.5C2.22386 8.5 2 8.27614 2 8ZM2 11.5C2 11.2239 2.22386 11 2.5 11H9.5C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12H2.5C2.22386 12 2 11.7761 2 11.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CheckCircleFillIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Check Circle Fill Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM11.7071 6.29289C12.0976 6.68342 12.0976 7.31658 11.7071 7.70711L7.70711 11.7071C7.31658 12.0976 6.68342 12.0976 6.29289 11.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L7 9.58579L10.2929 6.29289C10.6834 5.90237 11.3166 5.90237 11.7071 6.29289Z"
      fill="currentColor"
    />
  </svg>
);

export const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Globe Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 2.5C10.4853 2.5 12.5 4.51472 12.5 7V9C12.5 9.27614 12.2761 9.5 12 9.5C11.7239 9.5 11.5 9.27614 11.5 9V7C11.5 5.34315 10.1569 4 8 4C5.84315 4 4.5 5.34315 4.5 7V9C4.5 9.27614 4.27614 9.5 4 9.5C3.72386 9.5 3.5 9.27614 3.5 9V7C3.5 4.51472 5.51472 2.5 8 2.5ZM6 7C6 6.44772 6.44772 6 7 6H9C9.55228 6 10 6.44772 10 7C10 7.55228 9.55228 8 9 8H7C6.44772 8 6 7.55228 6 7ZM7.5 7C7.5 7.27614 7.72386 7.5 8 7.5C8.27614 7.5 8.5 7.27614 8.5 7C8.5 6.72386 8.27614 6.5 8 6.5C7.72386 6.5 7.5 6.72386 7.5 7Z"
      fill="currentColor"
    />
  </svg>
);

export const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Plus Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C8.55228 2 9 2.44772 9 3V7H13C13.5523 7 14 7.44772 14 8C14 8.55228 13.5523 9 13 9H9V13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13V9H3C2.44772 9 2 8.55228 2 8C2 7.44772 2.44772 7 3 7H7V3C7 2.44772 7.44772 2 8 2Z"
      fill="currentColor"
    />
  </svg>
);

export const SparklesIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Sparkles Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 0L9.5 2.5L12 1L11.5 4L14 5.5L11.5 6L12 9L9.5 7.5L8 10L6.5 7.5L4 9L4.5 6L2 5.5L4.5 4L4 1L6.5 2.5L8 0ZM8 3L7.5 4L6.5 3.5L7 2.5L8 3ZM8 7L8.5 6L9.5 6.5L9 7.5L8 7ZM6 5L7 4.5L8 5L7.5 6L6 5Z"
      fill="currentColor"
    />
  </svg>
);

export const ThumbUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Thumb Up Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C7.44772 1 7 1.44772 7 2V6H4C3.44772 6 3 6.44772 3 7V13C3 13.5523 3.44772 14 4 14H11C11.5523 14 12 13.5523 12 13V7C12 6.44772 11.5523 6 11 6H9V2C9 1.44772 8.55228 1 8 1ZM8 2.5V6H10V12.5H4.5V7.5H8Z"
      fill="currentColor"
    />
  </svg>
);

export const ThumbDownIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Thumb Down Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 15C8.55228 15 9 14.5523 9 14V10H12C12.5523 10 13 9.55228 13 9V3C13 2.44772 12.5523 2 12 2H5C4.44772 2 4 2.44772 4 3V9C4 9.55228 4.44772 10 5 10H7V14C7 14.5523 7.44772 15 8 15ZM8 13.5V10H6V3.5H11.5V8.5H8Z"
      fill="currentColor"
    />
  </svg>
);

export const SummarizeIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Summarize Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3C14 3.55228 13.5523 4 13 4H3C2.44772 4 2 3.55228 2 3ZM2 6C2 5.44772 2.44772 5 3 5H13C13.5523 5 14 5.44772 14 6C14 6.55228 13.5523 7 13 7H3C2.44772 7 2 6.55228 2 6ZM2 9C2 8.44772 2.44772 8 3 8H9C9.55228 8 10 8.44772 10 9C10 9.55228 9.55228 10 9 10H3C2.44772 10 2 9.55228 2 9ZM11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9ZM2 12C2 11.4477 2.44772 11 3 11H9C9.55228 11 10 11.4477 10 12C10 12.5523 9.55228 13 9 13H3C2.44772 13 2 12.5523 2 12ZM11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12Z"
      fill="currentColor"
    />
  </svg>
);

export const UserIcon = () => {
  return (
    <svg
      data-testid="geist-icon"
      height="16"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width="16"
      className="text-current"
    >
      <title>User Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.75 0C5.95507 0 4.5 1.45507 4.5 3.25V3.75C4.5 5.54493 5.95507 7 7.75 7H8.25C10.0449 7 11.5 5.54493 11.5 3.75V3.25C11.5 1.45507 10.0449 0 8.25 0H7.75ZM6 3.25C6 2.2835 6.7835 1.5 7.75 1.5H8.25C9.2165 1.5 10 2.2835 10 3.25V3.75C10 4.7165 9.2165 5.5 8.25 5.5H7.75C6.7835 5.5 6 4.7165 6 3.75V3.25ZM2.5 14.5V13.1709C3.31958 11.5377 4.99308 10.5 6.82945 10.5H9.17055C11.0069 10.5 12.6804 11.5377 13.5 13.1709V14.5H2.5ZM6.82945 9C4.35483 9 2.10604 10.4388 1.06903 12.6857L1 12.8353V13V15.25V16H1.75H14.25H15V15.25V13V12.8353L14.931 12.6857C13.894 10.4388 11.6452 9 9.17055 9H6.82945Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const AttachmentIcon = () => {
  return (
    <svg
      height="16"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width="16"
      className="text-current"
    >
      <title>Attachment Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5 6.5V13.5C14.5 14.8807 13.3807 16 12 16H4C2.61929 16 1.5 14.8807 1.5 13.5V1.5V0H3H8H9.08579C9.351 0 9.60536 0.105357 9.79289 0.292893L14.2071 4.70711C14.3946 4.89464 14.5 5.149 14.5 5.41421V6.5ZM13 6.5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V1.5H8V5V6.5H9.5H13ZM9.5 2.12132V5H12.3787L9.5 2.12132Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const VercelIcon = ({ size = 17 }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Vercel Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1L16 15H0L8 1Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GitIcon = () => {
  return (
    <svg
      height="16"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width="16"
      className="text-current"
    >
      <title>Git Icon</title>
      <g clipPath="url(#clip0_872_3147)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 0C3.58 0 0 3.57879 0 7.99729C0 11.5361 2.29 14.5251 5.47 15.5847C5.87 15.6547 6.02 15.4148 6.02 15.2049C6.02 15.0149 6.01 14.3851 6.01 13.7154C4 14.0852 3.48 13.2255 3.32 12.7757C3.23 12.5458 2.84 11.836 2.5 11.6461C2.22 11.4961 1.82 11.1262 2.49 11.1162C3.12 11.1062 3.57 11.696 3.72 11.936C4.44 13.1455 5.59 12.8057 6.05 12.5957C6.12 12.0759 6.33 11.726 6.56 11.5261C4.78 11.3262 2.92 10.6364 2.92 7.57743C2.92 6.70773 3.23 5.98797 3.74 5.42816C3.66 5.22823 3.38 4.40851 3.82 3.30888C3.82 3.30888 4.49 3.09895 6.02 4.1286C6.66 3.94866 7.34 3.85869 8.02 3.85869C8.7 3.85869 9.38 3.94866 10.02 4.1286C11.55 3.08895 12.22 3.30888 12.22 3.30888C12.66 4.40851 12.38 5.22823 12.3 5.42816C12.81 5.98797 13.12 6.69773 13.12 7.57743C13.12 10.6464 11.25 11.3262 9.47 11.5261C9.76 11.776 10.01 12.2558 10.01 13.0056C10.01 14.0752 10 14.9349 10 15.2049C10 15.4148 10.15 15.6647 10.55 15.5847C12.1381 15.0488 13.5182 14.0284 14.4958 12.6673C15.4735 11.3062 15.9996 9.67293 16 7.99729C16 3.57879 12.42 0 8 0Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_872_3147">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const BoxIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0.154663L8.34601 0.334591L14.596 3.58459L15 3.79466V4.25V11.75V12.2053L14.596 12.4154L8.34601 15.6654L8 15.8453L7.65399 15.6654L1.40399 12.4154L1 12.2053V11.75V4.25V3.79466L1.40399 3.58459L7.65399 0.334591L8 0.154663ZM2.5 11.2947V5.44058L7.25 7.81559V13.7647L2.5 11.2947ZM8.75 13.7647L13.5 11.2947V5.44056L8.75 7.81556V13.7647ZM8 1.84534L12.5766 4.22519L7.99998 6.51352L3.42335 4.2252L8 1.84534Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const HomeIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Home Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5 6.56062L8.00001 2.06062L3.50001 6.56062V13.5L6.00001 13.5V11C6.00001 9.89539 6.89544 8.99996 8.00001 8.99996C9.10458 8.99996 10 9.89539 10 11V13.5L12.5 13.5V6.56062ZM13.78 5.71933L8.70711 0.646409C8.31659 0.255886 7.68342 0.255883 7.2929 0.646409L2.21987 5.71944C2.21974 5.71957 2.21961 5.7197 2.21949 5.71982L0.469676 7.46963L-0.0606537 7.99996L1.00001 9.06062L1.53034 8.53029L2.00001 8.06062V14.25V15H2.75001L6.00001 15H7.50001H8.50001H10L13.25 15H14V14.25V8.06062L14.4697 8.53029L15 9.06062L16.0607 7.99996L15.5303 7.46963L13.7806 5.71993C13.7804 5.71973 13.7802 5.71953 13.78 5.71933ZM8.50001 11V13.5H7.50001V11C7.50001 10.7238 7.72386 10.5 8.00001 10.5C8.27615 10.5 8.50001 10.7238 8.50001 11Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GPSIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>GPS Icon</title>
      <path
        d="M1 6L15 1L10 15L7.65955 8.91482C7.55797 8.65073 7.34927 8.44203 7.08518 8.34045L1 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="bevel"
        fill="transparent"
      />
    </svg>
  );
};

export const InvoiceIcon = ({ size = 16 }: { size: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Invoice Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 15.1L12 14.5L10.1524 15.8857C10.0621 15.9534 9.93791 15.9534 9.8476 15.8857L8 14.5L6.14377 15.8922C6.05761 15.9568 5.94008 15.9601 5.85047 15.9003L3.75 14.5L3 15L2.83257 15.1116L1.83633 15.7758L1.68656 15.8756C1.60682 15.9288 1.5 15.8716 1.5 15.7758V15.5958V14.3985V14.1972V1.5V0H3H8H9.08579C9.351 0 9.60536 0.105357 9.79289 0.292893L14.2071 4.70711C14.3946 4.89464 14.5 5.149 14.5 5.41421V6.5V14.2507V14.411V15.5881V15.7881C14.5 15.8813 14.3982 15.9389 14.3183 15.891L14.1468 15.7881L13.1375 15.1825L13 15.1ZM12.3787 5L9.5 2.12132V5H12.3787ZM8 1.5V5V6.5H9.5H13V13.3507L12.7717 13.2138L11.9069 12.6948L11.1 13.3L10 14.125L8.9 13.3L8 12.625L7.1 13.3L5.94902 14.1632L4.58205 13.2519L3.75 12.6972L3 13.1972V1.5H8Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LogoOpenAI = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>OpenAI Logo</title>
      <path
        d="M14.9449 6.54871C15.3128 5.45919 15.1861 4.26567 14.5978 3.27464C13.7131 1.75461 11.9345 0.972595 10.1974 1.3406C9.42464 0.481584 8.3144 -0.00692594 7.15045 7.42132e-05C5.37487 -0.00392587 3.79946 1.1241 3.2532 2.79113C2.11256 3.02164 1.12799 3.72615 0.551837 4.72468C-0.339497 6.24071 -0.1363 8.15175 1.05451 9.45178C0.686626 10.5413 0.813308 11.7348 1.40162 12.7258C2.28637 14.2459 4.06498 15.0279 5.80204 14.6599C6.5743 15.5189 7.68504 16.0074 8.849 15.9999C10.6256 16.0044 12.2015 14.8754 12.7478 13.2069C13.8884 12.9764 14.873 12.2718 15.4491 11.2733C16.3394 9.75728 16.1357 7.84774 14.9454 6.54771L14.9449 6.54871ZM8.85001 14.9544C8.13907 14.9554 7.45043 14.7099 6.90468 14.2604C6.92951 14.2474 6.97259 14.2239 7.00046 14.2069L10.2293 12.3668C10.3945 12.2743 10.4959 12.1008 10.4949 11.9133V7.42173L11.8595 8.19925C11.8742 8.20625 11.8838 8.22025 11.8858 8.23625V11.9558C11.8838 13.6099 10.5263 14.9509 8.85001 14.9544ZM2.32133 12.2028C1.9651 11.5958 1.8369 10.8843 1.95902 10.1938C1.98284 10.2078 2.02489 10.2333 2.05479 10.2503L5.28366 12.0903C5.44733 12.1848 5.65003 12.1848 5.81421 12.0903L9.75604 9.84429V11.3993C9.75705 11.4153 9.74945 11.4308 9.73678 11.4408L6.47295 13.3004C5.01915 14.1264 3.1625 13.6354 2.32184 12.2028H2.32133ZM1.47155 5.24819C1.82626 4.64017 2.38619 4.17516 3.05305 3.93366C3.05305 3.96116 3.05152 4.00966 3.05152 4.04366V7.72424C3.05051 7.91124 3.15186 8.08475 3.31654 8.17725L7.25838 10.4228L5.89376 11.2003C5.88008 11.2093 5.86285 11.2108 5.84765 11.2043L2.58331 9.34327C1.13255 8.51426 0.63494 6.68272 1.47104 5.24869L1.47155 5.24819ZM12.6834 7.82274L8.74157 5.57669L10.1062 4.79968C10.1199 4.79068 10.1371 4.78918 10.1523 4.79568L13.4166 6.65522C14.8699 7.48373 15.3681 9.31827 14.5284 10.7523C14.1732 11.3593 13.6138 11.8243 12.9474 12.0663V8.27575C12.9489 8.08875 12.8481 7.91574 12.6839 7.82274H12.6834ZM14.0414 5.8057C14.0176 5.7912 13.9756 5.7662 13.9457 5.7492L10.7168 3.90916C10.5531 3.81466 10.3504 3.81466 10.1863 3.90916L6.24442 6.15521V4.60017C6.2434 4.58417 6.251 4.56867 6.26367 4.55867L9.52751 2.70063C10.9813 1.87311 12.84 2.36563 13.6781 3.80066C14.0323 4.40667 14.1605 5.11618 14.0404 5.8057H14.0414ZM5.50257 8.57726L4.13744 7.79974C4.12275 7.79274 4.11312 7.77874 4.11109 7.76274V4.04316C4.11211 2.38713 5.47368 1.0451 7.15197 1.0461C7.86189 1.0461 8.54902 1.2921 9.09476 1.74011C9.06993 1.75311 9.02737 1.77661 8.99899 1.79361L5.77012 3.63365C5.60493 3.72615 5.50358 3.89916 5.50459 4.08666L5.50257 8.57626V8.57726ZM6.24391 7.00022L7.99972 5.9997L9.75553 6.99972V9.00027L7.99972 10.0003L6.24391 9.00027V7.00022Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TerminalWindowIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Terminal Window Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1ZM4 11.1339L4.44194 10.6919L6.51516 8.61872C6.85687 8.27701 6.85687 7.72299 6.51517 7.38128L4.44194 5.30806L4 4.86612L3.11612 5.75L3.55806 6.19194L5.36612 8L3.55806 9.80806L3.11612 10.25L4 11.1339ZM8 9.75494H8.6225H11.75H12.3725V10.9999H11.75H8.6225H8V9.75494Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TerminalIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Terminal Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.53035 12.7804L1.00002 13.3108L-0.0606384 12.2501L0.469692 11.7198L4.18936 8.00011L0.469692 4.28044L-0.0606384 3.75011L1.00002 2.68945L1.53035 3.21978L5.60358 7.29301C5.9941 7.68353 5.9941 8.3167 5.60357 8.70722L1.53035 12.7804ZM8.75002 12.5001H8.00002V14.0001H8.75002H15.25H16V12.5001H15.25H8.75002Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const ClockRewind = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Clock Rewind Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.96452 2.5C11.0257 2.5 13.5 4.96643 13.5 8C13.5 11.0336 11.0257 13.5 7.96452 13.5C6.12055 13.5 4.48831 12.6051 3.48161 11.2273L3.03915 10.6217L1.828 11.5066L2.27046 12.1122C3.54872 13.8617 5.62368 15 7.96452 15C11.8461 15 15 11.87 15 8C15 4.13001 11.8461 1 7.96452 1C5.06835 1 2.57851 2.74164 1.5 5.23347V3.75V3H0V3.75V7.25C0 7.66421 0.335786 8 0.75 8H3.75H4.5V6.5H3.75H2.63724C3.29365 4.19393 5.42843 2.5 7.96452 2.5ZM8.75 5.25V4.5H7.25V5.25V7.8662C7.25 8.20056 7.4171 8.51279 7.6953 8.69825L9.08397 9.62404L9.70801 10.0401L10.5401 8.79199L9.91603 8.37596L8.75 7.59861V5.25Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LogsIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Logs Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2H9.75H14.25H15V3.5H14.25H9.75H9V2ZM9 12.5H9.75H14.25H15V14H14.25H9.75H9V12.5ZM9.75 7.25H9V8.75H9.75H14.25H15V7.25H14.25H9.75ZM1 12.5H1.75H2.25H3V14H2.25H1.75H1V12.5ZM1.75 2H1V3.5H1.75H2.25H3V2H2.25H1.75ZM1 7.25H1.75H2.25H3V8.75H2.25H1.75H1V7.25ZM5.75 12.5H5V14H5.75H6.25H7V12.5H6.25H5.75ZM5 2H5.75H6.25H7V3.5H6.25H5.75H5V2ZM5.75 7.25H5V8.75H5.75H6.25H7V7.25H6.25H5.75Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const ImageIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Image Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 2.5C1 1.67157 1.67157 1 2.5 1H13.5C14.3284 1 15 1.67157 15 2.5V13.5C15 14.3284 14.3284 15 13.5 15H2.5C1.67157 15 1 14.3284 1 13.5V2.5ZM2.5 2C2.22386 2 2 2.22386 2 2.5V13.5C2 13.7761 2.22386 14 2.5 14H13.5C13.7761 14 14 13.7761 14 13.5V2.5C14 2.22386 13.7761 2 13.5 2H2.5ZM4 5.5C4 4.67157 4.67157 4 5.5 4H10.5C11.3284 4 12 4.67157 12 5.5V10.5C12 11.3284 11.3284 12 10.5 12H5.5C4.67157 12 4 11.3284 4 10.5V5.5ZM5.5 5C5.22386 5 5 5.22386 5 5.5V10.5C5 10.7761 5.22386 11 5.5 11H10.5C10.7761 11 11 10.7761 11 10.5V5.5C11 5.22386 10.7761 5 10.5 5H5.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const FullscreenIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Fullscreen Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z"
      fill="currentColor"
    />
  </svg>
);

export const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Download Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78032L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78032L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z"
      fill="currentColor"
    />
  </svg>
);

export const LineChartIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Line Chart Icon</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M1 1v11.75A2.25 2.25 0 0 0 3.25 15H15v-1.5H3.25a.75.75 0 0 1-.75-.75V1H1Zm13.297 5.013.513-.547-1.094-1.026-.513.547-3.22 3.434-2.276-2.275a1 1 0 0 0-1.414 0L4.22 8.22l-.53.53 1.06 1.06.53-.53L7 7.56l2.287 2.287a1 1 0 0 0 1.437-.023l3.573-3.811Z"
      clipRule="evenodd"
    />
  </svg>
);

export const WarningIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width={size}
      className="text-current"
    >
      <title>Warning Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.55846 0.5C9.13413 0.5 9.65902 0.902369 9.90929 1.34788L15.8073 13.5653C16.1279 14.2293 15.6441 15 14.9068 15H1.09316C0.355835 15 -0.127943 14.2293 0.192608 13.5653L6.09065 1.34787C6.34092 0.829454 6.86581 0.5 7.44148 0.5H8.55846ZM8.74997 4.75V5.5V8V8.75H7.24997V8V5.5V4.75H8.74997ZM7.99997 12C8.55226 12 8.99997 11.5523 8.99997 11C8.99997 10.4477 8.55226 10 7.99997 10C7.44769 10 6.99997 10.4477 6.99997 11C6.99997 11.5523 7.44769 12 7.99997 12Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const BoldIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Bold Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 3.5C4 2.67157 4.67157 2 5.5 2H8.5C10.433 2 12 3.567 12 5.5C12 6.47991 11.5201 7.36764 10.7929 7.79289C11.5201 8.21715 12 9.10488 12 10C12 11.933 10.433 13.5 8.5 13.5H5.5C4.67157 13.5 4 12.8284 4 12V3.5ZM6 4V6.5H8.5C9.05228 6.5 9.5 6.05228 9.5 5.5C9.5 4.94772 9.05228 4.5 8.5 4.5H6ZM6 8H8.5C9.05228 8 9.5 8.44772 9.5 9C9.5 9.55228 9.05228 10 8.5 10H6V8Z"
      fill="currentColor"
    />
  </svg>
);

export const ItalicIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Italic Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 2H7.5L6.5 2V3.5L8.5 3.5L7 12.5H5.5L5.5 14H8.5L9.5 14V12.5L7.5 12.5L9 3.5H10.5V2Z"
      fill="currentColor"
    />
  </svg>
);

export const UnderlineIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Underline Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2V8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8V2H10.5V8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8V2H4ZM3 14.5H13V13H3V14.5Z"
      fill="currentColor"
    />
  </svg>
);

export const ListIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>List Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 4.5C2 4.22386 2.22386 4 2.5 4H13.5C13.7761 4 14 4.22386 14 4.5C14 4.77614 13.7761 5 13.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 8C2 7.72386 2.22386 7.5 2.5 7.5H13.5C13.7761 7.5 14 7.72386 14 8C14 8.27614 13.7761 8.5 13.5 8.5H2.5C2.22386 8.5 2 8.27614 2 8ZM2 11.5C2 11.2239 2.22386 11 2.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H2.5C2.22386 12 2 11.7761 2 11.5Z"
      fill="currentColor"
    />
  </svg>
);

export const ListOrderedIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>List Ordered Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 4C2.22386 4 2 4.22386 2 4.5C2 4.77614 2.22386 5 2.5 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H2.5ZM2.5 7.5C2.22386 7.5 2 7.72386 2 8C2 8.27614 2.22386 8.5 2.5 8.5H13.5C13.7761 8.5 14 8.27614 14 8C14 7.72386 13.7761 7.5 13.5 7.5H2.5ZM2.5 11C2.22386 11 2 11.2239 2 11.5C2 11.7761 2.22386 12 2.5 12H13.5C13.7761 12 14 11.7761 14 11.5C14 11.2239 13.7761 11 13.5 11H2.5ZM0 4.5C0 3.67157 0.671573 3 1.5 3C2.32843 3 3 3.67157 3 4.5C3 5.32843 2.32843 6 1.5 6C0.671573 6 0 5.32843 0 4.5ZM0 8C0 7.17157 0.671573 6.5 1.5 6.5C2.32843 6.5 3 7.17157 3 8C3 8.82843 2.32843 9.5 1.5 9.5C0.671573 9.5 0 8.82843 0 8ZM1.5 10.5C0.671573 10.5 0 11.1716 0 12C0 12.8284 0.671573 13.5 1.5 13.5C2.32843 13.5 3 12.8284 3 12C3 11.1716 2.32843 10.5 1.5 10.5Z"
      fill="currentColor"
    />
  </svg>
);

export const QuoteIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Quote Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 4C4.89543 4 4 4.89543 4 6V10C4 11.1046 4.89543 12 6 12H8C9.10457 12 10 11.1046 10 10V6C10 4.89543 9.10457 4 8 4H6ZM6 5.5H8C8.27614 5.5 8.5 5.72386 8.5 6V10C8.5 10.2761 8.27614 10.5 8 10.5H6C5.72386 10.5 5.5 10.2761 5.5 10V6C5.5 5.72386 5.72386 5.5 6 5.5ZM12 4C10.8954 4 10 4.89543 10 6V10C10 11.1046 10.8954 12 12 12H14C15.1046 12 16 11.1046 16 10V6C16 4.89543 15.1046 4 14 4H12ZM12 5.5H14C14.2761 5.5 14.5 5.72386 14.5 6V10C14.5 10.2761 14.2761 10.5 14 10.5H12C11.7239 10.5 11.5 10.2761 11.5 10V6C11.5 5.72386 11.7239 5.5 12 5.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LinkIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Link Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.29289 1.29289C8.68342 0.902369 9.31658 0.902369 9.70711 1.29289L14.7071 6.29289C15.0976 6.68342 15.0976 7.31658 14.7071 7.70711L9.70711 12.7071C9.31658 13.0976 8.68342 13.0976 8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L12.5858 7L8.29289 2.70711C7.90237 2.31658 7.90237 1.68342 8.29289 1.29289ZM1.29289 8.29289C0.902369 7.90237 0.902369 7.26921 1.29289 6.87868L6.29289 1.87868C6.68342 1.48816 7.31658 1.48816 7.70711 1.87868C8.09763 2.26921 8.09763 2.90237 7.70711 3.29289L3.41421 7.5L7.70711 11.7071C8.09763 12.0976 8.09763 12.7308 7.70711 13.1213C7.31658 13.5118 6.68342 13.5118 6.29289 13.1213L1.29289 8.29289Z"
      fill="currentColor"
    />
  </svg>
);

export const PaletteIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Palette Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C5.79086 1 4 2.79086 4 5C4 6.48168 4.79371 7.77029 6 8.46482V12C6 12.5523 6.44772 13 7 13H9C9.55228 13 10 12.5523 10 12V8.46482C11.2063 7.77029 12 6.48168 12 5C12 2.79086 10.2091 1 8 1ZM8 2.5C9.38071 2.5 10.5 3.61929 10.5 5C10.5 5.8174 10.1509 6.54433 9.5703 7.08535C9.54364 7.10937 9.51526 7.13105 9.48515 7.15027C9.45504 7.16949 9.42337 7.18605 9.39071 7.19966C9.35805 7.21327 9.32461 7.22383 9.29071 7.23105C9.25681 7.23827 9.22261 7.242 9.18843 7.24176C8.82743 7.23976 8.5 6.91076 8.5 6.54976V6.54976C8.5 6.18876 8.17257 5.85976 7.81157 5.85776C7.77739 5.85752 7.74319 5.85379 7.70929 5.84657C7.67539 5.83935 7.64195 5.82879 7.60929 5.81518C7.57663 5.80157 7.54496 5.78401 7.51485 5.76479C7.48474 5.74557 7.45636 5.72389 7.4297 5.69987C6.84911 5.15885 6.5 4.43192 6.5 3.5C6.5 2.61929 7.61929 1.5 9 1.5H8Z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Chevron Down Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.46967 6.46967L8 10L11.5303 6.46967L12.0607 7L8 11.0607L3.93934 7L4.46967 6.46967Z"
      fill="currentColor"
    />
  </svg>
);

export const DeltaIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Delta Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2L14 8H10V14H6V8H2L8 2Z"
      fill="currentColor"
    />
  </svg>
);

export const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Play Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 3.5C4 2.67157 4.67157 2 5.5 2H10.5C11.3284 2 12 2.67157 12 3.5V12.5C12 13.3284 11.3284 14 10.5 14H5.5C4.67157 14 4 13.3284 4 12.5V3.5ZM6 4V12H10V4H6Z"
      fill="currentColor"
    />
  </svg>
);

export const UndoIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Undo Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 7.44772 2.44772 7 3 7C3.55228 7 4 7.44772 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C6.89543 4 5.875 4.375 5.08535 5H7C7.55228 5 8 5.44772 8 6C8 6.55228 7.55228 7 7 7H3C2.44772 7 2 6.55228 2 6V2C2 1.44772 2.44772 1 3 1C3.55228 1 4 1.44772 4 2V3.41421C5.18571 2.62396 6.52843 2 8 2Z"
      fill="currentColor"
    />
  </svg>
);

export const RedoIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Redo Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 7.44772 14.4477 7 15 7C15.5523 7 16 7.44772 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C9.47157 0 10.8143 0.62396 12 1.41421V2C12 2.55228 11.5523 3 11 3C10.4477 3 10 2.55228 10 2V0C10 0.447715 9.55228 1 9 1H5C4.44772 1 4 1.44772 4 2C4 2.55228 4.44772 3 5 3H6.91465C6.12496 3.875 5.10457 4 4 4C1.79086 4 0 5.79086 0 8C0 10.2091 1.79086 12 4 12C6.20914 12 8 10.2091 8 8C8 7.44772 8.44772 7 9 7C9.55228 7 10 7.44772 10 8C10 10.2091 11.7909 12 14 12C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4C12.8954 4 11.875 4.375 11.0854 5H13C13.5523 5 14 5.44772 14 6C14 6.55228 13.5523 7 13 7H9C8.44772 7 8 6.55228 8 6V2C8 1.44772 8.44772 1 9 1C9.55228 1 10 1.44772 10 2V3.41421C11.1857 2.62396 12.5284 2 14 2C17.3137 2 20 4.68629 20 8C20 11.3137 17.3137 14 14 14C10.6863 14 8 11.3137 8 8C8 7.44772 8.44772 7 9 7C9.55228 7 10 7.44772 10 8C10 10.2091 11.7909 12 14 12C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4C12.8954 4 11.875 4.375 11.0854 5H13C13.5523 5 14 5.44772 14 6C14 6.55228 13.5523 7 13 7H9C8.44772 7 8 6.55228 8 6V2C8 1.44772 8.44772 1 9 1C9.55228 1 10 1.44772 10 2V3.41421C11.1857 2.62396 12.5284 2 14 2Z"
      fill="currentColor"
    />
  </svg>
);

export const MessageIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Message Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.5 3.5H14.5V11.5C14.5 12.3284 13.8284 13 13 13H3C2.17157 13 1.5 12.3284 1.5 11.5V3.5ZM0 2H1.5H14.5H16V3.5V11.5C16 13.1569 14.6569 14.5 13 14.5H3C1.34315 14.5 0 13.1569 0 11.5V3.5V2ZM4 6.5C4 6.22386 4.22386 6 4.5 6H11.5C11.7761 6 12 6.22386 12 6.5C12 6.77614 11.7761 7 11.5 7H4.5C4.22386 7 4 6.77614 4 6.5ZM4 9.5C4 9.22386 4.22386 9 4.5 9H8.5C8.77614 9 9 9.22386 9 9.5C9 9.77614 8.77614 10 8.5 10H4.5C4.22386 10 4 9.77614 4 9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CrossIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Cross Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.0607 4.93934L13.1213 6L12.0607 7.06066L9.06066 10.0607L8 11.1213L6.93934 10.0607L3.93934 7.06066L3 6L3.93934 4.93934L6.93934 1.93934L8 0.87868L9.06066 1.93934L12.0607 4.93934ZM8 2.5L6.5 4L8 5.5L9.5 4L8 2.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CrossSmallIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Cross Small Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.0607 5.93934L12.1213 7L11.0607 8.06066L8.06066 11.0607L7 12.1213L5.93934 11.0607L2.93934 8.06066L2 7L2.93934 5.93934L5.93934 2.93934L7 1.87868L8.06066 2.93934L11.0607 5.93934ZM7 3.5L5.5 5L7 6.5L8.5 5L7 3.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LoaderIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Loader Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4Z"
      fill="currentColor"
    />
  </svg>
);

export const FileIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>File Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 2H9.5L12.5 5V13.5C12.5 14.3284 11.8284 15 11 15H3.5C2.67157 15 2 14.3284 2 13.5V3.5C2 2.67157 2.67157 2 3.5 2ZM3.5 3.5V13.5H11V6.5H8.5V3.5H3.5ZM9.5 3.5V5.5H11L9.5 3.5Z"
      fill="currentColor"
    />
  </svg>
);

export const PencilEditIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Pencil Edit Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5 2L14 4.5L8.5 10H6V7.5L11.5 2ZM12.5 3L13 3.5L7.5 9H7V8.5L12.5 3ZM2 11.5V14H4.5L10.5 8L8 5.5L2 11.5ZM3 12.5L7 8.5L8.5 10L4.5 14H3V12.5Z"
      fill="currentColor"
    />
  </svg>
);

export const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Globe Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 2.5C10.4853 2.5 12.5 4.51472 12.5 7V9C12.5 9.27614 12.2761 9.5 12 9.5C11.7239 9.5 11.5 9.27614 11.5 9V7C11.5 5.34315 10.1569 4 8 4C5.84315 4 4.5 5.34315 4.5 7V9C4.5 9.27614 4.27614 9.5 4 9.5C3.72386 9.5 3.5 9.27614 3.5 9V7C3.5 4.51472 5.51472 2.5 8 2.5ZM6 7C6 6.44772 6.44772 6 7 6H9C9.55228 6 10 6.44772 10 7C10 7.55228 9.55228 8 9 8H7C6.44772 8 6 7.55228 6 7ZM7.5 7C7.5 7.27614 7.72386 7.5 8 7.5C8.27614 7.5 8.5 7.27614 8.5 7C8.5 6.72386 8.27614 6.5 8 6.5C7.72386 6.5 7.5 6.72386 7.5 7Z"
      fill="currentColor"
    />
  </svg>
);

export const ArrowUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Arrow Up Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 4L11.5 7.5L10.5 8.5L8.5 6.5V12H7.5V6.5L5.5 8.5L4.5 7.5L8 4Z"
      fill="currentColor"
    />
  </svg>
);

export const PaperclipIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Paperclip Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.5 2H7.5V9.5C7.5 10.3284 6.82843 11 6 11C5.17157 11 4.5 10.3284 4.5 9.5C4.5 8.67157 5.17157 8 6 8C6.27614 8 6.5 8.22386 6.5 8.5C6.5 8.77614 6.27614 9 6 9C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11C6.55228 11 7 10.5523 7 10V3H8.5V2Z"
      fill="currentColor"
    />
  </svg>
);

export const StopIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Stop Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 4H12V12H4V4ZM3 3H13V13H3V3Z"
      fill="currentColor"
    />
  </svg>
);

export const MoreHorizontalIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>More Horizontal Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 8C4 7.44772 4.44772 7 5 7C5.55228 7 6 7.44772 6 8C6 8.55228 5.55228 9 5 9C4.44772 9 4 8.55228 4 8ZM7 8C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8ZM10 8C10 7.44772 10.4477 7 11 7C11.5523 7 12 7.44772 12 8C12 8.55228 11.5523 9 11 9C10.4477 9 10 8.55228 10 8Z"
      fill="currentColor"
    />
  </svg>
);

export const ShareIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Share Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C11.4477 6 10.9477 5.77614 10.5858 5.41421L7.70711 7.29289C7.89464 7.68342 8 8.12971 8 8.5C8 8.87029 7.89464 9.31658 7.70711 9.70711L10.5858 11.5858C10.9477 11.2239 11.4477 11 12 11C13.1046 11 14 11.8954 14 13C14 14.1046 13.1046 15 12 15C10.8954 15 10 14.1046 10 13C10 12.8703 10.0259 12.7441 10.074 12.625L7.19526 10.7463C6.83235 11.1082 6.33235 11.3324 5.83235 11.3324C4.72778 11.3324 3.83235 10.437 3.83235 9.33243C3.83235 8.22786 4.72778 7.33243 5.83235 7.33243C6.33235 7.33243 6.83235 7.55663 7.19526 7.91855L10.074 6.03984C10.0259 5.92074 10 5.79457 10 5.66579C10 5.10457 10.4477 4.5 11 4.5C11.5523 4.5 12 4.94772 12 5.5C12 6.05228 11.5523 6.5 11 6.5C10.4477 6.5 10 6.05228 10 5.5C10 4.94772 10.4477 4 11 4C11.5523 4 12 4.44772 12 4.5C12 5.05228 11.5523 5.5 11 5.5C10.4477 5.5 10 5.05228 10 4.5Z"
      fill="currentColor"
    />
  </svg>
);

export const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Lock Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 2C6.89543 2 6 2.89543 6 4V6H5C4.44772 6 4 6.44772 4 7V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V7C12 6.44772 11.5523 6 11 6H10V4C10 2.89543 9.10457 2 8 2ZM8 3.5C8.55228 3.5 9 3.94772 9 4.5V6H7V4.5C7 3.94772 7.44772 3.5 8 3.5ZM5.5 7.5V12.5H10.5V7.5H5.5Z"
      fill="currentColor"
    />
  </svg>
);

export const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Trash Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3H11V4H12V5H4V4H5V3ZM6 4H10V3H6V4ZM4 6H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V6ZM5.5 7.5V12.5H6.5V7.5H5.5ZM7.5 7.5V12.5H8.5V7.5H7.5ZM9.5 7.5V12.5H10.5V7.5H9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Copy Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z"
      fill="currentColor"
    />
  </svg>
);

export const SidebarLeftIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Sidebar Left Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 4.5C2 4.22386 2.22386 4 2.5 4H13.5C13.7761 4 14 4.22386 14 4.5C14 4.77614 13.7761 5 13.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 8C2 7.72386 2.22386 7.5 2.5 7.5H13.5C13.7761 7.5 14 7.72386 14 8C14 8.27614 13.7761 8.5 13.5 8.5H2.5C2.22386 8.5 2 8.27614 2 8ZM2 11.5C2 11.2239 2.22386 11 2.5 11H9.5C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12H2.5C2.22386 12 2 11.7761 2 11.5Z"
      fill="currentColor"
    />
  </svg>
);

export const CheckCircleFillIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    className="text-current"
  >
    <title>Check Circle Fill Icon</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM11.7071 6.29289C12.0976 6.68342 12.0976 7.31658 11.7071 7.70711L7.70711 11.7071C7.31658 12.0976 6.68342 12.0976 6.29289 11.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L7 9.58579L10.2929 6.29289C10.6834 5.90237 11.3166 5.90237 11.7071 6.29289Z"
      fill="currentColor"
    />
  </svg>
);
