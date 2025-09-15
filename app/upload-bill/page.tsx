"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadBill from "@/apps/web/components/multimodal/UploadBill";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { LoadingState, ErrorState, SuccessState } from "@/components/ui/States";
import { trackEvent } from "@/lib/analytics/events";
import { usePersona } from "@/lib/persona/context";

export default function Page() {
  const router = useRouter();
  const { mode } = usePersona();
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");

  const handleUpload = async () => {
    try {
      setStatus("loading");
      // Real upload logic would go here
      trackEvent("upload_bill_submitted", {
        persona: mode,
        route: "/upload-bill",
        ts: new Date().toISOString(),
      });
      setStatus("success");
      router.push("/journey/analysis");
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState retry={() => setStatus("idle")} />;
  if (status === "success")
    return (
      <SuccessState>
        <NextCTA
          primary={{ label: "Ver análise", href: "/journey/analysis" }}
          secondary={{ label: "Voltar para jornada", href: "/journey" }}
        />
        <a href="/chat?open=help" className="text-sm underline block mt-2">
          Precisa de ajuda?
        </a>
      </SuccessState>
    );

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Upload de Fatura" }]}
      />
      <UploadBill />
      <NextCTA
        primary={{ label: "Enviar", onClick: handleUpload }}
        secondary={{ label: "Voltar para jornada", href: "/journey" }}
      />
      <a href="/chat?open=help" className="text-sm underline">
        Precisa de ajuda?
      </a>
    </div>
  );
}
