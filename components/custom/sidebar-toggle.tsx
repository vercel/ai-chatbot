import { ComponentProps } from 'react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  return (
    <BetterTooltip content="Toggle Sidebar" align="start">
      <SidebarTrigger
        className={cn(
          'size-10 md:size-8 [&>svg]:!size-5 md:[&>svg]:!size-4',
          className
        )}
      />
    </BetterTooltip>
  );
}
