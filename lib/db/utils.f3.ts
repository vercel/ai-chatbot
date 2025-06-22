export function generateSk(date: string, ao: string, q: string) {
  const sk = `date=${encodeURIComponent(date.toLowerCase())}&ao=${encodeURIComponent(ao.toLowerCase())}&q=${encodeURIComponent(q.toLowerCase())}`;
  const maxLen = 255;
  if (sk.length > maxLen) {
    throw new Error(`surrogate key (sk) is too long: ${sk.length} > ${maxLen}`);
  }
  return sk;
}
