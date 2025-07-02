'use client';

import { useTranslation } from 'react-i18next';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import { ThemeOptions } from '@ai-chat/app/api/models';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CopyIcon } from './icons';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const match = /language-(\w+)/.exec(className || '')?.[1];

  const handleCopy = (text: string) => {
    navigator?.clipboard?.writeText?.(text);
    toast.success('Copied to clipboard!');
  };

  if (!inline && match) {
    const codeThemeStyle =
      resolvedTheme === ThemeOptions.Dark ? oneDark : oneLight;

    return (
      // <div className="not-prose flex flex-col">
      //   <pre
      //     {...props}
      //     className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
      //   >
      //     <code className="whitespace-pre-wrap break-words">{children}</code>
      //   </pre>
      // </div>
      // FIXME: rearrange syntal highlights
      <div className="relative bg-[#14181f]">
        <div className="flex justify-between items-center py-[0.25rem] px-[1rem] bg-[#454d54] rounded-t-lg">
          <span className="font-normal text-base text-white">{match}</span>
          <Button
            data-testid="copy-code-button"
            className="cursor-pointer"
            onClick={() => handleCopy(String(children))}
            variant="outline"
          >
            <CopyIcon />
            {t('markdownRenderer.copyCode')}
          </Button>
        </div>
        <SyntaxHighlighter style={codeThemeStyle} language={match} {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
