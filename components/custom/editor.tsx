'use client';

import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { exampleSetup } from 'prosemirror-example-setup';
import { inputRules, textblockTypeInputRule } from 'prosemirror-inputrules';
import { defaultMarkdownSerializer } from 'prosemirror-markdown';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import React, { memo, useEffect, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';

import { Suggestion } from '@/db/schema';
import {
  createSuggestionWidget,
  projectWithHighlights,
  suggestionsPlugin,
  suggestionsPluginKey,
  UISuggestion,
} from '@/lib/editor/suggestions';

import { FloatingMenu, FloatingMenuState } from './floating-menu';
import { Markdown } from './markdown';

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  // @ts-expect-error: TODO need to fix type mismatch
  marks: {
    ...schema.spec.marks,
  },
});

function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    mySchema.nodes.heading,
    () => ({ level })
  );
}

interface WidgetRoot {
  destroy: () => void;
}

type EditorProps = {
  content: string;
  onChange: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
};

function PureEditor({
  content,
  onChange,
  status,
  suggestions: suggestionsWithoutHighlights,
  append,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const widgetRootsRef = useRef<Map<string, WidgetRoot>>(new Map());

  const [floatingMenu, setFloatingMenu] = useState<FloatingMenuState>({
    isVisible: false,
    position: { top: 0, left: 0 },
    selectedText: '',
  });

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      if (mySchema) {
        const parser = DOMParser.fromSchema(mySchema);

        const htmlContent = renderToString(<Markdown>{content}</Markdown>);

        const container = document.createElement('div');
        container.innerHTML = htmlContent;

        const state = EditorState.create({
          doc: parser.parse(container),
          plugins: [
            ...exampleSetup({ schema: mySchema, menuBar: false }),
            inputRules({
              rules: [
                headingRule(1),
                headingRule(2),
                headingRule(3),
                headingRule(4),
                headingRule(5),
                headingRule(6),
              ],
            }),
            suggestionsPlugin,
          ],
        });

        viewRef.current = new EditorView(editorRef.current, {
          state,
          dispatchTransaction: (transaction) => {
            const newState = viewRef.current!.state.apply(transaction);
            viewRef.current!.updateState(newState);

            if (transaction.docChanged) {
              const content = defaultMarkdownSerializer.serialize(newState.doc);

              if (transaction.getMeta('no-debounce')) {
                onChange(content, false);
              } else {
                onChange(content, true);
              }
            }
          },
        });

        const handleSelectionChange = () => {
          const view = viewRef.current;
          if (!view) return;

          const { from, to } = view.state.selection;

          if (from === to) {
            setFloatingMenu({
              isVisible: false,
              position: { top: 0, left: 0 },
              selectedText: '',
            });
            return;
          }

          const selectedText = view.state.doc.textBetween(from, to);

          const coords = view.coordsAtPos(from);
          const editorRect = editorRef.current!.getBoundingClientRect();

          setFloatingMenu({
            isVisible: true,
            selectedText,
            position: {
              top: coords.top - editorRect.top - 40,
              left: coords.left - editorRect.left,
            },
          });
        };

        const handleMouseUp = () => {
          setTimeout(handleSelectionChange, 0);
        };

        viewRef.current.dom.addEventListener('mouseup', handleMouseUp);
      } else {
        console.error('Schema is not properly initialized');
      }
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [content, onChange]);

  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc && content) {
      const computedSuggestions = projectWithHighlights(
        viewRef.current.state.doc,
        suggestionsWithoutHighlights
      ).filter(
        (suggestion) =>
          suggestion.selectionStart !== 0 && suggestion.selectionEnd !== 0
      );

      const decorations = createDecorations(
        computedSuggestions,
        viewRef.current
      );
      const transaction = viewRef.current.state.tr;
      transaction.setMeta(suggestionsPluginKey, { decorations });
      viewRef.current.dispatch(transaction);
    }
  }, [suggestionsWithoutHighlights, content]);

  const createDecorations = (suggestions: UISuggestion[], view: EditorView) => {
    const decorations: Decoration[] = [];

    suggestions.forEach((suggestion) => {
      decorations.push(
        Decoration.inline(
          suggestion.selectionStart,
          suggestion.selectionEnd,
          {
            class:
              'suggestion-highlight bg-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-400/50 dark:text-yellow-50 dark:bg-yellow-400/40',
          },
          {
            suggestionId: suggestion.id,
            type: 'highlight',
          }
        )
      );

      decorations.push(
        Decoration.widget(
          suggestion.selectionStart,
          (view) => {
            const { dom, destroy } = createSuggestionWidget(suggestion, view);
            const key = `widget-${suggestion.id}`;
            widgetRootsRef.current.set(key, { destroy });
            return dom;
          },
          {
            suggestionId: suggestion.id,
            type: 'widget',
          }
        )
      );
    });

    return DecorationSet.create(view.state.doc, decorations);
  };

  useEffect(() => {
    return () => {
      widgetRootsRef.current.forEach((root) => {
        root.destroy();
      });

      widgetRootsRef.current.clear();

      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative prose dark:prose-invert" ref={editorRef}>
      {status === 'idle' && (
        <FloatingMenu
          floatingMenu={floatingMenu}
          setFloatingMenu={setFloatingMenu}
          append={append}
        />
      )}
    </div>
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  if (prevProps.suggestions !== nextProps.suggestions) {
    return false;
  } else if (prevProps.content === '' && nextProps.content !== '') {
    return false;
  } else if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
    return false;
  } else if (prevProps.onChange !== nextProps.onChange) {
    return false;
  } else if (prevProps.status === 'idle') {
    return true;
  } else {
    return prevProps.content === nextProps.content;
  }
}

export const Editor = memo(PureEditor, areEqual);
