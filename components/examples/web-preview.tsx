'use client';

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from '@/components/elements/web-preview';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  MousePointerClickIcon,
  RefreshCcwIcon,
} from 'lucide-react';
import { useState } from 'react';

const exampleLogs = [
  {
    level: 'log' as const,
    message: 'Page loaded successfully',
    timestamp: new Date(Date.now() - 10_000),
  },
  {
    level: 'warn' as const,
    message: 'Deprecated API usage detected',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    level: 'error' as const,
    message: 'Failed to load resource',
    timestamp: new Date(),
  },
];

const code = [
  {
    language: 'jsx',
    filename: 'MyComponent.jsx',
    code: `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`,
  },
];

const Example = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <WebPreview
      defaultUrl="/"
      onUrlChange={(url) => console.log('URL changed to:', url)}
      style={{ height: '400px' }}
    >
      <WebPreviewNavigation>
        <WebPreviewNavigationButton
          onClick={() => console.log('Go back')}
          tooltip="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          onClick={() => console.log('Go forward')}
          tooltip="Go forward"
        >
          <ArrowRightIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          onClick={() => console.log('Reload')}
          tooltip="Reload"
        >
          <RefreshCcwIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewUrl />
        <WebPreviewNavigationButton
          onClick={() => console.log('Select')}
          tooltip="Select"
        >
          <MousePointerClickIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          onClick={() => console.log('Open in new tab')}
          tooltip="Open in new tab"
        >
          <ExternalLinkIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          onClick={() => setFullscreen(!fullscreen)}
          tooltip="Maximize"
        >
          <Maximize2Icon className="size-4" />
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>

      <WebPreviewBody src="https://preview-v0me-kzml7zc6fkcvbyhzrf47.vusercontent.net/" />

      <WebPreviewConsole logs={exampleLogs} />
    </WebPreview>
  );
};

export default Example;
