interface CardToolbarProps {
  onRecalculate?: () => void;
  onDuplicate?: () => void;
  onExport?: (format: 'png' | 'pdf' | 'json' | 'csv') => void;
}

const formats: Array<'png' | 'pdf' | 'json' | 'csv'> = [
  'png',
  'pdf',
  'json',
  'csv',
];

export function CardToolbar({ onRecalculate, onDuplicate, onExport }: CardToolbarProps) {
  return (
    <div className="flex justify-end gap-2 p-2 border-t bg-gray-50 text-xs">
      <button type="button" onClick={onRecalculate}>
        Recalcular
      </button>
      <button type="button" onClick={onDuplicate}>
        Duplicar
      </button>
      <div className="relative">
        <span>Export</span>
        <div className="absolute right-0 bg-white border rounded shadow-md">
          {formats.map((fmt) => (
            <button
              key={fmt}
              type="button"
              className="block px-2 py-1 w-full text-left"
              onClick={() => onExport?.(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
