// .storybook/preview.tsx
import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// Estilos globais do app para manter tokens, reset e utilitários
import "../app/globals.css";
import "../styles/accessibility.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Acessibilidade: deixa os testes marcados como "todo" na UI,
    // sem falhar o CI automaticamente.
    a11y: {
      test: "todo",
    },

    // Documentação: ativa sumário (ToC) nas páginas Docs.
    docs: {
      toc: true,
    },

    // Paletas de tema expostas no toolbar do Storybook
    themes: {
      default: "light",
      list: [
        { name: "light", class: "light", color: "#ffffff" },
        { name: "dark", class: "dark", color: "#000000" },
      ],
    },
  },

  decorators: [
    // 1) Wrapper com as classes das fontes e tokens do design system
    (Story) => (
      <div
        className={[
          GeistSans.className,
          GeistSans.variable,
          GeistMono.variable,
          // Garante que o fundo e o texto usem seus tokens (globals.css)
          "bg-background text-foreground font-geist min-h-screen",
        ].join(" ")}
      >
        <Story />
      </div>
    ),

    // 2) Alternância de tema por classe (light/dark) aplicada no <html>/<body>
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
