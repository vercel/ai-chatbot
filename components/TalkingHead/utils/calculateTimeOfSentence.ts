export default function calculateTimeOfSentence({
  sentence,
}: {
  sentence: string;
}): number {
  const speechRate = 150 * 0.75; // Words per minute
  const wordCount = sentence.split(" ").length;
  const timeForThisSentence = (wordCount / speechRate) * 60; // Convert minutes to seconds
  return timeForThisSentence;
}
