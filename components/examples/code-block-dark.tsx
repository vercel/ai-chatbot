'use client';

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/elements/code-block';

const code = `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`;

const Example = () => (
  <div className="dark">
    <CodeBlock code={code} language="jsx">
      <CodeBlockCopyButton
        onCopy={() => console.log('Copied code to clipboard')}
        onError={() => console.error('Failed to copy code to clipboard')}
      />
    </CodeBlock>
  </div>
);

export default Example;
