import type { Meta, StoryObj } from "@storybook/react";
import { YshSandpackPreview } from "./YshSandpackPreview";

const meta: Meta<typeof YshSandpackPreview> = {
  title: "Playground/YshSandpackPreview",
  component: YshSandpackPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof YshSandpackPreview>;

export const Basic: Story = {
  args: {
    template: "react-ts",
    theme: "light",
    options: { editorHeight: 360, showConsole: true },
  },
};

export const Dark: Story = {
  args: {
    template: "react-ts",
    theme: "dark",
    options: { editorHeight: 360, showConsole: true },
  },
};

export const ViteReactTS: Story = {
  args: {
    template: "vite-react-ts",
    theme: "light",
    options: {
      editorHeight: 360,
      showConsole: true,
      externalResources: [],
    },
    files: {
      "/src/App.tsx": `export default function App(){return <h1>Vite + React + TS ⚡</h1>}`,
      "/index.html": `<div id="root"></div>`,
      "/src/main.tsx": `
        import { createRoot } from "react-dom/client";
        import App from "./App";
        createRoot(document.getElementById("root")!).render(<App />);
      `,
      "/tsconfig.json": `{"compilerOptions": {"jsx": "react-jsx"}}`,
    },
  },
};
