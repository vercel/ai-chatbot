export default function containsEspTag({ input }: { input: string }): boolean {
  // Regular expression to match the pattern
  const regex = /.*[<>/]*esp[>/]*.*/;

  // Test the input string against the regex
  return regex.test(input);
}
