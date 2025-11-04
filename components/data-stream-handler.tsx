"use client";

import { useEffect, useRef } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    // Track kind changes within this batch so subsequent deltas use the new artifact immediately
    let batchKind = artifact.kind;

    for (const delta of newDeltas) {
      const effectiveKind = delta.type === "data-kind" ? delta.data : batchKind;
      // We no longer handle image artifact streams here (images render inline in chat)
      const artifactDefinition = effectiveKind === "image"
        ? undefined
        : artifactDefinitions.find(
            (currentArtifactDefinition) =>
              currentArtifactDefinition.kind === effectiveKind
          );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: "streaming",
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data,
              status: "streaming",
            };

          case "data-kind": {
            // Do not switch to image kind; keep artifact hidden for images
            batchKind = delta.data as any;
            const nextKind = delta.data === "image" ? draftArtifact.kind : (delta.data as any);
            return {
              ...draftArtifact,
              kind: nextKind,
              status: "streaming",
            };
          }

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "data-finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          default:
            return draftArtifact;
        }
      });
    }
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
