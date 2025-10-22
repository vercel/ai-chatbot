"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

type BrandLogoProps = {
  size?: Size;
  className?: string;
};

const sizeMap: Record<Size, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

export function BrandLogo(props: BrandLogoProps) {
  const { size = "md", className } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <span
      className={cn(
        "select-none font-sans font-semibold tracking-tight",
        sizeMap[size],
        mounted ? "scale-100 opacity-100" : "scale-[0.98] opacity-0",
        "transition-all duration-300",
        "bg-clip-text text-transparent",
        "bg-[linear-gradient(90deg,var(--transcarent-blue),var(--transcarent-gold))]",
        className
      )}
      title="Glen AI"
    >
      Glen AI
    </span>
  );
}

export default BrandLogo;
