import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

const baseButtonClasses = [
  "inline-flex",
  "items-center",
  "justify-center",
  "gap-2",
  "whitespace-nowrap",
  "text-sm",
  "font-medium",
  "rounded-md",
  "transition-all",
  "duration-200",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-ring",
  "hover:brightness-110",
  "active:brightness-95",
  "disabled:pointer-events-none",
  "disabled:opacity-50",
  "[&_svg]:size-4",
  "[&_svg]:shrink-0",
  "[&_svg]:pointer-events-none",
].join(" ");

const buttonVariants = cva(baseButtonClasses, {
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: ["h-10", "px-4", "py-2"].join(" "),
      sm: ["h-9", "rounded-md", "px-3"].join(" "),
      lg: ["h-11", "rounded-md", "px-8"].join(" "),
      xl: ["h-14", "rounded-xl", "px-10", "text-lg"].join(" "),
      icon: ["h-10", "w-10"].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
