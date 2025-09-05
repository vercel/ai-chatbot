import React, { useState, useRef } from 'react';
import { z } from 'zod';

// Schema for a STAC asset
export const stacAssetSchema = z.object({
  id: z.string(),
  href: z.string().url(),
  type: z.string(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  provider: z.string(),
  preview: z.string().url().optional(),
});

export type STACAsset = z.infer<typeof stacAssetSchema>;

// Example assets used as default mock data
export const mockAssets: STACAsset[] = [
  {
    id: 'sentinel-1',
    href: 'https://example.com/sentinel-1.tif',
    type: 'image/tiff',
    bbox: [-10, -10, 10, 10],
    provider: 'Sentinel',
    preview: 'https://via.placeholder.com/100x100.png?text=Sentinel',
  },
  {
    id: 'landsat-1',
    href: 'https://example.com/landsat-1.tif',
    type: 'image/tiff',
    bbox: [-20, -20, 20, 20],
    provider: 'Landsat',
    preview: 'https://via.placeholder.com/100x100.png?text=Landsat',
  },
  {
    id: 'sentinel-2',
    href: 'https://example.com/sentinel-2.tif',
    type: 'image/tiff',
    bbox: [-5, -5, 5, 5],
    provider: 'Sentinel',
  },
];

export interface STACAssetViewerProps {
  assets?: STACAsset[];
  pageSize?: number;
}

// Component to display STAC assets with pagination and export capabilities
export const STACAssetViewer: React.FC<STACAssetViewerProps> = ({
  assets = mockAssets,
  pageSize = 5,
}) => {
  const data = z.array(stacAssetSchema).parse(assets);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const start = (page - 1) * pageSize;
  const current = data.slice(start, start + pageSize);
  const tableRef = useRef<HTMLTableElement>(null);

  const copyHref = async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // ignore clipboard errors
    }
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'stac-assets.json';
    link.href = url;
    link.click();
  };

  return (
    <div className="p-4">
      <table ref={tableRef} className="w-full text-sm" aria-label="STAC assets">
        <caption className="sr-only">List of STAC assets</caption>
        <thead>
          <tr>
            <th scope="col">Preview</th>
            <th scope="col">Href</th>
            <th scope="col">Type</th>
            <th scope="col">BBox</th>
            <th scope="col">Provider</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {current.map((asset) => (
            <tr key={asset.id} className="border-t">
              <td className="p-2">
                {asset.preview && asset.type.startsWith('image') ? (
                  <img
                    src={asset.preview}
                    alt={asset.id}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <span className="text-gray-500">No preview</span>
                )}
              </td>
              <td className="p-2 break-all">
                <a
                  href={asset.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {asset.href}
                </a>
              </td>
              <td className="p-2">{asset.type}</td>
              <td className="p-2 font-semibold">
                {asset.bbox.join(', ')}
              </td>
              <td className="p-2 font-semibold">{asset.provider}</td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => copyHref(asset.href)}
                  className="px-2 py-1 border rounded"
                  aria-label="Copy asset href"
                >
                  Copy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 border rounded"
        >
          Prev
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-2 py-1 border rounded"
        >
          Next
        </button>
        <button
          type="button"
          onClick={exportAsJSON}
          className="px-2 py-1 border rounded ml-auto"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
};

export default STACAssetViewer;

