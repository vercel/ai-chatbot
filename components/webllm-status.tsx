"use client";

import { useEffect, useState } from "react";
import {
  checkWebLLMSupport,
  type WebLLMAvailability,
  type WebLLMProgress,
} from "@/lib/ai/webllm-client";
import { cn } from "@/lib/utils";

interface WebLLMStatusProps {
  modelStatus: WebLLMAvailability | "checking" | "loading";
  downloadProgress: WebLLMProgress | null;
  className?: string;
}

export function WebLLMStatus({
  modelStatus,
  downloadProgress,
  className,
}: WebLLMStatusProps) {
  const statusConfig = {
    checking: {
      label: "Checking browser support...",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    unavailable: {
      label: "WebGPU not supported",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    downloadable: {
      label: "Model needs download",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
    downloading: {
      label: "Downloading model...",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    loading: {
      label: "Loading model...",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    available: {
      label: "Running locally",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
  };

  const config = statusConfig[modelStatus];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
        config.bgColor,
        config.color,
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {modelStatus === "checking" || modelStatus === "loading" ? (
          <LoadingSpinner />
        ) : modelStatus === "downloading" ? (
          <LoadingSpinner />
        ) : modelStatus === "available" ? (
          <CheckIcon />
        ) : modelStatus === "unavailable" ? (
          <XIcon />
        ) : (
          <DownloadIcon />
        )}
        <span>{config.label}</span>
      </div>
      {(modelStatus === "downloading" || modelStatus === "loading") &&
        downloadProgress && (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-current transition-all duration-300"
                style={{ width: `${downloadProgress.progress * 100}%` }}
              />
            </div>
            <span>{Math.round(downloadProgress.progress * 100)}%</span>
          </div>
        )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="size-3 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 18L18 6M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WebLLMSupportCheck() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(checkWebLLMSupport());
  }, []);

  if (supported === null) return null;

  if (!supported) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>WebGPU not supported:</strong> WebLLM requires a
        WebGPU-compatible browser like Chrome 113+ or Edge 113+.
      </div>
    );
  }

  return null;
}
