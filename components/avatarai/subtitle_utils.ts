import { translateText } from '@/components/subtitles'
import sendMessageToWebview from '../TalkingHead/utils/sendMessageToWebview'

export const processBuffer = ({
  subtitleBuffer,
  lastIndex,
  setSubtitles
}: {
  subtitleBuffer?: any
  lastIndex?: any
  setSubtitles?: any
}) => {
  const partToTranslate = subtitleBuffer.substring(0, lastIndex)
  // Protect text inside quotes
  const protectedText: unknown[] = []
  const protectRegex = /"(.*?)"/g
  let protectedMatch
  let placeholderIndex = 0
  let protectedTextPart = partToTranslate

  while ((protectedMatch = protectRegex.exec(partToTranslate))) {
    const placeholder = `PLACEHOLDER_${placeholderIndex++}`
    protectedText.push(protectedMatch[1])
    protectedTextPart = protectedTextPart.replace(
      protectedMatch[0],
      placeholder
    )
  }

  // Translate the text
  translateText(protectedTextPart).then(translatedText => {
    let cleanTranslatedText = translatedText
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (match, numStr) =>
        String.fromCharCode(parseInt(numStr, 10))
      )
      .replace(/\//g, '')
      // Reinsert the protected text
      .replace(
        /PLACEHOLDER_(\d+)/g,
        (match, index) => `"${protectedText[index]}"`
      )

    setSubtitles(cleanTranslatedText)
    try {
      sendMessageToWebview({
        concept: 'subtitles',
        message: cleanTranslatedText
      })
    } catch (error) {
      console.log('Error in sending subtitles:', error)
    }
  })

  // Remove the processed part from the buffer
  subtitleBuffer = subtitleBuffer.substring(lastIndex)
}

export const updateSubtitles = ({
  newSubtitles,
  subtitleBuffer,
  setSubtitles,
  timeoutHandle
}: {
  newSubtitles: any
  subtitleBuffer: any
  setSubtitles: any
  timeoutHandle: any
}) => {
  console.log(newSubtitles)
  // Clear existing timeout
  clearTimeout(timeoutHandle)

  // Append new subtitles to the buffer
  subtitleBuffer += newSubtitles + ' '

  // Regular expression to match complete sentences
  const sentenceRegex = /[^.!?:]+[.!?:]\s*/g
  let match
  let lastIndex = 0

  // Find and process all complete sentences in the buffer
  while ((match = sentenceRegex.exec(subtitleBuffer))) {
    lastIndex = match.index + match[0].length
  }

  // Process the buffer immediately if sentences were found
  if (lastIndex > 0) {
    processBuffer({ lastIndex, setSubtitles })
  }

  // Set a timeout to process the buffer if no new text is received within 2 seconds
  timeoutHandle = setTimeout(() => {
    if (subtitleBuffer.length > 0) {
      processBuffer({ subtitleBuffer, setSubtitles })
    }
  }, 5000) // 2 seconds timeout
}
