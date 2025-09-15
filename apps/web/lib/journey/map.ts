export type Phase =
  | 'Investigation'
  | 'Detection'
  | 'Analysis'
  | 'Dimensioning'
  | 'Simulation'
  | 'Installation'
  | 'Monitoring'
  | 'Recommendation'
  | 'LeadMgmt';

interface PhaseConfig {
  next?: Phase;
  prev?: Phase;
  cards: string[];
  viewers: string[];
}

export const journeyMap: Record<Phase, PhaseConfig> = {
  Investigation: {
    next: 'Detection',
    cards: ['Intent', 'LeadValidation', 'LeadEnrichment'],
    viewers: [],
  },
  Detection: {
    prev: 'Investigation',
    next: 'Analysis',
    cards: ['Detection'],
    viewers: [],
  },
  Analysis: {
    prev: 'Detection',
    next: 'Dimensioning',
    cards: ['Analysis'],
    viewers: [],
  },
  Dimensioning: {
    prev: 'Analysis',
    next: 'Simulation',
    cards: ['Dimensioning'],
    viewers: [],
  },
  Simulation: {
    prev: 'Dimensioning',
    next: 'Installation',
    cards: ['Simulation'],
    viewers: [],
  },
  Installation: {
    prev: 'Simulation',
    next: 'Monitoring',
    cards: ['Installation'],
    viewers: [],
  },
  Monitoring: {
    prev: 'Installation',
    next: 'Recommendation',
    cards: ['Monitoring'],
    viewers: [],
  },
  Recommendation: {
    prev: 'Monitoring',
    next: 'LeadMgmt',
    cards: ['Recommendation'],
    viewers: [],
  },
  LeadMgmt: {
    prev: 'Recommendation',
    cards: ['LeadMgmt'],
    viewers: [],
  },
};

export const phases: Phase[] = [
  'Investigation',
  'Detection',
  'Analysis',
  'Dimensioning',
  'Simulation',
  'Installation',
  'Monitoring',
  'Recommendation',
  'LeadMgmt',
];

export const phaseLabels: Record<Phase, string> = {
  Investigation: 'Investigação',
  Detection: 'Detecção',
  Analysis: 'Análise',
  Dimensioning: 'Dimensionamento',
  Simulation: 'Simulação',
  Installation: 'Instalação',
  Monitoring: 'Monitoramento',
  Recommendation: 'Recomendação',
  LeadMgmt: 'Gestão de Leads',
};

export const phaseRoutes: Record<Phase, string> = {
  Investigation: '/journey/investigation',
  Detection: '/journey/detection',
  Analysis: '/journey/analysis',
  Dimensioning: '/journey/dimensioning',
  Simulation: '/journey/simulation',
  Installation: '/journey/installation',
  Monitoring: '/journey/monitoring',
  Recommendation: '/journey/recommendation',
  LeadMgmt: '/journey/leadmgmt',
};

const slugToPhaseMap: Record<string, Phase> = {
  investigation: 'Investigation',
  detection: 'Detection',
  analysis: 'Analysis',
  dimensioning: 'Dimensioning',
  simulation: 'Simulation',
  installation: 'Installation',
  monitoring: 'Monitoring',
  recommendation: 'Recommendation',
  leadmgmt: 'LeadMgmt',
};

export function phaseFromSlug(slug: string): Phase | undefined {
  return slugToPhaseMap[slug.toLowerCase()];
}

export function getPhaseRoute(phase: Phase): string {
  return phaseRoutes[phase];
}

export function getPhaseLabel(phase: Phase): string {
  return phaseLabels[phase];
}
