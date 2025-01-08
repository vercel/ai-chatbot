import { generateUUID } from '@/lib/utils';
import {
  type Dispatch,
  type SetStateAction,
  startTransition,
  useCallback,
  useState,
  useEffect,
  memo,
} from 'react';
import type { ConsoleOutput, ConsoleOutputContent, UIBlock } from './block';
import { Button } from './ui/button';
import { PlayIcon } from './icons';
import { useBlockSelector } from '@/hooks/use-block';

const OUTPUT_HANDLERS = {
  matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    # Clear any existing plots
    plt.clf()
    plt.close('all')

    # Switch to agg backend
    plt.switch_backend('agg')

    def setup_matplotlib_output():
        def custom_show():
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            plt.clf()
            plt.close('all')

        plt.show = custom_show
  `,
  basic: `
    # Basic output capture setup
  `,
};

function detectRequiredHandlers(code: string): string[] {
  const handlers: string[] = ['basic'];

  if (code.includes('matplotlib') || code.includes('plt.')) {
    handlers.push('matplotlib');
  }

  return handlers;
}

export function PureRunCodeButton({
  setConsoleOutputs,
}: {
  block: UIBlock;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}) {
  const isPython = true;
  const [pyodide, setPyodide] = useState<any>(null);

  const codeContent = useBlockSelector((state) => state.content);
  const isBlockStreaming = useBlockSelector(
    (state) => state.status === 'streaming',
  );

  const loadAndRunPython = useCallback(async () => {
    const runId = generateUUID();
    const stdOutputs: Array<ConsoleOutputContent> = [];

    setConsoleOutputs((outputs) => [
      ...outputs,
      {
        id: runId,
        contents: [],
        status: 'in_progress',
      },
    ]);

    let currentPyodideInstance = pyodide;

    if (isPython) {
      try {
        if (!currentPyodideInstance) {
          // @ts-expect-error - loadPyodide is not defined
          const newPyodideInstance = await globalThis.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
          });

          setPyodide(null);
          setPyodide(newPyodideInstance);
          currentPyodideInstance = newPyodideInstance;
        }

        currentPyodideInstance.setStdout({
          batched: (output: string) => {
            stdOutputs.push({
              type: output.startsWith('data:image/png;base64')
                ? 'image'
                : 'text',
              value: output,
            });
          },
        });

        await currentPyodideInstance.loadPackagesFromImports(codeContent, {
          messageCallback: (message: string) => {
            setConsoleOutputs((outputs) => [
              ...outputs.filter((output) => output.id !== runId),
              {
                id: runId,
                contents: [{ type: 'text', value: message }],
                status: 'loading_packages',
              },
            ]);
          },
        });

        const requiredHandlers = detectRequiredHandlers(codeContent);
        for (const handler of requiredHandlers) {
          if (OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS]) {
            await currentPyodideInstance.runPythonAsync(
              OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS],
            );

            if (handler === 'matplotlib') {
              await currentPyodideInstance.runPythonAsync(
                'setup_matplotlib_output()',
              );
            }
          }
        }

        await currentPyodideInstance.runPythonAsync(codeContent);

        setConsoleOutputs((outputs) => [
          ...outputs.filter((output) => output.id !== runId),
          {
            id: generateUUID(),
            contents: stdOutputs.filter((output) => output.value.trim().length),
            status: 'completed',
          },
        ]);
      } catch (error: any) {
        setConsoleOutputs((outputs) => [
          ...outputs.filter((output) => output.id !== runId),
          {
            id: runId,
            contents: [{ type: 'text', value: error.message }],
            status: 'failed',
          },
        ]);
      }
    }
  }, [pyodide, codeContent, isPython, setConsoleOutputs]);

  useEffect(() => {
    return () => {
      if (pyodide) {
        try {
          pyodide.runPythonAsync(`
            import sys
            import gc

            has_plt = 'matplotlib.pyplot' in sys.modules

            if has_plt:
                import matplotlib.pyplot as plt
                plt.clf()
                plt.close('all')

            gc.collect()
          `);
        } catch (error) {
          console.warn('Cleanup failed:', error);
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
      disabled={isBlockStreaming}
    >
      <PlayIcon size={18} /> Run
    </Button>
  );
}

export const RunCodeButton = memo(PureRunCodeButton, (prevProps, nextProps) => {
  if (prevProps.block.status !== nextProps.block.status) return false;

  return true;
});
