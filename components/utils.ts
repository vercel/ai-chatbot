export function removeConsecutivePunctuation(input: string) {
  // Replace consecutive punctuation with a single punctuation mark
  return input.replace(/([.,!?¡¿])\1+/g, '$1')
}

export const handleIntroQuestions = (
  text: string,
  analytics: any,
  currentUserId: { current: any }
) => {
  if (
    text.toLowerCase().includes('¿cómo describirías tu nivel actual de inglés?')
  ) {
  } else if (
    text
      .toLowerCase()
      .includes('¿cuánto tiempo has estado estudiando inglés?') ||
    text.toLowerCase().includes('cuánto tiempo has estado estudiando inglés')
  ) {
  } else if (
    text
      .toLowerCase()
      .includes(
        '¿cuáles han sido tus métodos favoritos para aprender inglés hasta ahora?'
      )
  ) {
  } else if (
    text.toLowerCase().includes('¿por qué quieres mejorar tu inglés?')
  ) {
  } else if (
    text
      .toLowerCase()
      .includes('¿cuál es tu objetivo específico para aprender inglés?') ||
    text
      .toLowerCase()
      .includes(
        '¿cuál es el objetivo específico que tienes en mente al aprender inglés'
      )
  ) {
  } else if (
    text
      .toLowerCase()
      .includes(
        '¿cuál es el mayor desafío que enfrentas al aprender inglés?'
      ) ||
    text
      .toLowerCase()
      .includes('¿qué te resulta más difícil al aprender inglés?') ||
    text
      .toLowerCase()
      .includes('qué te resulta más desafiante al aprender inglés')
  ) {
  }
}
