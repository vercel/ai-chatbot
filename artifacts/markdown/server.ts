import { smoothStream, streamObject, streamText } from "ai";
import { z } from "zod";
import { markdownPrompt, updateMarkdownDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const markdownDocumentHandler = createDocumentHandler<"markdown">({
  kind: "markdown",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.languageModel("artifact-model"),
      system: markdownPrompt,
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: "data-markdownDelta",
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const editSchema = z.object({
      edits: z
        .array(
          z.object({
            from: z
              .number()
              .describe(
                "Character position where the edit starts (0-based index). Example: If the text '[Número do Processo]' starts at position 57, from should be 57."
              ),
            to: z
              .number()
              .describe(
                "Character position where the edit ends (exclusive, 0-based index). Example: If '[Número do Processo]' ends at position 76, to should be 76. This position should be AFTER the last character of oldText."
              ),
            oldText: z
              .string()
              .describe(
                "The EXACT text that will be replaced, including ALL characters (brackets, parentheses, quotes, spaces, etc.). Example: If the document contains '[Número do Processo]', oldText must be '[Número do Processo]' (with brackets), NOT 'Número do Processo' (without brackets). This must match the document text at positions from/to character by character."
              ),
            newText: z
              .string()
              .describe(
                "The complete new text that will replace the old text. This must be a complete, non-empty string. Example: If replacing '[Número do Processo]' with '99887766', newText should be '99887766' (without brackets, unless brackets are part of the new value)."
              ),
          })
        )
        .describe(
          "Array of edits to apply to the document. Each edit must have oldText that exactly matches the document text at the specified positions."
        ),
    });

    let finalContent = document.content || "";

    const { fullStream, object } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: updateMarkdownDocumentPrompt(document.content),
      prompt: `User request: ${description}

Analyze the current document and identify ONLY the specific parts that need to be changed. Return structured edit instructions with character positions.

CRITICAL INSTRUCTIONS FOR TEXT IDENTIFICATION:
1. The oldText field MUST include ALL characters that will be replaced, including brackets [ ], parentheses ( ), quotes " ", spaces, and any other formatting characters
2. Before returning, verify that oldText matches EXACTLY the text in the document at positions from/to, character by character
3. If the text contains brackets like [text], the oldText MUST include those brackets: [text]
4. Double-check that you haven't cut off any characters, especially closing brackets, parentheses, or quotes

IMPORTANT: For each edit:
- The newText field MUST contain the complete replacement text. Do not leave it empty.
- The oldText field MUST contain the EXACT text from the document, including all formatting characters.
- Verify that oldText matches the document text at positions from/to before returning.`,
      schema: editSchema,
    });

    // Accumulate the complete object by processing all deltas
    let accumulatedObject: z.infer<typeof editSchema> | null = null;
    for await (const delta of fullStream) {
      if (delta.type === "object") {
        // Update accumulated object with latest delta
        // The object in each delta is the complete object so far
        accumulatedObject = delta.object as z.infer<typeof editSchema>;
      }
    }

    // Use the final accumulated object (it should be complete after the stream ends)
    // If for some reason it's null, try to get it from the object property
    let finalObject: z.infer<typeof editSchema> | null = accumulatedObject;
    if (!finalObject) {
      finalObject =
        typeof object === "object" && "then" in object
          ? await object
          : (object as z.infer<typeof editSchema>);
    }

    // Process the complete object after stream finishes
    const edits: Array<{
      from: number;
      to: number;
      oldText: string;
      newText: string;
    }> = [];

    if (finalObject?.edits && Array.isArray(finalObject.edits)) {
      for (const edit of finalObject.edits) {
        // Validate that edit has all required properties
        if (
          edit &&
          typeof edit.from === "number" &&
          typeof edit.to === "number" &&
          typeof edit.oldText === "string" &&
          typeof edit.newText === "string" &&
          edit.newText.trim().length > 0
        ) {
          const validEdit = {
            from: edit.from,
            to: edit.to,
            oldText: edit.oldText,
            newText: edit.newText,
          };
          edits.push(validEdit);

          // Log for debugging
          console.log("Processing edit:", {
            from: validEdit.from,
            to: validEdit.to,
            oldTextLength: validEdit.oldText.length,
            newTextLength: validEdit.newText.length,
            newTextPreview: validEdit.newText.substring(0, 50),
          });

          dataStream.write({
            type: "data-markdownEdit",
            data: validEdit,
            transient: true,
          });
        } else {
          console.warn("Skipping invalid edit:", edit);
        }
      }
    }

    // Apply edits in reverse order to maintain correct positions
    const sortedEdits = [...edits].sort((a, b) => b.from - a.from);
    for (const edit of sortedEdits) {
      const before = finalContent.slice(0, edit.from);
      const after = finalContent.slice(edit.to);
      finalContent = before + edit.newText + after;
    }

    return finalContent;
  },
});
