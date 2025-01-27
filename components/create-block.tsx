import { Suggestion } from '@/lib/db/schema';
import { UseChatHelpers } from 'ai/react';
import { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import { DataStreamDelta } from './data-stream-handler';
import { UIBlock } from './block';

export type BlockActionContext = {
  content: string;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
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
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
};

interface InitializeParameters<M = any> {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<M>>;
}

type BlockConfig<T extends string, M = any> = {
  kind: T;
  description: string;
  content: ComponentType<
    Omit<BlockContent, 'metadata' | 'setMetadata'> & {
      metadata: M;
      setMetadata: Dispatch<SetStateAction<M>>;
    }
  >;
  actions?: BlockAction[];
  toolbar?: BlockToolbarItem[];
  metadata?: M;
  initialize?: (parameters: InitializeParameters<M>) => void;
  onStreamPart?: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setBlock: Dispatch<SetStateAction<UIBlock>>;
    streamPart: DataStreamDelta;
  }) => void;
};

export class Block<T extends string, M = any> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<BlockContent>;
  readonly actions: BlockAction[];
  readonly toolbar: BlockToolbarItem[];
  readonly metadata: M;
  readonly initialize: (parameters: InitializeParameters) => void;
  readonly onStreamPart?: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setBlock: Dispatch<SetStateAction<UIBlock>>;
    streamPart: DataStreamDelta;
  }) => void;

  constructor(config: BlockConfig<T, M>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
    this.metadata = config.metadata as M;
    this.initialize = config.initialize || (async () => ({}));
    this.onStreamPart = config.onStreamPart;
  }
}
