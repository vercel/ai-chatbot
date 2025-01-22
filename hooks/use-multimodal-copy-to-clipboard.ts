import { useCopyToClipboard } from 'usehooks-ts';

async function copyImageToClipboard(base64String: string) {
  try {
    const blob = await fetch(`data:image/png;base64,${base64String}`).then(
      (res) => res.blob(),
    );

    const item = new ClipboardItem({
      'image/png': blob,
    });

    await navigator.clipboard.write([item]);
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
  }
}

export function useMultimodalCopyToClipboard() {
  const [_, copyTextToClipboard] = useCopyToClipboard();
  return { copyTextToClipboard, copyImageToClipboard };
}
