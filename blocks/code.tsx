import { Block } from '@/components/create-block';
import { CodeEditor } from '@/components/code-editor';
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { Console, ConsoleOutput } from '@/components/console';

interface Metadata {
  outputs: Array<ConsoleOutput>;
}

export const codeBlock = new Block<'code', Metadata>({
  kind: 'code',
  description:
    'Useful for code generation; Code execution is only available for python code.',
  initialize: () => ({
    outputs: [],
  }),
  onStreamPart: ({ streamPart, setBlock }) => {
    if (streamPart.type === 'code-delta') {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: streamPart.content as string,
        isVisible:
          draftBlock.status === 'streaming' &&
          draftBlock.content.length > 300 &&
          draftBlock.content.length < 310
            ? true
            : draftBlock.isVisible,
        status: 'streaming',
      }));
    }
  },
  content: ({ metadata, setMetadata, ...props }) => {
    return (
      <>
        <CodeEditor {...props} />

        {metadata?.outputs && (
          <Console
            consoleOutputs={metadata.outputs}
            setConsoleOutputs={() => {
              setMetadata({
                ...metadata,
                outputs: [],
              });
            }}
          />
        )}
      </>
    );
  },
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: 'Run',
      description: 'Execute code',
      onClick: async ({ content, setMetadata }) => {
        const runId = generateUUID();
        const outputs: any[] = [];

        // @ts-expect-error - loadPyodide is not defined
        const currentPyodideInstance = await globalThis.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
        });

        currentPyodideInstance.setStdout({
          batched: (output: string) => {
            outputs.push({
              id: runId,
              contents: [
                {
                  type: output.startsWith('data:image/png;base64')
                    ? 'image'
                    : 'text',
                  value: output,
                },
              ],
              status: 'completed',
            });
          },
        });

        await currentPyodideInstance.loadPackagesFromImports(content, {
          messageCallback: (message: string) => {
            outputs.push({
              id: runId,
              contents: [{ type: 'text', value: message }],
              status: 'loading_packages',
            });
          },
        });

        await currentPyodideInstance.runPythonAsync(content);

        setMetadata((metadata: any) => ({
          ...metadata,
          outputs,
        }));
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy code to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add comments',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add comments to the code snippet for understanding',
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: 'Add logs',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add logs to the code snippet for debugging',
        });
      },
    },
  ],
});
