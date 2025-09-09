import { cn } from '@/lib/utils';

import { BackButton } from '@/components/auth/back-button';
import { baseUrl } from '@/lib/constants';

interface CardWrapperProps {
  children: React.ReactNode;
  backButtonLabel: string;
  backButtonLinkLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  showCredentials?: boolean;
  className?: string;
}

export const CardWrapper = async ({
  children,
  backButtonLabel,
  backButtonLinkLabel,
  backButtonHref,
  className,
}: CardWrapperProps) => {
  return (
    <div className={cn('grid gap-6', className)}>
      {children}

      <BackButton
        label={backButtonLabel}
        linkLabel={backButtonLinkLabel}
        href={backButtonHref}
      />
    </div>
  );
};
