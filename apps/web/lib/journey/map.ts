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
