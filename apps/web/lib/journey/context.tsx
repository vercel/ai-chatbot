'use client';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { phases, journeyMap, type Phase, getPhaseRoute } from './map';

interface Telemetry {
  start: number;
  end?: number;
  errors: string[];
}

interface JourneyContextValue {
  phase: Phase;
  telemetry: Record<Phase, Telemetry>;
  next: () => void;
  prev: () => void;
  skip: (p: Phase) => void;
  reset: () => void;
}

export const JourneyContext = createContext<JourneyContextValue | undefined>(
  undefined,
);

export function JourneyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>(phases[0]);
  const router = useRouter();

  const createInitialTelemetry = (): Record<Phase, Telemetry> => {
    const initial: Record<Phase, Telemetry> = {} as Record<Phase, Telemetry>;
    phases.forEach((p) => {
      initial[p] = { start: 0, errors: [] };
    });
    return initial;
  };

  const telemetryRef = useRef<Record<Phase, Telemetry>>(createInitialTelemetry());

  const preloadPhase = async (p: Phase) => {
    const { cards, viewers } = journeyMap[p];
    for (const asset of [...cards, ...viewers]) {
      try {
        // dynamic import using data URL to simulate preloading
        // @ts-ignore
        await import(`data:text/javascript,export default "${asset}"`);
      } catch (e) {
        telemetryRef.current[p].errors.push(String(e));
      }
    }
  };

  const navigateToPhase = useCallback(
    (target: Phase) => {
      const href = getPhaseRoute(target);
      if (!href) return;
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== href) {
          router.push(href);
        }
      } else {
        router.push(href);
      }
    },
    [router],
  );

  useEffect(() => {
    const t = telemetryRef.current;
    const now = Date.now();
    if (!t[phase].start) t[phase].start = now;
    preloadPhase(phase);
    // expose for tests
    // @ts-ignore
    window.__journey = { phase, telemetry: t };
  }, [phase]);

  const transition = useCallback(
    (target: Phase) => {
      const t = telemetryRef.current;
      const now = Date.now();
      t[phase].end = now;
      if (!t[target].start) t[target].start = now;
      setPhase(target);
      navigateToPhase(target);
    },
    [phase, navigateToPhase],
  );

  const next = useCallback(() => {
    const nextPhase = journeyMap[phase].next;
    if (nextPhase) transition(nextPhase);
  }, [phase, transition]);

  const prev = useCallback(() => {
    const prevPhase = journeyMap[phase].prev;
    if (prevPhase) transition(prevPhase);
  }, [phase, transition]);

  const skip = useCallback((p: Phase) => {
    if (phases.includes(p)) transition(p);
  }, [transition]);

  const reset = useCallback(() => {
    telemetryRef.current = createInitialTelemetry();
    setPhase(phases[0]);
    navigateToPhase(phases[0]);
  }, [navigateToPhase]);

  const contextValue = useMemo(
    () => ({ phase, telemetry: telemetryRef.current, next, prev, skip, reset }),
    [phase, next, prev, skip, reset],
  );

  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
}
