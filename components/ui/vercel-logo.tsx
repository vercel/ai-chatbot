import { cn } from "@/lib/utils";

export const VercelLogo = ({ className }: { className?: string }) => (
  <svg
    height={22}
    viewBox="0 0 235 203"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Vercel Logo"
    className={cn(className, "dark:fill-white fill-black")}
  >
    <path d="M117.082 0L234.164 202.794H0L117.082 0Z" fill="currentColor" />
  </svg>
);
