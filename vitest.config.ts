import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup-tests.ts"],
    css: true,
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/storybook-static/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@codesandbox/sandpack-react/dist/index.css": path.resolve(
        __dirname,
        "test/__mocks__/sandpack.css"
      ),
    },
  },
});
