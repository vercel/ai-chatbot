import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolInvocation } from 'ai';

export function ToolResult({
  toolInvocation,
}: { toolInvocation: ToolInvocation }) {
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
                <div className="flex items-center gap-2 text-xs mr-3">
                  <span className="font-mono">
                    Calling tool {toolInvocation.toolName}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="py-3 pr-6 md:pr-10 w-full overflow-x-hidden">
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
                            ? JSON.stringify(
                                JSON.parse(toolInvocation.result),
                                null,
                                2,
                              )
                            : typeof toolInvocation.result === 'object'
                              ? JSON.stringify(toolInvocation.result, null, 2)
                              : toolInvocation.result}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </motion.div>
  );
}
