'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface LinkEmbedderProps {
  url: string;
}

interface OEmbedData {
  html?: string;
  title?: string;
  thumbnail_url?: string;
}

export function LinkEmbedder({ url }: LinkEmbedderProps) {
  const [data, setData] = useState<OEmbedData | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(
          `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as OEmbedData;
        if (active) setData(json);
      } catch {
        // ignore network errors
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [url]);

  if (data) {
    if (data.html) {
      let html = DOMPurify.sanitize(data.html);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('iframe').forEach((iframe) => {
        if (!iframe.getAttribute('title') && data.title) {
          iframe.setAttribute('title', data.title);
        }
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      });
      html = doc.body.innerHTML;
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
    if (data.thumbnail_url) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 underline"
        >
          <img
            src={data.thumbnail_url}
            alt={data.title ?? 'Link preview'}
            className="w-16 h-16 object-cover rounded"
          />
          <span className="flex-1 break-words">{data.title ?? url}</span>
        </a>
      );
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline break-words"
    >
      {url}
    </a>
  );
}

export default LinkEmbedder;
