/** biome-ignore-all lint/nursery/noShadow: <explanation> */
"use client";

import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { EnhancedCodeBlock } from "../enhanced-code-block";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    // Custom component override for code blocks
    const customComponents = {
      pre: ({ children, ...preProps }: any) => {
        // Extract code and language from pre/code structure
        const codeElement = children?.props;
        if (codeElement && typeof codeElement.children === "string") {
          const code = codeElement.children;
          const className = codeElement.className || "";
          const language = className.replace("language-", "") || "text";

          return (
            <EnhancedCodeBlock
              code={code}
              language={language}
              showLineNumbers={false}
            />
          );
        }

        // Fallback for non-code pre elements
        return <pre {...preProps}>{children}</pre>;
      },
    };

    return (
      <Streamdown
        className={cn(
          "size-full max-w-full overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-visible [&_p]:overflow-wrap-anywhere [&_li]:overflow-wrap-anywhere [&_*]:max-w-full [&_ol]:pl-6 [&_ol]:ml-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ul]:list-disc [&_p]:text-inherit",
          className
        )}
        components={customComponents}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
