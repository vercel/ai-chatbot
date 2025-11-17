export type AppMode = "local" | "hosted";

export function normalizeAppMode(value: string | null | undefined): AppMode {
    return value === "local" ? "local" : "hosted";
}
