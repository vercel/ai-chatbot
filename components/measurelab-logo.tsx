export function MeasurelabLogo({ className = "flex items-center gap-0" }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-foreground font-semibold text-xl tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
        measure
      </span>
      <span className="text-primary font-semibold text-xl tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
        lab
      </span>
    </div>
  );
}