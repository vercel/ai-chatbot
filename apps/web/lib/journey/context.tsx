'use client';
import { createContext, useEffect, useRef, useState } from 'react';
import { phases, journeyMap, type Phase } from './map';

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

  const telemetryRef = useRef<Record<Phase, Telemetry>>(
    Object.fromEntries(phases.map((p) => [p, { start: 0, errors: [] }])) as Record<
      Phase,
      Telemetry
    >,
  );

  const preloadPhase = async (p: Phase) => {
  const { cards, viewers } = journeyMap[p];
  for (const asset of [...cards, ...viewers]) {
    try {
      // dynamic import using data URL to simulate preloading
      // @ts-ignore
      await import(`data:text/javascript,export default \"${asset}\"`);
    } catch (e) {
      telemetryRef.current[p].errors.push(String(e));
    }
  }
};

  useEffect(() => {
    const t = telemetryRef.current;
    const now = Date.now();
    if (!t[phase].start) t[phase].start = now;
    preloadPhase(phase);
    // expose for tests
    // @ts-ignore
    window.__journey = { phase, telemetry: t };
  }, [phase]);

  const transition = (target: Phase) => {
    const t = telemetryRef.current;
    const now = Date.now();
    t[phase].end = now;
    if (!t[target].start) t[target].start = now;
    setPhase(target);
  };

  const next = () => {
    const nextPhase = journeyMap[phase].next;
    if (nextPhase) transition(nextPhase);
  };
  const prev = () => {
    const prevPhase = journeyMap[phase].prev;
    if (prevPhase) transition(prevPhase);
  };
  const skip = (p: Phase) => {
    if (phases.includes(p)) transition(p);
  };
  const reset = () => {
    telemetryRef.current = Object.fromEntries(
      phases.map((p) => [p, { start: 0, errors: [] }]),
    ) as Record<Phase, Telemetry>;
    setPhase(phases[0]);
  };

  return (
    <JourneyContext.Provider
      value={{ phase, telemetry: telemetryRef.current, next, prev, skip, reset }}
    >
      {children}
    </JourneyContext.Provider>
  );
}
