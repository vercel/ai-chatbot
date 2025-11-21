"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToggleGroupProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
  className?: string;
  children: React.ReactNode;
};

const ToggleGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
}>({
  value: undefined,
  onValueChange: undefined,
  type: "single",
});

export function ToggleGroup({
  value,
  onValueChange,
  type = "single",
  className,
  children,
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange, type }}>
      <div
        className={cn(
          "inline-flex items-center rounded-lg border bg-muted p-1",
          className,
        )}
        role="group"
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export function ToggleGroupItem({
  value,
  className,
  children,
  disabled,
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);
  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => {
        if (!disabled && context.onValueChange) {
          context.onValueChange(value);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}


