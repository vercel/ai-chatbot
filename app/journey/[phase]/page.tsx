import { redirect, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { PhaseGuard } from "@/apps/web/lib/journey/guard";
import { useJourneyActions, usePhase } from "@/apps/web/lib/journey/hooks";
import { blueprint } from "@/apps/web/lib/journey/blueprint";
import {
  getPhaseLabel,
  getPhaseRoute,
  journeyMap,
  phaseFromSlug,
  type Phase,
} from "@/apps/web/lib/journey/map";
import SolarPanelComponent, {
  type ISolarPanel,
} from "@/lib/autoview/solar-panel-component";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { NextCTA } from "@/components/ui/NextCTA";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/persona/context";
import { trackEvent } from "@/lib/analytics/events";
import { phases } from "@/apps/web/lib/journey/map";

interface CTAConfig {
  readonly primary?: {
    readonly label: string;
    readonly targetPhase?: Phase;
    readonly href?: string;
  };
  readonly secondary?: {
    readonly label: string;
    readonly targetPhase?: Phase;
    readonly href?: string;
  };
  readonly supportHref?: string;
}

const CTA_CONFIG: Record<Phase, CTAConfig> = {
  Investigation: {
    primary: { label: "Ir para Detecção", targetPhase: "Detection" },
    secondary: { label: "Voltar para início", href: "/" },
    supportHref: "/chat?open=help",
  },
  Detection: {
    primary: { label: "Ir para Análise", targetPhase: "Analysis" },
    secondary: { label: "Reenviar imagens", targetPhase: "Detection" },
    supportHref: "/chat?open=help",
  },
  Analysis: {
    primary: { label: "Ir para Dimensionamento", targetPhase: "Dimensioning" },
    secondary: { label: "Editar dados", targetPhase: "Analysis" },
    supportHref: "/chat?open=help",
  },
  Dimensioning: {
    primary: { label: "Ir para Simulação", targetPhase: "Simulation" },
    secondary: { label: "Ajustar dimensionamento", targetPhase: "Dimensioning" },
    supportHref: "/chat?open=help",
  },
  Simulation: {
    primary: { label: "Ir para Recomendação", targetPhase: "Recommendation" },
    secondary: { label: "Refinar parâmetros", targetPhase: "Dimensioning" },
    supportHref: "/chat?open=help",
  },
  Installation: {
    primary: { label: "Ir para Monitoramento", targetPhase: "Monitoring" },
    secondary: { label: "Revisar simulação", targetPhase: "Simulation" },
    supportHref: "/chat?open=help",
  },
  Monitoring: {
    primary: { label: "Ir para Recomendação", targetPhase: "Recommendation" },
    secondary: { label: "Ver dashboard completo", href: "/monitoring" },
    supportHref: "/chat?open=help",
  },
  Recommendation: {
    primary: { label: "Ir para Gestão de Leads", targetPhase: "LeadMgmt" },
    secondary: { label: "Refinar simulação", targetPhase: "Simulation" },
    supportHref: "/chat?open=help",
  },
  LeadMgmt: {
    primary: { label: "Abrir Monitoramento", href: "/monitoring" },
    secondary: { label: "Voltar para Recomendação", targetPhase: "Recommendation" },
    supportHref: "/chat?open=help",
  },
};

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ phase: string }> }>) {
  const { phase } = await params;
  const normalized = phaseFromSlug(phase);
  if (!normalized) {
    redirect(getPhaseRoute(phases[0]));
  }

  return (
    <PhaseGuard phase={normalized}>
      <PhaseView phase={normalized} />
    </PhaseGuard>
  );
}

function PhaseView({ phase }: { readonly phase: Phase }) {
  "use client";
  const persona = usePersona();
  const router = useRouter();
  const contextPhase = usePhase();
  const { skip, reset } = useJourneyActions();

  useEffect(() => {
    if (contextPhase !== phase) {
      skip(phase);
    }
  }, [contextPhase, phase, skip]);

  useEffect(() => {
    trackEvent("journey_phase_view", {
      persona: persona.mode,
      phase,
      route: getPhaseRoute(phase),
      ts: new Date().toISOString(),
    });
  }, [persona.mode, phase]);

  const cta = CTA_CONFIG[phase];
  const nodes = blueprint[phase] ?? [];

  const samplePanel: ISolarPanel = {
    id: "panel-001",
    model: "SolarMax Pro 400W",
    manufacturer: "SolarTech",
    wattage: 400,
    efficiency: 0.22,
    price: 250,
  };

  const handleNavigate = useCallback(
    (config?: CTAConfig["primary"]) => {
      if (!config) return;
      const destination = config.href ?? (config.targetPhase ? getPhaseRoute(config.targetPhase) : undefined);
      trackEvent("journey_cta_click", {
        persona: persona.mode,
        phase,
        ctaLabel: config.label,
        to: destination,
      });
      if (config.targetPhase) {
        skip(config.targetPhase);
        return;
      }
      if (config.href) {
        router.push(config.href);
      }
    },
    [persona.mode, phase, router, skip],
  );

  const handleSecondary = useCallback(() => {
    if (!cta?.secondary) return;
    const target = cta.secondary;
    const destination = target.href ?? (target.targetPhase ? getPhaseRoute(target.targetPhase) : undefined);
    trackEvent("journey_cta_click", {
      persona: persona.mode,
      phase,
      ctaLabel: target.label,
      to: destination,
    });
    if (target.targetPhase) {
      skip(target.targetPhase);
      return;
    }
    if (target.href) {
      router.push(target.href);
    }
  }, [cta?.secondary, persona.mode, phase, router, skip]);

  const primaryAction = {
    label: cta.primary!.label,
    onClick: () => handleNavigate(cta.primary),
  };

  const secondaryAction = cta.secondary
    ? { label: cta.secondary.label, onClick: handleSecondary }
    : undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jornada", href: "/journey" },
          { label: getPhaseLabel(phase) },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{getPhaseLabel(phase)}</h1>
        <p className="text-sm text-muted-foreground">
          Persona: <strong className="capitalize">{persona.mode}</strong>
        </p>
      </header>

      {nodes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Etapas da jornada</h2>
          <ul className="space-y-2">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-start space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    n.type === "input"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {n.type === "input" ? "Input" : "Output"}
                </span>
                <div>
                  <strong className="text-gray-900">{n.label}:</strong>
                  <span className="text-gray-600 ml-1">{n.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "Dimensioning" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Painel recomendado</h2>
          <SolarPanelComponent panel={samplePanel} />
        </section>
      )}

      <NextCTA primary={primaryAction} secondary={secondaryAction} />

      {cta?.supportHref && (
        <a href={cta.supportHref} className="text-sm underline">
          Precisa de ajuda?
        </a>
      )}

      <div className="flex gap-2 mt-4">
        {journeyMap[phase].next && (
          <Button
            variant="outline"
            onClick={() => handleNavigate({ label: "Ir para próxima fase", targetPhase: journeyMap[phase].next })}
          >
            Avançar rápido
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleNavigate({ label: "Ir para Recomendação", targetPhase: "Recommendation" })}
        >
          Ir para Recomendação
        </Button>
        <Button variant="outline" onClick={reset}>
          Resetar jornada
        </Button>
      </div>
    </div>
  );
}
