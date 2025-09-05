'use client';

import { memo } from 'react';

interface SideChatHeaderProps {
  title: string;
  description: string;
  status?: 'online' | 'offline' | 'busy';
  statusText?: string;
  className?: string;
}

function PureSideChatHeader({
  title,
  description,
  status = 'online',
  statusText,
  className = '',
}: SideChatHeaderProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusText = () => {
    if (statusText) return statusText;
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Online';
    }
  };

  return (
    <div className={`border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-xs text-gray-600">{getStatusText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SideChatHeader = memo(PureSideChatHeader);
