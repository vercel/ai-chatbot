'use client';

import { memo } from 'react';

interface SideChatHeaderProps {
  title: string;
  status?: 'online' | 'offline' | 'busy';
  statusText?: string;
  className?: string;
  onLogout?: () => void;
  artifactTitle?: string;
  sessionStartTime?: string;
}

function PureSideChatHeader({
  title,
  status = 'online',
  statusText,
  className = '',
  onLogout = () => {},
  artifactTitle,
  sessionStartTime,
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
    <div className={`border-b border-gray-200 px-4 py-3 bg-white ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-200">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      <hr className="my-2" />
      <h3 className="text-sm font-semibold text-gray-900">
        {artifactTitle || 'Browser:'}
      </h3>
      <p className="font-mono text-[10px] font-normal text-black">
        {sessionStartTime}
      </p>
    </div>
  );
}

export const SideChatHeader = memo(PureSideChatHeader);
