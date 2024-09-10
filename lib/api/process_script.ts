import { sample } from 'lodash';

/**
 * Processes the given script text by extracting exercises, replacing exercise tags,
 * and converting numbers to words.
 *
 * @param {string} text - The script text to process.
 * @returns {[string, Array<Object>]} - Returns a tuple with cleaned text and extracted exercises.
 */

const { toWords } = require('number-to-words');
function process_script(text: string): { cleanText: string, exercises: Array<Object> } {

  function replaceExerciseTags(script: string): string {
    const replacementPhrasesExercise = [
      "<esp>Ahora es tu turno.</esp>",
      "<esp>Es tu turno inténtalo.</esp>",
      "<esp>Es tu momento de intentarlo.</esp>",
      "<esp>Es tu turno de intentarlo.</esp>"
    ];
    
    const replacementPhrasesFill = [
      "Now, let's see if you can fill in the blanks.",
      "It is your turn to give it a shot.",
      "Please fill in the blanks.",
      "Go ahead, attempt to fill in the blanks.",
      "Now, let's see if you can fill in the blanks.",
      "It's now your moment to try this out.",
      "Take a stab at filling in the blanks."
    ];

    let cleanedScript = script.replace(/<pronunciation>.*?<\/pronunciation>/g, () => {
      return sample(replacementPhrasesExercise) + " ";
    });

    cleanedScript = cleanedScript.replace(/<fill>.*?<\/fill> \[ANSWER:(.*?)\]/g, () => {
      return sample(replacementPhrasesFill) + " ";
    });

    return cleanedScript.replace("\n", " ");
  }

  // Extract exercises
  const pronunciationExercises = extractPronunciation(text);
  console.log("Pronunciation exercises", pronunciationExercises);
  
  const fillExercises = extractFill(text);
  const exercises = pronunciationExercises.concat(fillExercises);

  // Remove the tags from the script
  const cleanedScript = replaceExerciseTags(text);
  const cleanText: string = convertNumbersToWords(cleanedScript);
  console.log("Cleaned script", cleanText); 
  return {cleanText, exercises};
}

function convertNumbersToWords(text: string): string {
  function replaceWithWord(match: RegExpMatchArray): string {
    const numberMatch = match[0].match(/\d+/);
    const number = numberMatch ? numberMatch[0] : '';
    return toWords(Number(number));
  }

  const pattern = /\bn?\d+\./g;
  return text.replace(pattern, (substring: string, ...args: any) => replaceWithWord(args));
}

function extractPronunciation(_text: string): Array<Object> {
  const pattern = /<pronunciation>(.*?)<\/pronunciation>/g;
  const matches = [];
  
  let match;
  while ((match = pattern.exec(_text)) !== null) {
    matches.push({ id: 'pronunciation', content: match[1] });
  }
  
  return matches;
}

function extractFill(_text: string): Array<Object> {
  const pattern = /<fill>(.*?)<\/fill> \[ANSWER:(.*?)\]/g;
  const matches = [];

  let match;
  while ((match = pattern.exec(_text)) !== null) {
    matches.push({ id: 'fill', content: match[1], answer: match[2] });
  }

  return matches;
}

export { process_script, convertNumbersToWords, extractPronunciation, extractFill };
