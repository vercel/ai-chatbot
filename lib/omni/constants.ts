import { nanoid } from "nanoid";

export const STREAM_MESSAGES =
  process.env.OMNI_STREAM_MESSAGES ?? "omni.messages";
export const STREAM_OUTBOX =
  process.env.OMNI_STREAM_OUTBOX ?? "omni.outbox";
export const GROUP = process.env.OMNI_GROUP ?? "omni-core";
export const CONSUMER = process.env.OMNI_CONSUMER ?? `consumer-${nanoid()}`;
export const BLOCK_MS = Number(process.env.OMNI_BLOCK_MS ?? "5000");
export const DEDUP_TTL = Number(process.env.OMNI_DEDUP_TTL ?? "60000");
