import OrderedMap from 'orderedmap';
import {
  Schema,
  type Node as ProsemirrorNode,
  type MarkSpec,
  DOMParser,
} from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import type { ArtifactKind } from '@/components/artifact';

import { diffEditor, DiffType } from '@/lib/editor/diff';

const diffSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: OrderedMap.from({
    ...schema.spec.marks.toObject(),
    diffMark: {
      attrs: { type: { default: '' } },
      toDOM(mark) {
        let className = '';

        switch (mark.attrs.type) {
          case DiffType.Inserted:
            className =
              'bg-green-100 text-green-700 dark:bg-green-500/70 dark:text-green-300';
            break;
          case DiffType.Deleted:
            className =
              'bg-red-100 line-through text-red-600 dark:bg-red-500/70 dark:text-red-300';
            break;
          default:
            className = '';
        }
        return ['span', { class: className }, 0];
      },
    } as MarkSpec,
  }),
});

function computeDiff(oldDoc: ProsemirrorNode, newDoc: ProsemirrorNode) {
  return diffEditor(diffSchema, oldDoc.toJSON(), newDoc.toJSON());
}

type DiffEditorProps = {
  oldContent: string;
  newContent: string;
  kind?: ArtifactKind;
};

export const DiffView = ({ oldContent, newContent, kind }: DiffEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      let oldDoc: ProsemirrorNode | null = null;
      let newDoc: ProsemirrorNode | null = null;

      try {
        if (kind === 'textv2') {
          const parsedOldContent = oldContent
            ? JSON.parse(oldContent)
            : { type: 'doc', content: [] };
          const parsedNewContent = newContent
            ? JSON.parse(newContent)
            : { type: 'doc', content: [] };
          oldDoc = diffSchema.nodeFromJSON(parsedOldContent);
          newDoc = diffSchema.nodeFromJSON(parsedNewContent);
        } else {
          const parser = DOMParser.fromSchema(diffSchema);
          const oldHtmlContent = renderToString(
            <ReactMarkdown>{oldContent || ''}</ReactMarkdown>,
          );
          const newHtmlContent = renderToString(
            <ReactMarkdown>{newContent || ''}</ReactMarkdown>,
          );

          const oldContainer = document.createElement('div');
          oldContainer.innerHTML = oldHtmlContent;
          const newContainer = document.createElement('div');
          newContainer.innerHTML = newHtmlContent;

          oldDoc = parser.parse(oldContainer);
          newDoc = parser.parse(newContainer);
        }
      } catch (error) {
        console.error('Error parsing content for diff view:', error);
        if (editorRef.current) {
          editorRef.current.textContent = 'Error loading diff.';
        }
        return;
      }

      if (!oldDoc || !newDoc) {
        console.error('Could not create ProseMirror documents for diff view.');
        if (editorRef.current) {
          editorRef.current.textContent = 'Error loading diff.';
        }
        return;
      }

      const diffedDoc = computeDiff(oldDoc, newDoc);

      const state = EditorState.create({
        doc: diffedDoc,
        plugins: [],
      });

      viewRef.current = new EditorView(editorRef.current, {
        state,
        editable: () => false,
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [oldContent, newContent, kind]);

  return <div className="diff-editor" ref={editorRef} />;
};
