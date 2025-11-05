/** biome-ignore-all lint/nursery/useSortedClasses: <explanation> */
"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
  title?: string;
  showLanguage?: boolean;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  title,
  showLanguage = true,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const displayTitle = title || (showLanguage ? language : undefined);
  
  // Use direct viewport check instead of hook to avoid streaming issues
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(newIsDesktop);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? resolvedTheme : undefined) !== 'light';
  const syntaxStyle = useMemo(() => (isDark ? oneDark : oneLight), [isDark]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md border bg-background text-foreground shrink-0",
          isDesktop ? "max-w-3xl" : "max-w-full",
          className
        )}
        style={{ 
          minWidth: 0,
          maxWidth: "100%",
          width: "100%",
          overflow: "hidden",
          contain: "layout",
        }}
        {...props}
      >
        {displayTitle && (
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {displayTitle}
              </span>
            </div>
            {children && (
              <div className="flex items-center gap-2">{children}</div>
            )}
          </div>
        )}
        <div 
          className="relative overflow-x-auto min-w-0 w-full max-w-full" 
          style={{ 
            maxWidth: "100%",
            width: "100%",
            overflow: "hidden auto",
            contain: "layout style",
          }}
        >
          <SyntaxHighlighter
            className="min-w-0! max-w-full! overflow-x-auto!"
            codeTagProps={{ className: "font-mono text-sm" }}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              whiteSpace: "pre",
              minWidth: 0,
              maxWidth: "100%",
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
              display: "block",
              contain: "layout",
            }}
            language={language}
            lineNumberStyle={{
              color: "hsl(var(--muted-foreground))",
              paddingRight: "1rem",
              minWidth: "2.5rem",
            }}
            showLineNumbers={showLineNumbers}
            style={syntaxStyle}
          >
            {code}
          </SyntaxHighlighter>
          {!displayTitle && children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
