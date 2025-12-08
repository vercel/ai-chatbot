/**
 * Application configuration
 *
 * This file contains all configurable metadata and settings for the application.
 * Modify these values to customize your application's metadata.
 */

export const appConfig = {
  metadata: {
    /**
     * The base URL for your application.
     * Used for generating absolute URLs in metadata.
     *
     * Examples:
     * - Production: "https://yourdomain.com"
     * - Development: "http://localhost:3000"
     * - Vercel: "https://your-app.vercel.app"
     */
    baseUrl:
      process.env.NEXT_PUBLIC_APP_URL || "https://data360chat.worldbank.org",

    /**
     * The title of your application.
     * This appears in:
     * - Browser tab title
     * - Search engine results
     * - Social media shares (if not overridden)
     */
    title: "Data360 Chat",

    /**
     * A brief description of your application.
     * This appears in:
     * - Search engine results
     * - Social media shares (if not overridden)
     * - Browser bookmarks
     */
    description:
      "Data360 Chat is a chatbot that uses the Data360 MCP tools to answer questions about the Data360 dataset.",
  },
  /**
   * Application display name shown in the UI.
   * This appears in:
   * - Sidebar header
   * - Navigation elements
   * - Other UI components that display the app name
   */
  sidebar: {
    appName: "Data360 Chat",
  },
} as const;
