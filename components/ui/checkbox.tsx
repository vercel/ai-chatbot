"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Simple checkbox implementation without radix
const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);
  
  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    onCheckedChange?.(newChecked);
  };
  
  return (
    <div className={cn("relative", className)}>
      <input
        type="checkbox"
        className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        {...props}
      />
      {isChecked && (
        <CheckIcon className="absolute left-0 top-0 h-4 w-4 text-primary-foreground" />
      )}
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
