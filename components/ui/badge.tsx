import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // YSH variantes específicas
        savings: 
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-inner",
        installation: 
          "border-transparent bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] text-primary-foreground shadow-sm",
        eco: 
          "border-[#4CAF50] bg-[#4CAF50]/10 text-[#388E3C] font-medium",
        status: {
          pending: "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
          progress: "border-blue-400 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          completed: "border-green-400 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        },
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
