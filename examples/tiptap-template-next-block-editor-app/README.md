# Next BlockEditor App

## Usage Guidelines

The BlockEditor template is a fully functional Next.js application, akin to Notion or Dropbox Paper, suitable as a
foundation for your projects or as a base for a custom editor.

Key features of the template include:

- A Next.js setup with TypeScript
- A basic Tailwind setup for styling
- Pre-configured links to Tiptap Cloud for collaboration and data persistence.
- A Block Editor with a basic set of nodes and marks but also more advanced features like
  - Drag & Drop via a DragHandle
  - A fleshed out menu bar for text editing and formatting
  - Link editing
  - mocked image uploading that can be hooked up to your backend

You can either start a fresh project from this editor or copy over the editor or parts you need to your own projects.
Make sure to check out the [Tiptap documentation](https://tiptap.dev) for more information on how to use Tiptap.

> [!Important]
> Do note that these templates are free to access only for evaluation purposes. If you wish to use Tiptap's paid features, you will need to comply with the [Tiptap Pro License](https://tiptap.dev/pro-license). To summarize, you can use the Tiptap Pro extensions for free in development or for personal reasons, but you will need to purchase a license to use them in production or commercially.
> All code in this repository is licensed under the [Tiptap Pro License](https://tiptap.dev/pro-license) and may not be be distributed or used in production without a valid license.

## Folder structure

The template is structured as a Next.js app with a few additional folders and files:

- **components** Includes all React components used in the app
  - **BlockEditor** the wrapping BlockEditor setup component
  - **menus** a set of menus used in the editor (for example Link, Text and DragHandle menus)
  - **panels** popover menus used in menu bars for example the Colorpicker or Link editor
  - **Sidebar** the sidebar component
  - **TableOfContents** the table of contents component used for navigation
  - **ui** general reusable UI components used across the application
- **context** A place to put React contexts that are used in the app
- **extensions** Includes all Tiptap extensions used in the app including their NodeViews and logic parts
- **hooks** Including general hooks used for app and editor setup
- **lib** Includes helper functions
- **styles** Includes global CSS styles with Tailwind to setup richtext styling
