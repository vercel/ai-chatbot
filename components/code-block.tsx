'use client';

interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  // Check if we're dealing with inline code
  if (inline) {
    return (
      <code
        className={`${className || ''} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
  
  // For non-inline code blocks, since they're always causing hydration issues in paragraphs,
  // we need to avoid rendering div or pre elements when inside a paragraph
  return (
    <code 
      className="codeblock-wrapper"
      data-code-block="true"
      {...props}
    >
      <span className="text-sm w-full overflow-x-auto block dark:bg-zinc-900 bg-zinc-100 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900 whitespace-pre-wrap break-words relative">
        {children}
        <button 
          onClick={() => {
            navigator.clipboard.writeText(String(children).replace(/\u00A0/g, ' '));
          }}
          className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z" fill="currentColor"/>
          </svg>
        </button>
      </span>
    </code>
  );
}
