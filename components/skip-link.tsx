import type { FC } from 'react';

interface SkipLinkProps {
  readonly mainId: string;
  readonly className?: string;
}

export const SkipLink: FC<SkipLinkProps> = ({ mainId, className = '' }) => {
  return (
    <a href={`#${mainId}`} className={`skip-link ${className}`}>
      Pular para o conteúdo principal
    </a>
  );
};
