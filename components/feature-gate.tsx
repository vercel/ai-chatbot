"use client";

import React from "react";
import { usePersona } from "@/lib/persona/context";

export function FeatureGate({
  permission,
  flag,
  children,
}: {
  permission?: string;
  flag?: string;
  children: React.ReactNode;
}) {
  const { hasPermission, isEnabled } = usePersona();
  if (permission && !hasPermission(permission)) return null;
  if (flag && !isEnabled(flag)) return null;
  return <>{children}</>;
}
