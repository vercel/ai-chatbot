'use client';

import { useState } from 'react';
import { Card } from '@/apps/web/components/canvas/Card';
import {
  VersionTimeline,
  type Version,
} from '@/apps/web/components/canvas/VersionTimeline';

export default function Page() {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: 'v1',
      timestamp: new Date().toISOString(),
      author: 'tester',
      note: 'v1',
      data: { value: 1 },
    },
  ]);
  const [current, setCurrent] = useState('v1');

  const addVersion = () => {
    const id = `v${versions.length + 1}`;
    const v: Version = {
      id,
      timestamp: new Date().toISOString(),
      author: 'tester',
      note: id,
      data: { value: versions.length + 1 },
    };
    setVersions([v, ...versions]);
    setCurrent(id);
  };

  const handleRestore = (v: Version) => {
    setCurrent(v.id);
  };

  const handleBranch = (v: Version) => {
    const id = `${v.id}-b`;
    const branch: Version = {
      id,
      timestamp: new Date().toISOString(),
      author: 'tester',
      note: id,
      data: { ...v.data, branched: true },
    };
    setVersions([branch, ...versions]);
    setCurrent(id);
  };

  return (
    <div className="p-4 space-y-2">
      <button id="create-version" onClick={addVersion}>
        Create
      </button>
      <div data-testid="current-version">{current}</div>
      <Card id="card1" title="Card">
        <VersionTimeline
          versions={versions}
          current={current}
          onRestore={handleRestore}
          onBranch={handleBranch}
        />
      </Card>
    </div>
  );
}

