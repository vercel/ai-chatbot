import { cn, generateUUID } from '@/lib/utils';
import { ClockRewind, CopyIcon, PlayIcon, RedoIcon, UndoIcon } from './icons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { ConsoleOutput, UIBlock } from './block';
import {
  Dispatch,
  memo,
  SetStateAction,
  startTransition,
  useCallback,
  useState,
  useEffect,
} from 'react';

interface BlockActionsProps {
  block: UIBlock;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'read-only' | 'edit' | 'diff';
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

export function RunCodeButton({
  block,
  setConsoleOutputs,
}: {
  block: UIBlock;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}) {
  const [pyodide, setPyodide] = useState<any>(null);
  const isPython = true;
  const codeContent = block.content;

  const loadAndRunPython = useCallback(async () => {
    const runId = generateUUID();

    setConsoleOutputs([
      {
        id: runId,
        content: null,
        status: 'in_progress',
        type: 'text',
      },
    ]);

    let currentPyodideInstance = pyodide;

    if (isPython) {
      try {
        if (!currentPyodideInstance) {
          // @ts-expect-error - pyodide is not defined
          const newPyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
          });

          setPyodide(newPyodideInstance);
          currentPyodideInstance = newPyodideInstance;
        }

        // Load matplotlib package first, then pandas
        await currentPyodideInstance.loadPackage(['matplotlib', 'pandas']);

        // Setup matplotlib with our custom show function that supports both formats
        await currentPyodideInstance.runPythonAsync(`
          import sys, io, gc
          import base64
          from matplotlib import pyplot as plt
          
          # Clear any existing plots
          plt.clf()
          plt.close('all')
          
          # Switch to agg backend
          plt.switch_backend('agg')
          
          # Capture standard output
          sys.stdout = io.StringIO()
          
          # Override plt.show() to automatically save to both formats
          def custom_show():
              # Add size checks
              if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:  # ~25MB
                  print("Warning: Plot size too large, reducing quality")
                  plt.gcf().set_dpi(100)  # Reduce quality
              
              # Save as PNG
              png_buf = io.BytesIO()
              plt.savefig(png_buf, format='png')
              png_buf.seek(0)
              png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
              print(f'Base64 encoded PNG: {png_base64}')
              png_buf.close()
              
              # Save as SVG
              svg_buf = io.BytesIO()
              plt.savefig(svg_buf, format='svg')
              svg_buf.seek(0)
              svg_base64 = base64.b64encode(svg_buf.read()).decode('utf-8')
              print(f'Base64 encoded SVG: {svg_base64}')
              svg_buf.close()
              
              plt.clf()
              plt.close('all')
          
          plt.show = custom_show
        `);

        // Run the actual code
        await currentPyodideInstance.runPythonAsync(codeContent);

        // Get the output
        const output = await currentPyodideInstance.runPythonAsync(
          `sys.stdout.getvalue()`
        );

        // Process output
        const lines = output.split('\n');
        let currentTextContent = '';

        for (const line of lines) {
          if (
            line.includes('Base64 encoded PNG:') ||
            line.includes('Base64 encoded SVG:') ||
            line.includes('Base64 encoded image:')
          ) {
            // Output accumulated text first
            if (currentTextContent.trim()) {
              setConsoleOutputs((prev) => [
                ...prev.filter((o) => o.id !== runId),
                {
                  id: generateUUID(),
                  content: currentTextContent.trim(),
                  status: 'completed',
                  type: 'text',
                },
              ]);
              currentTextContent = '';
            }

            // Extract data based on the format
            let pngData = null;
            let svgData = null;

            if (line.includes('Base64 encoded image:')) {
              pngData = line.split('Base64 encoded image:')[1]?.trim();
            } else {
              // Original PNG/SVG handling
              const pngMatch = lines.find((l: string) =>
                l.includes('Base64 encoded PNG:')
              );
              const svgMatch = lines.find((l: string) =>
                l.includes('Base64 encoded SVG:')
              );

              pngData = pngMatch?.split('Base64 encoded PNG:')[1]?.trim();
              svgData = svgMatch?.split('Base64 encoded SVG:')[1]?.trim();

              // Skip the next few lines if they contain the SVG data we just processed
              const currentIndex = lines.indexOf(line);
              if (svgMatch && currentIndex < lines.indexOf(svgMatch)) {
                continue;
              }
            }

            if (pngData || svgData) {
              setConsoleOutputs((prev) => [
                ...prev.filter((o) => o.id !== runId),
                {
                  id: generateUUID(),
                  content: {
                    png: pngData || null,
                    svg: svgData || null,
                  },
                  status: 'completed',
                  type: 'plot-output',
                },
              ]);
            }

            // Skip this line and potentially the next SVG line
            continue;
          } else if (line.trim() && !line.includes('Base64 encoded')) {
            // Only add non-base64 lines to text content
            currentTextContent += line + '\n';
          }
        }

        // Output any remaining text
        if (currentTextContent.trim()) {
          setConsoleOutputs((prev) => [
            ...prev.filter((o) => o.id !== runId),
            {
              id: runId,
              content: currentTextContent.trim(),
              status: 'completed',
              type: 'text',
            },
          ]);
        }

        // Final cleanup
        await currentPyodideInstance.runPythonAsync(`
          plt.clf()
          plt.close('all')
        `);
      } catch (error: any) {
        setConsoleOutputs((prev) => [
          {
            id: runId,
            content: error.message,
            status: 'failed',
            type: 'text',
          },
        ]);
      }
    }
  }, [pyodide, codeContent, isPython, setConsoleOutputs]);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      if (pyodide) {
        try {
          pyodide.runPythonAsync(`
            plt.clf()
            plt.close('all')
            gc.collect()
          `);
        } catch (e) {
          console.warn('Cleanup failed:', e);
        }
      }
    };
  }, [pyodide]);

  return (
    <Button
      variant="outline"
      className="py-1.5 px-2 h-fit dark:hover:bg-zinc-700"
      onClick={() => {
        startTransition(() => {
          loadAndRunPython();
        });
      }}
      disabled={block.status === 'streaming'}
    >
      <PlayIcon size={18} /> Run
    </Button>
  );
}

function PureBlockActions({
  block,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  setConsoleOutputs,
}: BlockActionsProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <div className="flex flex-row gap-1">
      {block.kind === 'code' && (
        <RunCodeButton block={block} setConsoleOutputs={setConsoleOutputs} />
      )}

      {block.kind === 'text' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'p-2 h-fit !pointer-events-auto dark:hover:bg-zinc-700',
                {
                  'bg-muted': mode === 'diff',
                }
              )}
              onClick={() => {
                handleVersionChange('toggle');
              }}
              disabled={
                block.status === 'streaming' || currentVersionIndex === 0
              }
            >
              <ClockRewind size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View changes</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
            onClick={() => {
              handleVersionChange('prev');
            }}
            disabled={currentVersionIndex === 0 || block.status === 'streaming'}
          >
            <UndoIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Previous version</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
            onClick={() => {
              handleVersionChange('next');
            }}
            disabled={isCurrentVersion || block.status === 'streaming'}
          >
            <RedoIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Next version</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700"
            onClick={() => {
              copyToClipboard(block.content);
              toast.success('Copied to clipboard!');
            }}
            disabled={block.status === 'streaming'}
          >
            <CopyIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy to clipboard</TooltipContent>
      </Tooltip>
    </div>
  );
}

export const BlockActions = memo(PureBlockActions, (prevProps, nextProps) => {
  if (prevProps.block.status !== nextProps.block.status) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;

  return true;
});
