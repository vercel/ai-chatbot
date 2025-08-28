'use client';

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
  InlineCitationText,
} from '@/components/elements/inline-citation';

const citation = {
  text: 'The technology continues to evolve rapidly, with new breakthroughs being announced regularly',
  sources: [
    {
      title: 'Advances in Natural Language Processing',
      url: 'https://example.com/nlp-advances',
      description:
        'A comprehensive study on the recent developments in natural language processing technologies and their applications.',
    },
    {
      title: 'Breakthroughs in Machine Learning',
      url: 'https://mlnews.org/breakthroughs',
      description:
        'An overview of the most significant machine learning breakthroughs in the past year.',
    },
    {
      title: 'AI in Healthcare: Current Trends',
      url: 'https://healthai.com/trends',
      description:
        'A report on how artificial intelligence is transforming healthcare and diagnostics.',
    },
    {
      title: 'Ethics of Artificial Intelligence',
      url: 'https://aiethics.org/overview',
      description:
        'A discussion on the ethical considerations and challenges in the development of AI.',
    },
    {
      title: 'Scaling Deep Learning Models',
      url: 'https://deeplearninghub.com/scaling-models',
      description:
        'Insights into the technical challenges and solutions for scaling deep learning architectures.',
    },
    {
      title: 'Natural Language Understanding Benchmarks',
      url: 'https://nlubenchmarks.com/latest',
      description:
        'A summary of the latest benchmarks and evaluation metrics for natural language understanding systems.',
    },
  ],
};

const Example = () => {
  return (
    <p className="text-sm leading-relaxed">
      According to recent studies, artificial intelligence has shown remarkable
      progress in natural language processing.{' '}
      <InlineCitation>
        <InlineCitationText>{citation.text}</InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger
            sources={citation.sources.map((source) => source.url)}
          />
          <InlineCitationCardBody>
            <InlineCitationCarousel>
              <InlineCitationCarouselHeader>
                <InlineCitationCarouselPrev />
                <InlineCitationCarouselNext />
                <InlineCitationCarouselIndex />
              </InlineCitationCarouselHeader>
              <InlineCitationCarouselContent>
                {citation.sources.map((source) => (
                  <InlineCitationCarouselItem key={source.url}>
                    <InlineCitationSource
                      description={source.description}
                      title={source.title}
                      url={source.url}
                    />
                  </InlineCitationCarouselItem>
                ))}
              </InlineCitationCarouselContent>
            </InlineCitationCarousel>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
      .
    </p>
  );
};

export default Example;
