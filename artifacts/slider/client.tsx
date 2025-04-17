import { Artifact } from "@/components/create-artifact";
import { SliderView } from "@/components/slider-view";
import { RedoIcon } from "lucide-react";


export interface SliderArtifactMetadata {
  info: string;
  documentId: string;
}

export const sliderArtifact = new Artifact<"slider", SliderArtifactMetadata>({
  kind: "slider",
  description: "A slider artifact for demonstrating slider functionality.",
  initialize: async ({ documentId, setMetadata }) => {
    console.log("slider opened");
    setMetadata({
      documentId,
      info: "",
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    setMetadata((metadata) => ({
      ...metadata,
      info: streamPart.content as string,
    }));
    if (streamPart.type === "finish") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: "idle",
        isVisible: true,
      }));
    }
  },
  content: ({
    status,
    onSaveContent,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <div>Loading slider artifact...</div>;
    }

    return (
      <SliderView
        onSaveContent={onSaveContent}
        status={status}
        isInline={false}
        metadata={metadata}
      />
    );
  },
  actions: [
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
  ],
  toolbar: [],
});
