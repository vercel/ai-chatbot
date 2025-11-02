"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';

export type ModelSelectorProps = ComponentProps<typeof Dialog>;

export const ModelSelector = (props: ModelSelectorProps) => (
  <Dialog {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
  <DialogTrigger {...props} />
);

export type ModelSelectorContentProps = ComponentProps<typeof DialogContent>;

export const ModelSelectorContent = ({ className, ...props }: ModelSelectorContentProps) => (
  <DialogContent className={cn("p-0", className)} {...props} />
);

export type ModelSelectorHeaderProps = ComponentProps<typeof DialogHeader>;

export const ModelSelectorHeader = ({ children, className, ...props }: ModelSelectorHeaderProps) => (
  <DialogHeader className={cn("sr-only", className)} {...props}>
    <DialogTitle>Select a model</DialogTitle>
  </DialogHeader>
);

export type ModelSelectorCommandProps = ComponentProps<typeof Command>;

export const ModelSelectorCommand = (props: ModelSelectorCommandProps) => (
  <Command {...props} />
);

export type ModelSelectorCommandInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorCommandInput = (props: ModelSelectorCommandInputProps) => (
  <div className="[&>div]:h-12">
    <CommandInput placeholder="Search for a model..." {...props} />
  </div>
);

export type ModelSelectorCommandListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorCommandList = (props: ModelSelectorCommandListProps) => (
  <CommandList {...props} />
);

export type ModelSelectorCommandEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ModelSelectorCommandEmpty = (props: ModelSelectorCommandEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ModelSelectorCommandGroupProps = ComponentProps<typeof CommandGroup>;

export const ModelSelectorCommandGroup = (props: ModelSelectorCommandGroupProps) => (
  <CommandGroup {...props} />
);

export type ModelSelectorCommandItemProps = ComponentProps<typeof CommandItem>;

export const ModelSelectorCommandItem = (props: ModelSelectorCommandItemProps) => (
  <CommandItem {...props} />
);