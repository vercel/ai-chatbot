import type { LucideIcon } from 'lucide-react';
import { Search, ScanLine, BarChart3, Ruler, Handshake } from 'lucide-react';

export type AgentPhase =
  | 'investigation'
  | 'detection'
  | 'analysis'
  | 'sizing'
  | 'recommendation';

export const phaseDetails: Record<
  AgentPhase,
  { label: string; icon: LucideIcon }
> = {
  investigation: { label: 'Investigação', icon: Search },
  detection: { label: 'Detecção', icon: ScanLine },
  analysis: { label: 'Análise', icon: BarChart3 },
  sizing: { label: 'Dimensionamento', icon: Ruler },
  recommendation: { label: 'Recomendação', icon: Handshake },
};

export const phaseStyles: Record<AgentPhase, string> = {
  investigation: 'text-blue-600 border-blue-600',
  detection: 'text-amber-600 border-amber-600',
  analysis: 'text-indigo-600 border-indigo-600',
  sizing: 'text-green-600 border-green-600',
  recommendation: 'text-pink-600 border-pink-600',
};
