"use client";

import { useEffect } from "react";
import { authclient } from "@/lib/auth-client";

export function GuestHandler() {
  useEffect(() => {
    const ensureSession = async () => {
      const session = await authclient.getSession();
      if (!session.data) {
        await authclient.signIn.anonymous();
      }
    };

    ensureSession();
  }, []);

  return null;
}
