"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-cornsilk-400 focus-within:ring-offset-2",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-hunter_green-800 transition peer-checked:bg-hunter_green-600",
            "after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-cornsilk-200 after:transition-all peer-checked:after:translate-x-5"
          )}
        />
        {label && <span className="sr-only">{label}</span>}
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }