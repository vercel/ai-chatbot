export const messageTimestamps: number[] = [];
export const errorTimestamps: number[] = [];

export function incrementMessage() {
  messageTimestamps.push(Date.now());
}

export function incrementError() {
  errorTimestamps.push(Date.now());
}
