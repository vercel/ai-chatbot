import { TerminalWindowIcon, LoaderIcon, CrossSmallIcon } from './icons';
import { Button } from './ui/button';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ConsoleOutput } from './block';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

// Add basic SVG sanitization
const sanitizeSVG = (svg: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    // Remove potentially dangerous elements/attributes
    const scripts = doc.getElementsByTagName('script');
    for (const script of scripts) {
      script.remove();
    }
    return doc.documentElement.outerHTML;
  } catch (e) {
    console.error('SVG sanitization failed:', e);
    return '<div>Invalid SVG content</div>';
  }
};

export function Console({ consoleOutputs, setConsoleOutputs }: ConsoleProps) {
  const [height, setHeight] = useState<number>(300);
  const [isResizing, setIsResizing] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const minHeight = 100;
  const maxHeight = 800;

  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          setHeight(newHeight);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutputs]);

  const toggleImage = (outputId: string) => {
    setExpandedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(outputId)) {
        newSet.delete(outputId);
      } else {
        newSet.add(outputId);
      }
      return newSet;
    });
  };

  const renderConsoleContent = (output: ConsoleOutput) => {
    if (!output.content) return null;

    if (output.type === 'plot-output') {
      const content = output.content as {
        png: string | null;
        svg: string | null;
      };
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Plot output detected.
          </div>
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => toggleImage(`${output.id}-png`)}
              className="w-fit"
              disabled={!content.png}
            >
              {expandedImages.has(`${output.id}-png`) ? 'Hide PNG' : 'Show PNG'}
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleImage(`${output.id}-svg`)}
              className="w-fit"
              disabled={!content.svg}
            >
              {expandedImages.has(`${output.id}-svg`) ? 'Hide SVG' : 'Show SVG'}
            </Button>
          </div>
          {expandedImages.has(`${output.id}-png`) && content.png && (
            <Image
              src={`data:image/png;base64,${content.png}`}
              alt="PNG visualization"
              width={500}
              height={300}
              className="rounded-md"
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          )}
          {expandedImages.has(`${output.id}-svg`) && content.svg && (
            <div
              className="rounded-md"
              dangerouslySetInnerHTML={{
                __html: (() => {
                  try {
                    return sanitizeSVG(atob(content.svg));
                  } catch (e) {
                    console.error('SVG decode failed:', e);
                    return '<div>Failed to decode SVG</div>';
                  }
                })(),
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-line">{output.content as string}</div>
    );
  };

  return consoleOutputs.length > 0 ? (
    <>
      <div
        className="h-2 w-full fixed cursor-ns-resize z-50"
        onMouseDown={startResizing}
        style={{ bottom: height - 4 }}
        role="slider"
        aria-valuenow={minHeight}
      />

      <div
        className={cn(
          'fixed flex flex-col bottom-0 dark:bg-zinc-900 bg-zinc-50 w-full border-t z-40 overflow-y-scroll dark:border-zinc-700 border-zinc-200',
          {
            'select-none': isResizing,
          }
        )}
        style={{ height }}
      >
        <div className="flex flex-row justify-between items-center w-full h-fit border-b dark:border-zinc-700 border-zinc-200 px-2 py-1 sticky top-0 z-50 bg-muted">
          <div className="text-sm pl-2 dark:text-zinc-50 text-zinc-800 flex flex-row gap-3 items-center">
            <div className="text-muted-foreground">
              <TerminalWindowIcon />
            </div>
            <div>Console</div>
          </div>
          <Button
            variant="ghost"
            className="size-fit p-1 hover:dark:bg-zinc-700 hover:bg-zinc-200"
            size="icon"
            onClick={() => setConsoleOutputs([])}
          >
            <CrossSmallIcon />
          </Button>
        </div>

        <div>
          {consoleOutputs.map((consoleOutput, index) => (
            <div
              key={consoleOutput.id}
              className="px-4 py-2 flex flex-row text-sm border-b dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900 bg-zinc-50 font-mono"
            >
              <div
                className={cn('w-12 shrink-0', {
                  'text-muted-foreground':
                    consoleOutput.status === 'in_progress',
                  'text-emerald-500': consoleOutput.status === 'completed',
                  'text-red-400': consoleOutput.status === 'failed',
                })}
              >
                [{index + 1}]
              </div>
              {consoleOutput.status === 'in_progress' ? (
                <div className="animate-spin size-fit self-center">
                  <LoaderIcon />
                </div>
              ) : (
                <div className="dark:text-zinc-50 text-zinc-900 w-full">
                  {renderConsoleContent(consoleOutput)}
                </div>
              )}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </>
  ) : null;
}
