export default function calculateTimeToSentence({
  sentenceIndex,
  splitedOutput,
}: {
  sentenceIndex: number;
  splitedOutput: string[];
}): number {
  let totalTime = 0; // Total time in seconds
  const speechRate = 150 * 0.75; // Words per minute
  for (let i = 0; i <= sentenceIndex; i++) {
    const sentence = splitedOutput[i].replace(/\. \/\/ /g, "");
    const wordCount = sentence.split(" ").length;
    const timeForThisSentence = (wordCount / speechRate) * 60; // Convert minutes to seconds
    totalTime += timeForThisSentence;
  }

  return totalTime; // Return total time in seconds
}
