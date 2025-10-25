"use client";

import { useEffect } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import type { Document } from "@/lib/db/schema";

interface ArtifactTriggerProps {
  result: Document;
}

export function ArtifactTrigger({ result }: ArtifactTriggerProps) {
  const { setArtifact } = useArtifact();

  useEffect(() => {
    // Prepare artifact data but don't make it visible yet
    // User will need to click "Run Code" to actually show it
    setArtifact((artifact) => ({
      ...artifact,
      title: result.title,
      documentId: result.id,
      kind: result.kind,
      isVisible: false, // Keep hidden until user clicks Run Code
      boundingBox: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
    }));
  }, [result, setArtifact]);

  // Render nothing - this component just prepares artifact data
  return null;
}
