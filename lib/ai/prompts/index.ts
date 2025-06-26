// Main prompt exports
export { artifactsPrompt } from './artifacts';
export { chartPrompt } from './chart';
export { codePrompt } from './code';
export { dashboardPrompt } from './dashboard';
export { sheetPrompt } from './sheet';

// System prompt utilities
export {
  regularPrompt,
  systemPrompt,
  updateDocumentPrompt,
  getRequestPromptFromHints,
  type RequestHints,
} from './system';
