"use client";

import { PlayIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockCopyButton } from "@/components/elements/code-block";

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
  const { setArtifact } = useArtifact();

  const handleRunCode = useCallback(() => {
    if (language === "python") {
      // Create or show artifact for Python code execution
      setArtifact({
        title: "Python Code Execution",
        documentId: `code-${Date.now()}`,
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
  }, [code, language, setArtifact]);

  const isPython = language === "python";

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
            variant="ghost"
            className="h-7 px-2 text-xs"
          >
            <PlayIcon size={12} className="mr-1" />
            Run Code
          </Button>
        )}
        <CodeBlockCopyButton className="h-7 w-7" />
      </div>
    </CodeBlock>
  );
});

EnhancedCodeBlock.displayName = "EnhancedCodeBlock";

export { EnhancedCodeBlock };
