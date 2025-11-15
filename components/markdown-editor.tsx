"use client";

import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { marked } from "marked";
import { memo, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/lib/db/schema";
import type { MarkdownEdit } from "@/lib/types";
import { cn } from "@/lib/utils";

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Suggestion[];
  metadata?: { pendingEdits?: MarkdownEdit[] };
};

type TiptapToolbarProps = {
  editor: Editor | null;
};

function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-border border-b bg-background p-2">
      {/* Formatação de Texto */}
      <div className="flex items-center gap-1">
        <Button
          className={cn(
            editor.isActive("bold") && "bg-accent text-accent-foreground"
          )}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("italic") && "bg-accent text-accent-foreground"
          )}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("underline") && "bg-accent text-accent-foreground"
          )}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("strike") && "bg-accent text-accent-foreground"
          )}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("code") && "bg-accent text-accent-foreground"
          )}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-border" />

      {/* Títulos */}
      <div className="flex items-center gap-1">
        <Button
          className={cn(
            editor.isActive("heading", { level: 1 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("heading", { level: 2 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("heading", { level: 3 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("heading", { level: 4 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading4 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("heading", { level: 5 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading5 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("heading", { level: 6 }) &&
              "bg-accent text-accent-foreground"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <Heading6 className="h-4 w-4" />
        </Button>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-border" />

      {/* Listas */}
      <div className="flex items-center gap-1">
        <Button
          className={cn(
            editor.isActive("bulletList") && "bg-accent text-accent-foreground"
          )}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("orderedList") && "bg-accent text-accent-foreground"
          )}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-border" />

      {/* Outros */}
      <div className="flex items-center gap-1">
        <Button
          className={cn(
            editor.isActive("link") && "bg-accent text-accent-foreground"
          )}
          onClick={setLink}
          size="icon"
          type="button"
          variant="ghost"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("codeBlock") && "bg-accent text-accent-foreground"
          )}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Button
          className={cn(
            editor.isActive("blockquote") && "bg-accent text-accent-foreground"
          )}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-border" />

      {/* Ações */}
      <div className="flex items-center gap-1">
        <Button
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PureMarkdownEditor({
  content,
  onSaveContent,
  status,
  metadata,
}: EditorProps) {
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

  const processedEditsRef = useRef<Set<string>>(new Set());

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Underline,
    ],
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

  // Process pending edits from metadata
  // Apply edits directly to markdown content, then update the editor
  useEffect(() => {
    if (
      !editor ||
      !metadata?.pendingEdits ||
      metadata.pendingEdits.length === 0 ||
      !content
    ) {
      return;
    }

    const pendingEdits = metadata.pendingEdits;

    // Process each edit in reverse order to maintain correct positions
    const sortedEdits = [...pendingEdits].sort((a, b) => b.from - a.from);

    let updatedMarkdown = content;
    let hasChanges = false;

    for (const edit of sortedEdits) {
      const editKey = `${edit.from}-${edit.to}-${edit.newText}`;

      // Skip if already processed
      if (processedEditsRef.current.has(editKey)) {
        continue;
      }

      try {
        // Log edit before processing
        console.log("Processing edit in editor:", {
          from: edit.from,
          to: edit.to,
          oldText: edit.oldText,
          oldTextLength: edit.oldText.length,
          newText: edit.newText,
          newTextLength: edit.newText.length,
          newTextPreview: edit.newText.substring(0, 100),
        });

        // Validate newText is not empty
        if (!edit.newText || edit.newText.trim().length === 0) {
          console.warn("Edit has empty newText, skipping:", edit);
          continue;
        }

        // Verify the edit matches the current content
        // First check if positions are valid
        if (
          edit.from < 0 ||
          edit.to > updatedMarkdown.length ||
          edit.from >= edit.to
        ) {
          console.warn("Invalid edit positions:", edit);
          // Try to find by text content instead
          const searchPos = updatedMarkdown.indexOf(edit.oldText);
          if (searchPos !== -1) {
            const before = updatedMarkdown.slice(0, searchPos);
            const after = updatedMarkdown.slice(
              searchPos + edit.oldText.length
            );
            updatedMarkdown = before + edit.newText + after;
            hasChanges = true;
            processedEditsRef.current.add(editKey);
            continue;
          }
          continue;
        }

        const textAtPosition = updatedMarkdown.slice(edit.from, edit.to);

        // Normalize text for comparison (remove extra whitespace, normalize parentheses)
        const normalizeText = (text: string) =>
          text.replace(/\s+/g, " ").replace(/[()]/g, "").trim().toLowerCase();

        const normalizedTextAtPosition = normalizeText(textAtPosition);
        const normalizedOldText = normalizeText(edit.oldText);

        // Check if the oldText matches (allowing for some flexibility)
        if (
          textAtPosition === edit.oldText ||
          normalizedTextAtPosition === normalizedOldText ||
          textAtPosition.includes(edit.oldText) ||
          edit.oldText.includes(textAtPosition)
        ) {
          // Apply the edit to markdown
          const before = updatedMarkdown.slice(0, edit.from);
          const after = updatedMarkdown.slice(edit.to);
          updatedMarkdown = before + edit.newText + after;
          hasChanges = true;
          processedEditsRef.current.add(editKey);
        } else {
          // Try to find the text in the content (fallback with better matching)
          let searchPos = updatedMarkdown.indexOf(edit.oldText);

          // If exact match not found, try to find a partial match
          if (searchPos === -1) {
            // Try without parentheses and with normalized whitespace
            const searchText = edit.oldText.replace(/[()]/g, "").trim();
            const contentWithoutParens = updatedMarkdown.replace(/[()]/g, "");

            // Find position in normalized content, then map back to original
            const normalizedPos = contentWithoutParens.indexOf(searchText);
            if (normalizedPos !== -1) {
              // Count parentheses before this position to find actual position
              const beforeNormalized = updatedMarkdown.slice(0, normalizedPos);
              const parensCount = (beforeNormalized.match(/[()]/g) || [])
                .length;
              searchPos = normalizedPos + parensCount;
            }
          }

          if (searchPos !== -1 && searchPos < updatedMarkdown.length) {
            // Verify we found a reasonable match
            const foundText = updatedMarkdown.slice(
              searchPos,
              searchPos + edit.oldText.length
            );
            const foundNormalized = normalizeText(foundText);

            if (
              foundText === edit.oldText ||
              foundNormalized === normalizedOldText ||
              foundText.includes(edit.oldText) ||
              edit.oldText.includes(foundText)
            ) {
              const before = updatedMarkdown.slice(0, searchPos);
              const after = updatedMarkdown.slice(
                searchPos + edit.oldText.length
              );
              updatedMarkdown = before + edit.newText + after;
              hasChanges = true;
              processedEditsRef.current.add(editKey);
            } else {
              console.warn("Found position but text doesn't match:", {
                oldText: edit.oldText,
                foundText,
                textAtPosition,
                from: edit.from,
                to: edit.to,
                newText: edit.newText,
              });
            }
          } else {
            console.warn("Could not find edit text in content:", {
              oldText: edit.oldText,
              textAtPosition,
              from: edit.from,
              to: edit.to,
              newText: edit.newText,
            });
          }
        }
      } catch (error) {
        // If mapping fails, skip this edit
        console.warn("Failed to apply edit:", error, edit);
      }
    }

    // If we made changes, update the editor with the new markdown content
    if (hasChanges) {
      const newHtmlContent = marked(updatedMarkdown) as string;
      editor.commands.setContent(newHtmlContent);
      // Save the updated markdown content (not HTML)
      onSaveContent(updatedMarkdown, false);
    }
  }, [editor, metadata?.pendingEdits, content, onSaveContent]);

  // Clear processed edits when streaming finishes
  useEffect(() => {
    if (status === "idle" && metadata?.pendingEdits) {
      // Edits have been processed, clear them
      // This will be handled by the parent component when content updates
    }
  }, [status, metadata?.pendingEdits]);

  useEffect(() => {
    if (editor && htmlContent) {
      const currentContent = editor.getHTML();

      // Only set content if not processing edits
      if (
        status === "streaming" &&
        (!metadata?.pendingEdits || metadata.pendingEdits.length === 0) &&
        currentContent !== htmlContent
      ) {
        editor.commands.setContent(htmlContent);
      } else if (
        status === "idle" &&
        currentContent !== htmlContent &&
        (!metadata?.pendingEdits || metadata.pendingEdits.length === 0)
      ) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [htmlContent, status, editor, metadata?.pendingEdits]);

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
      <TiptapToolbar editor={editor} />
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
