import { nanoid } from 'nanoid';

export interface CanvasCard {
  id: string;
  links?: string[];
  [key: string]: any;
}

export interface Scenario {
  id: string;
  label: string;
  cards: CanvasCard[];
}

export interface MakeScenarioResult {
  scenarios: Scenario[];
  scenario: Scenario;
}

/**
 * Create a new scenario by duplicating a card.
 *
 * - A deep clone of the card is created to avoid shared references.
 * - Any links inside the card referencing its original id are updated
 *   to point to the duplicated card's id.
 * - The generated scenario label follows the A/B/C pattern.
 * - Idempotent: if a scenario with the intended label already exists,
 *   the original list is returned unchanged.
 */
export function makeScenario(
  scenarios: Scenario[],
  card: CanvasCard
): MakeScenarioResult {
  const nextIndex = scenarios.length;
  const label = `Scenario ${String.fromCharCode(65 + nextIndex)}`;

  const existing = scenarios.find((s) => s.label === label);
  if (existing) {
    return { scenarios, scenario: existing };
  }

  const scenarioId = nanoid();
  const clonedCard: CanvasCard = structuredClone(card);
  const newCardId = nanoid();

  updateLinks(clonedCard, card.id, newCardId);
  clonedCard.id = newCardId;

  const newScenario: Scenario = {
    id: scenarioId,
    label,
    cards: [clonedCard],
  };

  return { scenarios: [...scenarios, newScenario], scenario: newScenario };
}

function updateLinks(value: unknown, oldId: string, newId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => updateLinks(item, oldId, newId));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, updateLinks(v, oldId, newId)])
    );
  }
  return value === oldId ? newId : value;
}

export type { CanvasCard as Card, Scenario as ScenarioState };
