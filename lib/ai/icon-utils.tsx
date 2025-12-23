"use client";

import {
  Brain,
  Clock,
  DollarSign,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

export function getIconComponent(
  iconType: string | undefined,
  className = "h-4 w-4"
): React.ReactNode {
  switch (iconType) {
    case "zap":
      return <Zap className={className} />;
    case "brain":
      return <Brain className={className} />;
    case "star":
      return <Star className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "clock":
      return <Clock className={className} />;
    case "dollar":
      return <DollarSign className={className} />;
    default:
      return null;
  }
}
