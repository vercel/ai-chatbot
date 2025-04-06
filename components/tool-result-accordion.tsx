import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Wrench, Table, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolInvocation } from 'ai';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getToolkitIconByToolName } from './icons/utils';

export function ToolResultAccordion({
  toolInvocation,
}: { toolInvocation: ToolInvocation }) {
  const [view, setView] = useState<'code' | 'table'>('table');

  const renderContent = () => {
    if (view === 'code') {
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
              Parameters
            </h4>
            <pre
              className={cn(
                'bg-muted/50 p-3 rounded-md overflow-x-auto font-mono text-xs',
                'border border-border/50',
              )}
            >
              <code className="text-wrap break-words whitespace-pre-wrap">
                {JSON.stringify(toolInvocation.args, null, 2)}
              </code>
            </pre>
          </div>
          {toolInvocation.state === 'result' && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                Response
              </h4>
              <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto font-mono text-xs border border-border/50">
                <code className="text-wrap break-words whitespace-pre-wrap">
                  {typeof toolInvocation.result === 'string' &&
                  toolInvocation.result.trim().startsWith('{')
                    ? JSON.stringify(JSON.parse(toolInvocation.result), null, 2)
                    : typeof toolInvocation.result === 'object'
                      ? JSON.stringify(toolInvocation.result, null, 2)
                      : toolInvocation.result}
                </code>
              </pre>
            </div>
          )}
        </div>
      );
    }

    // Table view
    const result =
      toolInvocation.state === 'result'
        ? typeof toolInvocation.result === 'string' &&
          toolInvocation.result.trim().startsWith('{')
          ? JSON.parse(toolInvocation.result)
          : typeof toolInvocation.result === 'object'
            ? toolInvocation.result
            : { value: toolInvocation.result }
        : null;

    return (
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
            Parameters
          </h4>
          <div className="bg-muted/50 p-3 rounded-md border border-border/50">
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(toolInvocation.args).map(([key, value]) => (
                  <tr
                    key={key}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-1 pr-4 font-medium">{key}</td>
                    <td className="py-1">{JSON.stringify(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {result && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
              Response
            </h4>
            <div className="bg-muted/50 p-3 rounded-md border border-border/50 w-full overflow-x-auto">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(result).map(([key, value]) => (
                    <tr
                      key={key}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1 pr-4 font-medium">{key}</td>
                      <td
                        className="py-1 w-full overflow-x-hidden"
                        width="100%"
                      >
                        {typeof value === 'object' ? (
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          JSON.stringify(value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ToolIcon = getToolkitIconByToolName(toolInvocation.toolName);

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex gap-4 w-full border border-border/40 rounded-lg p-2">
        <div className="size-6 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border/50 bg-muted/50">
          <div className="translate-y-px">
            <Wrench className="size-3 text-muted-foreground" />
          </div>
        </div>

        <div className="w-full overflow-x-hidden">
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem
              key={toolInvocation.toolCallId}
              value={toolInvocation.toolCallId}
              className="border-b-0"
            >
              <AccordionTrigger className="pt-1 pb-0 hover:no-underline text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center justify-between gap-2 text-xs mr-3 w-full">
                  <span className="font-mono">
                    Calling tool {toolInvocation.toolName}
                  </span>
                  {ToolIcon && <ToolIcon className="size-4" />}
                </div>
              </AccordionTrigger>
              <AccordionContent className="py-3 pr-6 md:pr-10 w-full overflow-x-hidden">
                <div className="flex justify-end mb-3">
                  <Select
                    value={view}
                    onValueChange={(value: 'code' | 'table') => setView(value)}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Code className="size-3" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="table" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Table className="size-3" />
                          Table
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {renderContent()}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </motion.div>
  );
}
