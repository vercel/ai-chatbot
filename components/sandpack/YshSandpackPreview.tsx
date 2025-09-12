'use client';

import React from "react";
import {
  Sandpack,
  SandpackCodeEditor,
  SandpackPreview as SandpackPreviewCanvas,
  SandpackLayout,
  SandpackConsole,
} from "@codesandbox/sandpack-react";
import { githubLight, dracula } from "@codesandbox/sandpack-themes";
import "@codesandbox/sandpack-react/dist/index.css";

export type YshSandpackPreviewProps = {
  template?: "react" | "react-ts" | "vanilla" | "vanilla-ts" | "vite-react" | "vite-react-ts";
  files?: Record<string, string>;
  theme?: "light" | "dark";
  options?: {
    showConsole?: boolean;
    editorHeight?: number;
    showNavigator?: boolean;
    externalResources?: string[];
  };
};

export const YshSandpackPreview: React.FC<YshSandpackPreviewProps> = ({
  template = "react-ts",
  files,
  theme = "light",
  options,
}) => {
  const finalTheme = theme === "dark" ? dracula : githubLight;
  const editorHeight = options?.editorHeight ?? 360;
  const showConsole = options?.showConsole ?? true;

  return (
    <Sandpack
      template={template}
      theme={finalTheme}
      files={
        files ?? {
          "/App.tsx": `export default function App(){return <h1>Hello Sandpack 👋</h1>}`,
          "/index.tsx": `
            import { createRoot } from "react-dom/client";
            import App from "./App";
            const root = createRoot(document.getElementById("root")!);
            root.render(<App />);
          `,
          "/index.html": `<div id="root"></div>`,
          "/tsconfig.json": `{"compilerOptions": {"jsx": "react-jsx"}}`,
        }
      }
      options={{
        externalResources: options?.externalResources,
        showNavigator: options?.showNavigator ?? false,
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor style={{ height: editorHeight }} showTabs showLineNumbers />
        <SandpackPreviewCanvas />
      </SandpackLayout>
      {showConsole && <SandpackConsole style={{ height: 160 }} />}
    </Sandpack>
  );
};

