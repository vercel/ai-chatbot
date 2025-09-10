import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // YSH variantes específicas
        savings:
          'border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-inner',
        installation:
          'border-transparent bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] text-primary-foreground shadow-sm',
        eco: 'border-[#4CAF50] bg-[#4CAF50]/10 text-[#388E3C] font-medium',
        status: {
          pending:
            'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          progress:
            'border-blue-400 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          completed:
            'border-green-400 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          'installation-pending':
            'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-600',
          'installation-progress':
            'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600',
          'installation-complete':
            'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600',
          'maintenance-due':
            'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-600',
          'warranty-active':
            'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-600',
        },
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
