import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import { CopyIcon, MessageIcon, RedoIcon, UndoIcon } from "@/components/icons";
import { MarkdownEditor } from "@/components/markdown-editor";

export const markdownArtifact = new Artifact<"markdown">({
  kind: "markdown",
  description:
    "Useful for creating legal documents such as petitions, powers of attorney, and other legal documents in markdown format.",
  initialize: () => {
    // No metadata needed for markdown artifacts
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-markdownDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.data,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 400 &&
          draftArtifact.content.length < 450
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  content: ({ ...props }) => {
    return (
      <div className="px-1">
        <MarkdownEditor {...props} />
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Improve document",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please improve this legal document, check for grammar, ensure proper legal terminology, and make it more professional.",
            },
          ],
        });
      },
    },
  ],
});
