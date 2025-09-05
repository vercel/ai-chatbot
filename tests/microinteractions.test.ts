import { describe, expect, test } from "vitest";
import {
  actionHistory,
  actionLogger,
  annotate,
  editAndRerun,
  exportService,
  linkCards,
  makeScenario,
  pinToCanvas,
} from "../lib/microinteractions";

describe("microinteraction flow", () => {
  test("pin → edit → rerun → compare → export", () => {
    const lead = "lead123";
    pinToCanvas("msg1", lead);
    editAndRerun("card1", { temperature: 0.2 }, lead);
    makeScenario("card1", "A", lead);
    linkCards("card1", "card2", lead);
    annotate("card1", { x: 0, y: 0, w: 10, h: 10, comment: "note" }, lead);
    const { filename } = exportService("card1", "png", lead);

    const history = actionLogger.history();
    expect(history).toHaveLength(6);
    expect(filename.startsWith("export-card1")).toBe(true);

    const undone = actionHistory.undo();
    expect(undone?.type).toBe("export");
    const redone = actionHistory.redo();
    expect(redone?.type).toBe("export");
  });
});
