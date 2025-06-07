"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * @name Toggle
 * @description A two-state button that can be either on or off.
 * @version 1.0.1
 * @date 2024-07-12
 * @updated Enhanced 'outline' variant selected state visibility.
 * @see {@link https://ui.shadcn.com/docs/components/toggle shadcn/ui toggle}
 * @license MIT
 *
 * @example
 * <Toggle variant="outline" aria-label="Toggle italic">
 *   <Icons.italic className="size-4" />
 * </Toggle>
 *
 * @public
 *
 * @param {object} props - Component properties.
 * @param {string} [props.variant="default"] - The variant of the toggle.
 * @param {string} [props.size="default"] - The size of the toggle.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {React.Ref<HTMLButtonElement>} ref - React ref.
 * @returns {React.ReactElement} The rendered toggle component.
 *
 * @history
 * - 2024-07-12: Enhanced 'outline' variant selected state visibility. (version 1.0.1)
 * - 2023-XX-XX: Initial release. (version 1.0.0)
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

// END OF: components/ui/toggle.tsx
