import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteTransition from "@/components/RouteTransition";
import DemoLayoutClient from "@/components/DemoLayoutClient";

export const metadata: Metadata = {
  title: {
    template: "%s | Glen AI",
    default: "Demo | Glen AI",
  },
  description: "Glen AI - healthcare leadership AI assistant",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoLayoutClient>{children}</DemoLayoutClient>;
}
