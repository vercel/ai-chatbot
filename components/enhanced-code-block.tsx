"use client";

import { PlayIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockCopyButton } from "@/components/elements/code-block";

const getLanguageDisplayName = (lang: string) => {
  const languageMap: Record<string, string> = {
    python: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    java: "Java",
    cpp: "C++",
    c: "C",
    csharp: "C#",
    php: "PHP",
    ruby: "Ruby",
    go: "Go",
    rust: "Rust",
    swift: "Swift",
    kotlin: "Kotlin",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    yaml: "YAML",
    xml: "XML",
    bash: "Bash",
    shell: "Shell",
    powershell: "PowerShell",
  };
  return languageMap[lang.toLowerCase()] || lang.toUpperCase();
};

interface EnhancedCodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

const EnhancedCodeBlock = memo(({
  code,
  language,
  showLineNumbers = false,
}: EnhancedCodeBlockProps) => {
  const { artifact, setArtifact } = useArtifact();
  
  // Create a stable documentId based on code content hash
  const documentId = useMemo(() => {
    // Create a simple hash of the code content
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `local-code-${Math.abs(hash)}-${language}`;
  }, [code, language]);

  const handleRunCode = useCallback(() => {
    if (language === "python") {
      // Check if this is the same code block currently showing
      const isSameCodeBlock = artifact.documentId === documentId;
      
      if (isSameCodeBlock && artifact.isVisible) {
        // If the same code block is already visible, hide it
        setArtifact(prev => ({
          ...prev,
          isVisible: false,
        }));
      } else {
        // Show or create the artifact for this specific code block
        setArtifact({
          title: `Python Code • ${getLanguageDisplayName(language)}`,
          documentId: documentId,
          kind: "code",
          content: code,
          isVisible: true,
          status: "idle",
          boundingBox: {
            top: 0,
            left: 0,
            width: 400,
            height: 300,
          },
        });
      }
    }
  }, [code, language, documentId, artifact.documentId, artifact.isVisible, setArtifact]);

  const isPython = language === "python";
  const isCurrentlyActive = artifact.documentId === documentId && artifact.isVisible;

  return (
    <CodeBlock
      code={code}
      language={language}
      title={getLanguageDisplayName(language)}
      showLineNumbers={showLineNumbers}
    >
      <div className="flex items-center gap-1">
        {isPython && (
          <Button
            onClick={handleRunCode}
            size="sm"
            variant={isCurrentlyActive ? "default" : "ghost"}
            className="h-7 px-2 text-xs"
          >
            <PlayIcon size={12} className="mr-1" />
            {isCurrentlyActive ? "Hide Code" : "Run Code"}
          </Button>
        )}
        <CodeBlockCopyButton className="h-7 w-7" />
      </div>
    </CodeBlock>
  );
});

EnhancedCodeBlock.displayName = "EnhancedCodeBlock";

export { EnhancedCodeBlock };
