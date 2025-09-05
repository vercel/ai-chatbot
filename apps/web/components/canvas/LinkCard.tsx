import { sanitizeUrl } from '@/apps/web/lib/chat/links';

export function LinkCard({ url }: { url: string }) {
  const safe = sanitizeUrl(url);
  if (!safe) return null;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline break-all"
    >
      {safe}
    </a>
  );
}
