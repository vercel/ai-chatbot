import { generateUUID } from '@/lib/utils';
import {
  type Dispatch,
  type SetStateAction,
  startTransition,
  useCallback,
  useState,
  useEffect,
} from 'react';
import type { ConsoleOutput, UIBlock } from './block';
import { Button } from './ui/button';
import { PlayIcon } from './icons';

function detectPythonImports(code: string, pyodide: any): Set<string> {
  const imports = new Set<string>();

  const importPatterns = [
    /import\s+(\w+)(?:\s+as\s+\w+)?/g,
    /from\s+(\w+(?:\.\w+)*)\s+import/g,
    /import\s+(\w+(?:\.\w+)*)/g,
  ];

  for (const pattern of importPatterns) {
    let match: RegExpExecArray | null;

    while (true) {
      match = pattern.exec(code);
      if (match === null) break;

      const rootPackage = match[1].split('.')[0];
      if (rootPackage) {
        imports.add(rootPackage);
      }
    }
  }

  // Get standard libraries dynamically when initializing Pyodide
  let standardLibs = new Set<string>();
  if (pyodide) {
    const stdLibModules = pyodide.runPython(`
      import sys
      list(sys.stdlib_module_names)
    `);
    standardLibs = new Set(stdLibModules);
  }

  return new Set(Array.from(imports).filter((pkg) => !standardLibs.has(pkg)));
}

const OUTPUT_HANDLERS = {
  matplotlib: `
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
          const newPyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
          });

          setPyodide(newPyodideInstance);
          currentPyodideInstance = newPyodideInstance;
        }

        await currentPyodideInstance.runPythonAsync(`
          import sys, io, gc
          import base64

          sys.stdout = io.StringIO()
        `);

        // Detect and load required packages
        const requiredPackages = detectPythonImports(
          codeContent,
          currentPyodideInstance,
        );

        if (requiredPackages.size > 0) {
          setConsoleOutputs((outputs) => [
            ...outputs.filter((output) => output.id !== runId),
            {
              id: runId,
              contents: [],
              status: 'loading_packages',
            },
          ]);

          await currentPyodideInstance.loadPackage(
            Array.from(requiredPackages),
          );
        }

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

        const runOutput = await currentPyodideInstance.runPythonAsync(
          `sys.stdout.getvalue()`,
        );

        const runOutputByLines: string[] = runOutput.split('\n');

        setConsoleOutputs((outputs) => [
          ...outputs.filter((output) => output.id !== runId),
          {
            id: generateUUID(),
            contents: runOutputByLines
              .filter((line) => line.trim().length)
              .map((line) => ({
                type: line.startsWith('data:image/png;base64')
                  ? 'image'
                  : 'text',
                value: line,
              })),
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
      disabled={block.status === 'streaming'}
    >
      <PlayIcon size={18} /> Run
    </Button>
  );
}
