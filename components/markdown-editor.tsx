"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { marked } from "marked";
import { memo, useEffect, useMemo } from "react";
import type { Suggestion } from "@/lib/db/schema";

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Suggestion[];
};

function PureMarkdownEditor({ content, onSaveContent, status }: EditorProps) {
  const htmlContent = useMemo(() => {
    if (!content) {
      return "";
    }
    try {
      return marked(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: htmlContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none focus:outline-none px-4 py-8 md:p-20",
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML();
      onSaveContent(html, true);
    },
  });

  useEffect(() => {
    if (editor && htmlContent) {
      const currentContent = editor.getHTML();

      if (status === "streaming" || currentContent !== htmlContent) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [htmlContent, status, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full pb-[calc(80dvh)]">
      <EditorContent editor={editor} />
    </div>
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  if (prevProps.suggestions !== nextProps.suggestions) {
    return false;
  }
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
    return false;
  }
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
    return false;
  }
  if (prevProps.status === "streaming" && nextProps.status === "streaming") {
    return false;
  }
  if (prevProps.content !== nextProps.content) {
    return false;
  }

  return true;
}

export const MarkdownEditor = memo(PureMarkdownEditor, areEqual);
