import { randomUUID } from "node:crypto";

export type LeadId = string;

export interface ActionLog<T = unknown> {
  id: string;
  type: string;
  payload: T;
  leadId: LeadId;
  timestamp: number;
}

export class ActionLogger {
  private logs: ActionLog[] = [];
  private seen = new Map<string, ActionLog>();

  log<T>(type: string, payload: T, leadId: LeadId): ActionLog<T> {
    const key = `${leadId}:${type}:${JSON.stringify(payload)}`;
    const existing = this.seen.get(key);
    if (existing) return existing as ActionLog<T>;

    const entry: ActionLog<T> = {
      id: randomUUID(),
      type,
      payload,
      leadId,
      timestamp: Date.now(),
    };
    this.logs.push(entry);
    this.seen.set(key, entry);
    return entry;
  }

  history(): ActionLog[] {
    return [...this.logs];
  }
}

export class ActionHistory {
  private past: ActionLog[] = [];
  private future: ActionLog[] = [];

  commit(log: ActionLog) {
    this.past.push(log);
    this.future = [];
  }

  undo(): ActionLog | undefined {
    const log = this.past.pop();
    if (log) this.future.push(log);
    return log;
  }

  redo(): ActionLog | undefined {
    const log = this.future.pop();
    if (log) this.past.push(log);
    return log;
  }
}

const logger = new ActionLogger();
const history = new ActionHistory();

export function pinToCanvas(messageId: string, leadId: LeadId, canvasId = "default") {
  const log = logger.log("pin_to_canvas", { messageId, canvasId }, leadId);
  history.commit(log);
  return log;
}

export function editAndRerun(cardId: string, paramsPatch: Record<string, unknown>, leadId: LeadId) {
  const log = logger.log("edit_and_rerun", { cardId, paramsPatch }, leadId);
  history.commit(log);
  return log;
}

export function makeScenario(cardId: string, variant: "A" | "B" | "C", leadId: LeadId) {
  const log = logger.log("make_scenario", { cardId, variant }, leadId);
  history.commit(log);
  return log;
}

export function linkCards(fromCardId: string, toCardId: string, leadId: LeadId) {
  const log = logger.log("link_cards", { fromCardId, toCardId }, leadId);
  history.commit(log);
  return log;
}

export interface AnnotationRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  comment: string;
}

export function annotate(cardId: string, region: AnnotationRegion, leadId: LeadId) {
  const log = logger.log("annotation", { cardId, region }, leadId);
  history.commit(log);
  return log;
}

export type ExportFormat = "png" | "pdf" | "json" | "csv";

export function exportService(cardId: string, format: ExportFormat, leadId: LeadId) {
  const filename = `export-${cardId}-${Date.now()}.${format}`;
  const log = logger.log("export", { cardId, format, filename }, leadId);
  history.commit(log);
  return { log, filename };
}

export const actionLogger = logger;
export const actionHistory = history;
