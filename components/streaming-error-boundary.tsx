"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "./toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class StreamingErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Streaming error caught by boundary:", error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Show toast notification
    toast({
      type: "error",
      description: "Streaming encountered an error. Attempting to recover...",
    });

    // Attempt to recover after a short delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({ hasError: false, error: undefined });
    }, 2000);
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <h3 className="font-medium">Streaming Error</h3>
            <p className="mt-1 text-sm">
              An error occurred during streaming. The app will recover automatically.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-3 rounded bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
              type="button"
            >
              Retry Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
