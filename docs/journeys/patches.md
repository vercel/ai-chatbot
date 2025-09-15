# Patches aplicados

## CTA dinâmico e breadcrumbs das fases
```tsx
// app/journey/[phase]/page.tsx
<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Jornada", href: "/journey" }, { label: getPhaseLabel(phase) }]} />
<NextCTA
  primary={{ label: cta.primary!.label, onClick: () => handleNavigate(cta.primary) }}
  secondary={cta.secondary ? { label: cta.secondary.label, onClick: handleSecondary } : undefined }
/>
```

## Análise com métricas e CTA canônico
```tsx
// app/journey/analysis/page.tsx
useEffect(() => {
  trackEvent("analysis_ready_view", { persona: mode, route: getPhaseRoute("Analysis"), ts: new Date().toISOString() });
}, [analysisResult, mode]);
<NextCTA
  primary={{ label: "Ir para Dimensionamento", onClick: handleProceed }}
  secondary={{ label: "Editar dados", onClick: handleNewAnalysis }}
/>
```

## Banner de limite para convidados
```tsx
// components/GuestLimitBanner.tsx
if (used >= max) {
  trackEvent("guest_limit_banner_view", { used, max, ts: new Date().toISOString() });
  return (
    <div role="status" className="glass yello-stroke p-3 rounded-lg">
      <p className="text-sm">Limite diário de convidado atingido ({used}/{max}).</p>
      <Link href="/register?from=guest-limit" onClick={handleUpgradeClick} className="underline font-medium">
        Criar conta
      </Link>
    </div>
  );
}
```

## Upload com telemetria
```tsx
// app/upload-bill/page.tsx
trackEvent("upload_bill_submitted", {
  persona: mode,
  route: "/upload-bill",
  ts: new Date().toISOString(),
});
router.push("/journey/analysis");
```
