'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/reports?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium" htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          className="border rounded px-3 py-1 text-sm"
          value={searchParams.get('status') || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="requires_more_info">Requires More Info</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium" htmlFor="priority-filter">Priority:</label>
        <select
          id="priority-filter"
          className="border rounded px-3 py-1 text-sm"
          value={searchParams.get('priority') || ''}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          <option value="">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );
}