"use client";

import { LeftRail } from "@/components/nav/LeftRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X } from "lucide-react";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { MOD_QUEUE_SEED } from "@/data/moderation";

export default function ModerationPage() {
  return (
    <div className="flex h-screen">
      <LeftRail />
      <main className="flex min-h-full flex-1 flex-col overflow-auto">
        <div className="mx-auto max-w-6xl p-8">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">Moderation</h1>
            <p className="text-muted-foreground">
              Content review queue (read-only)
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-semibold">Title</th>
                  <th className="p-4 text-left font-semibold">Type</th>
                  <th className="p-4 text-left font-semibold">Submitted By</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOD_QUEUE_SEED.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index !== MOD_QUEUE_SEED.length - 1 ? "border-b" : ""}
                  >
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4 text-muted-foreground">{item.type}</td>
                    <td className="p-4 text-muted-foreground">{item.submittedBy}</td>
                    <td className="p-4">
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  Approve
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Demo only</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Demo only</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-auto"><LegalFooter /></div>
      </main>
    </div>
  );
}
