import { baseArtifactsPrompt } from './base';
import { textArtifactPrompt } from './text';
import { codeArtifactPrompt } from './code';
import { imageArtifactPrompt } from './image';
import { sheetArtifactPrompt } from './sheet';
import { dashboardArtifactPrompt } from './dashboard';

export { baseArtifactsPrompt } from './base';
export { textArtifactPrompt } from './text';
export { codeArtifactPrompt } from './code';
export { imageArtifactPrompt } from './image';
export { sheetArtifactPrompt } from './sheet';
export { dashboardArtifactPrompt } from './dashboard';

export const artifactsPrompt = [
  baseArtifactsPrompt,
  textArtifactPrompt,
  codeArtifactPrompt,
  imageArtifactPrompt,
  sheetArtifactPrompt,
  dashboardArtifactPrompt
].join('\n\n');