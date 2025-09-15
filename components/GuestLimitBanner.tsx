"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

interface GuestLimitBannerProps {
  readonly used: number;
  readonly max?: number;
}

export function GuestLimitBanner({ used, max = 20 }: GuestLimitBannerProps) {
  useEffect(() => {
    if (used >= max) {
      trackEvent("guest_limit_banner_view", {
        used,
        max,
        ts: new Date().toISOString(),
      });
    }
  }, [used, max]);

  if (used < max) {
    return null;
  }

  const handleUpgradeClick = () => {
    trackEvent("guest_upgrade_click", {
      from: "guest-limit",
      used,
      max,
      ts: new Date().toISOString(),
    });
  };

  return (
    <div
      role="status"
      className="glass yello-stroke p-3 rounded-lg flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-sm">
        Limite diário de convidado atingido ({used}/{max}). Crie uma conta para desbloquear mensagens ilimitadas.
      </p>
      <Link
        href="/register?from=guest-limit"
        className="underline font-medium"
        onClick={handleUpgradeClick}
      >
        Criar conta
      </Link>
    </div>
  );
}
