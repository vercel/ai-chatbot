import { motion } from 'framer-motion';
import { TerminalIcon, CrossIcon, LoaderIcon } from './icons';
import { Button } from './ui/button';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ConsoleOutput } from './block';
import { cn } from '@/lib/utils';

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

export function Console({ consoleOutputs, setConsoleOutputs }: ConsoleProps) {
  const [height, setHeight] = useState<number>(224);
  const [isResizing, setIsResizing] = useState(false);

  const minHeight = 100;
  const maxHeight = 800;

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
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return consoleOutputs.length > 0 ? (
    <motion.div
      initial={{ y: height }}
      animate={{ y: 0 }}
      exit={{ y: height }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      className={cn(
        'absolute flex flex-col bottom-0 bg-zinc-900 w-full border-t z-50 overflow-y-scroll border-zinc-700',
        {
          'select-none': isResizing,
        },
      )}
      style={{ height }}
    >
      <div
        className="w-full h-2 bg-zinc-800 cursor-ns-resize"
        onMouseDown={startResizing}
      />

      <div className="flex flex-row justify-between items-center w-full h-fit border-b border-zinc-700 p-2 pt-0 sticky top-0 z-50 bg-zinc-800">
        <div className="text-sm pl-2 text-zinc-50 flex flex-row gap-4 items-center">
          <TerminalIcon />
          Console
        </div>
        <Button
          variant="ghost"
          className="h-fit px-2 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50"
          onClick={() => setConsoleOutputs([])}
        >
          <CrossIcon />
        </Button>
      </div>
      {consoleOutputs.map((consoleOutput, index) => (
        <div
          key={consoleOutput.id}
          className="p-4 flex flex-row gap-2 text-sm border-b border-zinc-700 bg-zinc-900 font-mono"
        >
          <div className="text-emerald-500">[{index + 1}]</div>
          {consoleOutput.status === 'in_progress' ? (
            <div className="animate-spin size-fit self-center">
              <LoaderIcon />
            </div>
          ) : (
            <div className="text-zinc-50">{consoleOutput.content}</div>
          )}
        </div>
      ))}
    </motion.div>
  ) : null;
}
