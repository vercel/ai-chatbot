"use client";

import { useCallback, useEffect, useState } from "react";
import { CodeIcon, LoaderIcon, PlayIcon, PythonIcon } from "./icons";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

interface ExecutableCodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function ExecutableCodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: ExecutableCodeBlockProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [pyodide, setPyodide] = useState<any>(null);
  const match = /language-(\w+)/.exec(className || "");
  const isPython = match && match[1] === "python";
  const codeContent = String(children).replace(/\n$/, "");
  const [tab, setTab] = useState<"code" | "run">("code");

  const loadAndRunPython = useCallback(async () => {
    let currentPyodideInstance = pyodide;

    if (isPython) {
      if (!currentPyodideInstance) {
        // @ts-ignore
        const newPyodideInstance = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });

        setPyodide(newPyodideInstance);
        currentPyodideInstance = newPyodideInstance;
      }

      try {
        await currentPyodideInstance.runPythonAsync(`
            import sys
            import io
            sys.stdout = io.StringIO()
          `);

        await currentPyodideInstance.runPythonAsync(codeContent);

        const output = await currentPyodideInstance.runPythonAsync(
          `sys.stdout.getvalue()`,
        );

        setOutput(output);
      } catch (error: any) {
        setOutput(error.message);
      }
    }
  }, [pyodide, codeContent, isPython]);

  if (!inline && isPython) {
    if (isPython) {
      return (
        <div className="not-prose flex flex-col">
          <div
            className={cn(
              "flex flex-row justify-between w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-t-xl",
              {
                "rounded-xl": tab === "run" && !output,
              },
            )}
          >
            <div className="flex flex-row gap-3 items-center pl-1.5">
              <PythonIcon />
              <div className="text-sm">Python</div>
              {tab === "run" && !output && (
                <div className="animate-spin">
                  <LoaderIcon />
                </div>
              )}
            </div>

            <div className="flex flex-row items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("h-fit px-2 dark:hover:bg-zinc-700", {
                      "bg-zinc-200 dark:bg-zinc-700": tab === "code",
                    })}
                    onClick={() => {
                      setTab("code");
                    }}
                  >
                    <CodeIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View code</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("h-fit px-2 dark:hover:bg-zinc-700", {
                      "bg-zinc-200 dark:bg-zinc-700": tab === "run",
                    })}
                    onClick={() => {
                      setTab("run");
                      loadAndRunPython();
                    }}
                  >
                    <PlayIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run code</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {tab === "code" && (
            <pre
              {...props}
              className={`text-sm w-full overflow-x-auto bg-zinc-100 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 border-t-0 rounded-b-xl`}
            >
              <code className="whitespace-pre-wrap break-words">
                {children}
              </code>
            </pre>
          )}

          {tab === "run" && output && (
            <div className="text-sm w-full overflow-x-auto bg-zinc-100 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 border-t-0 rounded-b-xl">
              <code>{output}</code>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <pre
          {...props}
          className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-auto bg-zinc-100 p-3 rounded-lg mt-2 dark:bg-zinc-800`}
        >
          <code>{children}</code>
        </pre>
      );
    }
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
