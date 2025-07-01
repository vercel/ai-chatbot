"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";
import { Button } from "./button";
import { cn } from "@ai-chat/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "../icons";

interface DropdownOption {
  key: string;
  display_name: string;
  description?: string;
  short_description?: string;
}

interface DropdownProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: DropdownOption[];
  disabled?: boolean;
  startIcon?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  id,
  value,
  onChange,
  options = [],
  disabled,
  startIcon,
}) => {
  const selectedOption = options.find((opt) => opt.key === value);

  return (
    <div className="dropdown">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            {startIcon}
            {selectedOption?.display_name}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[300px] max-w-[400px]"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.key}
              onSelect={() => onChange(option.key)}
              className={cn(
                "gap-4 group/item flex flex-row justify-between items-center",
                value === option.key && "font-medium"
              )}
            >
              <div className="flex flex-col gap-1 items-start">
                <span className="flex w-full items-center justify-between">
                  {option.display_name}
                </span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
              {value === option.key && <CheckCircleFillIcon />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
