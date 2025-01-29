import { Block } from "@/components/create-block";
import { MessageIcon, SparklesIcon } from "@/components/icons";
import { SpreadsheetEditor } from "@/components/sheet-editor";
import { exportToCSV } from "@/lib/spreadsheet";
import { toast } from "sonner";

interface Metadata {}

export const sheetBlock = new Block<"sheet", Metadata>({
  kind: "sheet",
  description: "Useful for working with spreadsheets",
  initialize: async () => {},
  onStreamPart: ({ setBlock, streamPart }) => {
    if (streamPart.type === "suggestion") {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: streamPart.content as string,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    status,
  }) => {
    return (
      <SpreadsheetEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={onSaveContent}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <SparklesIcon />,
      description: "Export",
      onClick: ({ content }) => {
        try {
          exportToCSV(content);
          toast.success("CSV file downloaded!");
        } catch (error) {
          console.error(error);
          toast.error("Failed to export CSV");
        }
      },
    },
  ],
  toolbar: [
    {
      onClick: () => {},
      description: "Format and clean data",
      icon: <SparklesIcon />,
    },
    {
      onClick: () => {},
      description: "Analyze and visualize data",
      icon: <MessageIcon />,
    },
  ],
});
