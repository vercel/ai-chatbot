import { Suggestion } from '@/lib/db/schema';
import { UseChatHelpers } from 'ai/react';
import { ComponentType, ReactNode } from 'react';

export type BlockActionContext = {
  content: string;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
};

type BlockAction = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: BlockActionContext) => void;
  isDisabled?: (context: BlockActionContext) => boolean;
};

export type BlockToolbarContext = {
  appendMessage: UseChatHelpers['append'];
};

export type BlockToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: BlockToolbarContext) => void;
};

type BlockContent = {
  title: string;
  content: string;
  mode: 'edit' | 'diff';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: 'streaming' | 'idle';
  suggestions: Array<Suggestion>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
};

type BlockConfig<T extends string> = {
  kind: T;
  description: string;
  content: ComponentType<BlockContent>;
  actions?: BlockAction[];
  toolbar?: BlockToolbarItem[];
};

export class Block<T extends string> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<BlockContent>;
  readonly actions: BlockAction[];
  readonly toolbar: BlockToolbarItem[];

  constructor(config: BlockConfig<T>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
  }
}
