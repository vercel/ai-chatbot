'use client';

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/elements/source';

const sources = [
  { href: 'https://stripe.com/docs/api', title: 'Stripe API Documentation' },
  { href: 'https://docs.github.com/en/rest', title: 'GitHub REST API' },
  {
    href: 'https://docs.aws.amazon.com/sdk-for-javascript/',
    title: 'AWS SDK for JavaScript',
  },
];

const Example = () => (
  <div style={{ height: '110px' }}>
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source href={source.href} key={source.href} title={source.title} />
        ))}
      </SourcesContent>
    </Sources>
  </div>
);

export default Example;
