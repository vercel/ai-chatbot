"use client";

import { useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { ScanSchedule, ScanScheduleFrequency, ScanSource } from "@/lib/types";

type ScheduleConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScanSchedule;
  sources: ScanSource[];
  onSave: (schedule: ScanSchedule) => void;
};

const FREQUENCY_OPTIONS: { value: ScanScheduleFrequency; label: string }[] = [
  { value: "12h", label: "Every 12 hours" },
  { value: "24h", label: "Every 24 hours" },
  { value: "48h", label: "Every 48 hours" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual only" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function ScheduleConfigDialog({
  open,
  onOpenChange,
  schedule,
  sources,
  onSave,
}: ScheduleConfigDialogProps) {
  const [frequency, setFrequency] = useState<ScanScheduleFrequency>(
    schedule.frequency
  );
  const [timeOfDay, setTimeOfDay] = useState<string>(
    schedule.timeOfDay || "03:00"
  );
  const [enabledSources, setEnabledSources] = useState<string[]>(
    schedule.enabledSources
  );

  const handleSourceToggle = (sourceId: string, checked: boolean) => {
    setEnabledSources((prev) =>
      checked ? [...prev, sourceId] : prev.filter((id) => id !== sourceId)
    );
  };

  const handleSave = () => {
    onSave({
      frequency,
      timeOfDay: frequency !== "manual" ? timeOfDay : undefined,
      timezone: "EST",
      enabledSources,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Scan Schedule</DialogTitle>
          <DialogDescription>
            Set how often the system automatically scans configured web sources
            for new content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label htmlFor="frequency">
              <Calendar className="mr-2 inline h-4 w-4" />
              Scan Frequency
            </Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                setFrequency(value as ScanScheduleFrequency)
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time of Day Selection */}
          {frequency !== "manual" && (
            <div className="space-y-2">
              <Label htmlFor="timeOfDay">
                <Clock className="mr-2 inline h-4 w-4" />
                Time of Day (EST)
              </Label>
              <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                <SelectTrigger id="timeOfDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Scans will run at this time each cycle
              </p>
            </div>
          )}

          {/* Source Selection */}
          <div className="space-y-3">
            <Label>Sources to Include</Label>
            <div className="space-y-3 rounded-lg border p-4">
              {sources.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No sources configured. Add sources in Configure Sources.
                </p>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={source.id}
                      checked={enabledSources.includes(source.id)}
                      onCheckedChange={(checked) =>
                        handleSourceToggle(source.id, checked === true)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={source.id}
                        className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {source.url}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {source.type.charAt(0).toUpperCase() +
                          source.type.slice(1)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
