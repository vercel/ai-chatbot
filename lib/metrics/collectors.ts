import { messageTimestamps, errorTimestamps } from './counters';

const HOUR_MS = 60 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;

function pruneOld(array: number[]) {
  const cutoff = Date.now() - HOUR_MS;
  while (array.length && array[0] < cutoff) {
    array.shift();
  }
}

export function msgsPerHour(): number {
  pruneOld(messageTimestamps);
  return messageTimestamps.length;
}

export function errorsPerHour(): number {
  pruneOld(errorTimestamps);
  return errorTimestamps.length;
}

export function lastFiveMinutes() {
  pruneOld(messageTimestamps);
  pruneOld(errorTimestamps);
  const cutoff = Date.now() - FIVE_MIN_MS;
  const msgs = messageTimestamps.filter(t => t >= cutoff).length;
  const errors = errorTimestamps.filter(t => t >= cutoff).length;
  return { msgs, errors };
}
