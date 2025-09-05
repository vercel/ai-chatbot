interface Version {
  id: string;
  label: string;
}

interface VersionTimelineProps {
  versions: Version[];
  onSelect?: (v: Version) => void;
  onBranch?: (v: Version) => void;
}

export function VersionTimeline({ versions, onSelect, onBranch }: VersionTimelineProps) {
  return (
    <ol className="p-2 space-y-1 text-sm">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center gap-2">
          <button
            type="button"
            className="underline"
            onClick={() => onSelect?.(v)}
          >
            {v.label}
          </button>
          <button
            type="button"
            className="text-xs"
            onClick={() => onBranch?.(v)}
          >
            branch
          </button>
        </li>
      ))}
    </ol>
  );
}
