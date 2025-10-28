"use client";

import { CheckCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QuickStartCardProps = {
  onDismiss?: () => void;
};

export default function QuickStartCard({ onDismiss }: QuickStartCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      number: 1,
      title: "Add your first knowledge item",
      description:
        'Click "Add Knowledge" to upload documents or add links to help Glen AI learn.',
    },
    {
      number: 2,
      title: "Configure automatic scanning sources",
      description:
        'Set up sources to monitor with "Configure Sources" so the system can find new content automatically.',
    },
    {
      number: 3,
      title: "Review and approve new discoveries",
      description:
        'Check the "Pending" tab regularly to review and approve content before it goes live.',
    },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">Quick Start Guide</CardTitle>
            <CardDescription>
              Get started with managing Glen AI's knowledge base
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => (
              <div className="flex gap-3" key={step.number}>
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 font-medium text-sm text-white dark:bg-blue-500">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-sm">{step.title}</h4>
                  <p className="text-muted-foreground text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-emerald-800 text-xs dark:text-emerald-300">
                <strong>Pro tip:</strong> All content goes through the Pending
                tab first, giving you full control before anything goes live.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
