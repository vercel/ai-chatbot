import { motion } from 'framer-motion';
import { TerminalIcon, CrossIcon, LoaderIcon } from './icons';
import { Button } from './ui/button';
import { Dispatch, SetStateAction } from 'react';
import { ConsoleOutput } from './block';

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

export function Console({ consoleOutputs, setConsoleOutputs }: ConsoleProps) {
  return (
    consoleOutputs.length > 0 && (
      <motion.div
        className="absolute flex flex-col bottom-0 bg-zinc-900 h-56 w-full border-t z-50 overflow-y-scroll border-zinc-700"
        initial={{ y: 224 }}
        animate={{ y: 0 }}
        exit={{ y: 224 }}
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      >
        <div className="flex flex-row justify-between items-center w-full h-fit border-b border-zinc-700 p-2 sticky top-0 z-50 bg-zinc-800">
          <div className="text-sm pl-2 text-zinc-50 flex flex-row gap-4 items-center">
            <TerminalIcon />
            Console
          </div>
          <Button
            variant="ghost"
            className="h-fit px-2 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50"
            onClick={() => {
              setConsoleOutputs([]);
            }}
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
              <div className="animate-spin">
                <LoaderIcon />
              </div>
            ) : (
              <div className="text-zinc-50">{consoleOutput.content}</div>
            )}
          </div>
        ))}
      </motion.div>
    )
  );
}
