import { LoaderIcon } from "./icons";
import cn from "classnames";
import { SliderArtifactMetadata } from "@/artifacts/slider/client";

interface ImageEditorProps {
  status: string;
  isInline: boolean;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  metadata: SliderArtifactMetadata;
}
import { Slider } from "@/components/ui/slider";
import { Button } from "./ui/button";
import { useState } from "react";

export function SliderView({
  status,
  isInline,
  onSaveContent,
  metadata,
}: ImageEditorProps) {
  const [sliderValue, setSliderValue] = useState(33);

  return (
    <div className={cn("flex flex-row items-center justify-center w-full")}>
      {status === "streaming" ? (
        <div className="flex flex-row gap-4 items-center">
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div>Generating Artifact...</div>
        </div>
      ) : (
        <div className="flex min-h-10 min-w-[200px] items-center mt-10 flex-col gap-4">
          <h1>Pick a range please!</h1>
          <Slider
            defaultValue={[33]}
            max={100}
            step={1}
            value={[sliderValue]}
            onValueChange={(value) => {
              setSliderValue(value[0]);
            }}
            className="hover:cursor-pointer"
          />
          <Button
            className=" w-[80px]"
            onClick={async () => {
              try {
                onSaveContent(`Range selected: ${sliderValue}`, false);
                console.log("Button clicked", sliderValue);
                await fetch(`/api/slider?id=${metadata.documentId}`, {
                  method: "POST",
                  body: JSON.stringify({
                    kind: "slider",
                    range: sliderValue,
                  }),
                });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
