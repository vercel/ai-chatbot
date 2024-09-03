// @ts-nocheck
'use client'

import React, { useEffect, useRef, useState, createContext } from 'react'
// Ensure you have these dependencies correctly imported or available in your project
import { TalkingHead } from '@/components/TalkingHead/modules/talkinghead.mjs' // This path might need to be adjusted based on your project setup
import localImage from '../../public/background.png'
import {
  removeConsecutivePunctuation,
  handleIntroQuestions
} from '@/components/utils'
import { translateText } from '@/components/subtitles'

import containsEspTag from '@/components/TalkingHead/utils/containsEspTag'
import getFontSize from '@/components/TalkingHead/utils/getFontSize'
import sendMessageToWebview from '@/components/TalkingHead/utils/sendMessageToWebview'
import calculateTimeToSentence from '@/components/TalkingHead/utils/calculateTimeToSentence'
import {
  processBuffer,
  updateSubtitles
} from '@/components/avatarai/subtitle_utils'
import { setupWebSocket } from '@/components/avatarai/websocket'
import TestingUI from '@/components/TalkingHead/components/testingUI'
import Subtitles from '@/components/TalkingHead/components/subtitles'
import Loading from '@/components/TalkingHead/components/loading'
const TalkingHeadComponent = ({ audioToSay, textToSay, setIsResponding }) => {
  // the audioToSay is an audio Buffer, like what we get from the server
  // the textToSay is the text that matches the audioToSay
  // the hack consists on saying the textToSay
  const { toWav } = require('audiobuffer-to-wav')

  const interal = true
  const avatarRef = useRef(null)
  const [loadingMessage, setLoadingMessage] = useState('Loading...')
  const [text, setText] = useState("Hi there. How are you? I'm fine.")
  const head = useRef(null)
  const inputRef = useRef(null)
  const [webSocketReady, setWebSocketReady] = useState(false)
  const messageQueue = useRef([])
  const initializedRef = useRef(false)
  const serverWebSocket = useRef(null)
  const [subtitles, setSubtitles] = useState('')
  const lessonStarted = useRef(null)
  const isPaused = useRef(false)
  const [isIntro, setIsIntro] = useState(false)
  const isInExercise = useRef(null)
  const isInAudioEval = useRef(false)
  const isEndQueued = useRef(false)
  const incompleteTagRef = useRef('')
  const currentUserId = useRef('')
  const lastExercise = useRef(null)
  const bounceRef = useRef(null)
  const playSpeed = useRef(1.0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isSubtitlesActive, setIsSubtitlesActive] = useState(true)
  const reactQueue = useRef([])
  const [fontSize, setFontSize] = useState(16)
  const speakQueue = useRef([])

  useEffect(() => {
    console.log('TalkingHeadComponent mounted')
    if (audioToSay) {
      setTimeout(() => {
        console.log('Sending message to speak')
        setIsResponding(true)
        console.log('toSay', audioToSay)
        /* head.current.speakText(
        'hello, how are you today?',
        null,
        updateSubtitles,
        undefined,
        onComplete,
        {
          lang: 'en-US',
          volume: 1.0,
          rate: playSpeed.current,
          voice: 'en-GB-Wavenet-F',
          pitch: 0
        }
      ) */
        calculateAudio(audioToSay).then(audio => {
          console.log('Audio calculated')

          head.current.speakAudio(
            {
              words: audio.words,
              wtimes: audio.wtimes,
              wdurations: audio.wdurations,
              audio: audioToSay,
              markers: audio.markers,
              mtimes: audio.mtimes
            },
            {},
            () => {
              setIsResponding(false)
              console.log("running 'onComplete'")
            },
            {}
          )

          console.log('SENT message ')
        })
      })
    }
  }, [audioToSay])

  useEffect(() => {
    const handleResize = () => {
      setFontSize(
        getFontSize({
          screenWidth: window.innerWidth
        })
      )
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (initializedRef.current) return // Prevents further execution if already initialized
    initializedRef.current = true
    const nodeAvatar = avatarRef.current
    console.log('nodeAvatar' + nodeAvatar)
    if (head.current) return
    console.log('Head' + head.current)
    initTalkingHead(nodeAvatar)
  }, []) // Empty dependency array ensures this effect runs only once

  let subtitleBuffer = ''
  let timeoutHandle: string | number | NodeJS.Timeout | null | undefined = null

  const audioBufferToWav = audioBuffer => {
    const numOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length * numOfChannels * 2 + 44 // 16-bit PCM format, hence * 2
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)

    // Write WAV header
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    let offset = 0
    writeString(view, offset, 'RIFF')
    offset += 4
    view.setUint32(offset, 36 + audioBuffer.length * 2, true)
    offset += 4
    writeString(view, offset, 'WAVE')
    offset += 4
    writeString(view, offset, 'fmt ')
    offset += 4
    view.setUint32(offset, 16, true)
    offset += 4 // PCM format
    view.setUint16(offset, 1, true)
    offset += 2
    view.setUint16(offset, numOfChannels, true)
    offset += 2
    view.setUint32(offset, sampleRate, true)
    offset += 4
    view.setUint32(offset, sampleRate * 2, true)
    offset += 4
    view.setUint16(offset, numOfChannels * 2, true)
    offset += 2
    view.setUint16(offset, 16, true)
    offset += 2
    writeString(view, offset, 'data')
    offset += 4
    view.setUint32(offset, audioBuffer.length * 2, true)
    offset += 4

    // Write audio data
    for (let channel = 0; channel < numOfChannels; channel++) {
      const data = audioBuffer.getChannelData(channel)
      let index = 44 + channel * 2
      for (let i = 0; i < data.length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]))
        view.setInt16(
          index,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        )
        index += numOfChannels * 2
      }
    }

    return buffer
  }
  const startSegment = async () => {
    head.current.lookAtCamera(500)
    head.current.speakWithHands()
  }
  const calculateAudio = async audioBuffer => {
    try {
      console.log('Calculating audio')

      // Save the audioBuffer to a temporary file
      const wavBuffer = audioBufferToWav(audioBuffer)
      const file = new File([wavBuffer], 'audio.wav', { type: 'audio/wav' })
      console.log('File created:', file)

      const form = new FormData()
      form.append('file', file)
      form.append('model', 'whisper-large-v3')
      form.append('language', 'en')
      form.append('response_format', 'verbose_json')

      console.log('API Key:', process.env.OPEN_AI_KEY)

      const response = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          body: form,
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`
          }
        }
      )

      // Check if the response is not OK and throw an error to catch it
      if (!response.ok) {
        const errorDetails = await response.json()
        console.error('API Error:', errorDetails)
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result = await response.json()

      let audio = {
        words: [],
        wtimes: [],
        wdurations: [],
        markers: [],
        mtimes: []
      }

      // Parse the translation result to extract words and timings
      result.words.forEach(x => {
        audio.words.push(x.word)
        audio.wtimes.push(1000 * x.start - 150)
        audio.wdurations.push(1000 * (x.end - x.start))
      })

      result.segments.forEach(x => {
        if (x.start > 2 && x.text.length > 10) {
          audio.markers.push(startSegment)
          audio.mtimes.push(1000 * x.start - 1000)
        }
      })

      return audio
    } catch (error) {
      console.error('Error in calculateAudio:', error)
      return null
    }
  }

  const checkForExercises = async () => {
    try {
      if (currentUserId.current == '') {
        return
      }
      const userDocRef = doc(firestore, 'users', currentUserId.current)
      const userDoc = await getDoc(userDocRef)
      if (!userDoc.exists()) {
        return
      }
      const lessonId = userDoc.data().selectedClass
      const lessonDocRef = doc(firestore, 'lessons', lessonId)
      const lessonDoc = await getDoc(lessonDocRef)
      if (!lessonDoc.exists()) {
        return
      }
      const exercises = lessonDoc.data().exercises
      const classId = lessonDoc.data().classId
      if (
        parseInt(classId[classId.length - 1]) % 2 == 0 &&
        lessonStarted.current != null
      ) {
        const response = await fetch(
          'https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/prompting',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lessonId: lessonId
            })
          }
        )
        const data = await response.json()
        const text = data.Output
        sendMessageToWebview({
          concept: 'lessonST',
          message: lessonStarted.current
        })
        return
        // window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "prompting", "message": text }));
      }
      if ((!exercises || exercises.length === 0) && classId !== 'Intro') {
        updateDoc(lessonDocRef, {
          lessonTime: 0
        })
        lessonStarted.current = null
        sendMessageToWebview({ concept: 'videoEnd' })
        return
      }
      const exercise = exercises[exercises.length - 1]
      await updateDoc(lessonDocRef, {
        exercises: arrayRemove(exercise)
      })
      lastExercise.current = exercise
      if (exercise.used !== true) {
        isPaused.current = true
        sendMessageToWebview({ concept: 'audioEval', exercise: exercise })
        isInExercise.current = exercise
        return exercise
      }
    } catch (error) {
      console.error('Failed to check exercises:', error)
    }
  }
  const onComplete = () => {
    setIsResponding(false)
    console.log("running 'onComplete'")
  }
  function extractAndSeparate(text) {
    // Regular expression to match the <esp>...</esp> and <esp>...//esp> patterns
    const pattern = /<esp>(.*?)(<\/esp>|esp>|$)/g
    let segments = []
    let lastIndex = 0
    let match

    while ((match = pattern.exec(text)) !== null) {
      // Add any English content before the Spanish tag
      if (match.index > lastIndex) {
        const beforeEsp = text
          .substring(lastIndex, match.index)
          .replace(/\s+/g, ' ')
          .trim()
        if (beforeEsp) {
          segments.push({ lang: 'eng', content: beforeEsp })
        }
      }

      // Add the Spanish content within the tag
      segments.push({ lang: 'esp', content: match[1].trim() })
      lastIndex = pattern.lastIndex
    }

    // Add any remaining English content after the last Spanish tag
    if (lastIndex < text.length) {
      const afterEsp = text.substring(lastIndex).replace(/\s+/g, ' ').trim()
      if (afterEsp) {
        segments.push({ lang: 'eng', content: afterEsp })
      }
    }
    return segments
  }

  const handleSpeak = text => {
    try {
      if (text) {
        try {
          handleIntroQuestions(text, analytics, currentUserId.current)
        } catch (error) {
          console.log('Error in handleIntroQuestions:', error)
        }
        text = text.replace(/(\B)'([^']*)'(\B)/g, '$1"$2"$3')
        const dict = extractAndSeparate(removeConsecutivePunctuation(text))
        for (let i = 0; i < dict.length; i++) {
          const { lang, content } = dict[i]
          if (lang === 'esp') {
            const modifiedContent = content.replace(/([A-Z])/g, ' $1')
            console.log(
              'Trimmed content:',
              modifiedContent.replace(/undefiened/g, "'")
            )
            head?.current?.speakText(
              modifiedContent.replace(/undefiened/g, "'"),
              null,
              updateSubtitles,
              undefined,
              onComplete,
              {
                lang: dict.lang,
                volume: 1.0,
                rate: playSpeed.current,
                voice: 'es-US-Standard-A',
                pitch: 0
              }
            )
          } else {
            if (!/[a-zA-Z]/.test(content)) {
              continue
            }
            if (containsEspTag({ input: content })) {
              continue
            }
            if (content.length < 2) {
              continue
            }
            const trimmedContent = content.replace(/^[^a-zA-Z]+/, '')
            // window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "speak", "message": trimmedContent.replace(/undefiened/g, "'") }));
            console.log('head.current', head.current.isAudioPlaying)
            head?.current?.speakText(
              trimmedContent.replace(/undefiened/g, "'").trim(),
              null,
              updateSubtitles,
              undefined,
              onComplete,
              {
                lang: 'en-US',
                volume: 1.0,
                rate: playSpeed.current,
                voice: 'en-GB-Wavenet-F',
                pitch: 0
              }
            )
          }
        }
      }
    } catch (error) {
      try {
        sendMessageToWebview({ concept: 'error', message: `Error: ${error}` })
      } catch (error) {
        // Is in testing mode web
      }
      console.log(error)
    }
  }

  const waitForWebSocket = (
    maxAttempts = 8,
    intervalTime = 100,
    timeoutTime = 5000
  ) => {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const checkConnection = () => {
        if (
          serverWebSocket.current &&
          serverWebSocket.current.readyState === WebSocket.OPEN
        ) {
          clearInterval(interval)
          clearTimeout(timeout)
          sendMessageToWebview({
            concept: 'WebSocket',
            message: 'WebSocket connection is open'
          })
          resolve()
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          clearTimeout(timeout)
          sendMessageToWebview({
            concept: 'WebSocket',
            message: 'WebSocket connection failed after multiple attempts'
          })
          reject(
            new Error('WebSocket connection failed after multiple attempts')
          )
        } else if (
          !serverWebSocket.current ||
          serverWebSocket.current.readyState === WebSocket.CLOSED ||
          serverWebSocket.current.readyState === WebSocket.CLOSING
        ) {
          sendMessageToWebview({
            concept: 'WebSocket',
            message: 'WebSocket connection is not open'
          })
          setupWebSocket()
        }
        attempts++
      }

      const interval = setInterval(checkConnection, intervalTime) // Check every 100ms

      const timeout = setTimeout(() => {
        clearInterval(interval)
        if (
          !serverWebSocket.current ||
          serverWebSocket.current.readyState !== WebSocket.OPEN
        ) {
          sendMessageToWebview({
            concept: 'WebSocket',
            message: 'WebSocket connection timed out'
          })
          reject(new Error('WebSocket connection timed out'))
        }
      }, timeoutTime) // Timeout after 5 seconds

      // Initial check and setup if WebSocket is not open or connecting
      checkConnection()
    })
  }

  async function getLevelFromInterview(lessonId, uid) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        concept: 'message',
        message: `Getting level from interview for ${uid} in lesson ${lessonId}`
      })
    )
    const url = `https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/level/${uid}/${lessonId}`

    try {
      const response = await fetch(url, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'response', message: data })
      )

      return data.level
    } catch (error) {
      console.error('Error getting level from interview:', error)
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'error', message: error.message })
      )
      return 'A1'
    }
  }

  const sendMessage = async (message, uid, lessonId, messageType) => {
    let userMessage = message
    if (messageType === 'audio') {
      const formData = new FormData()
      const audioBlob = new Blob(
        [
          new Uint8Array(
            atob(message)
              .split('')
              .map(char => char.charCodeAt(0))
          )
        ],
        { type: 'audio/wav' }
      )
      formData.append('file', audioBlob)
      const url =
        'https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/transcribe'
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData
        })
        const data = await response.json()
        const transcribedText = data.transcribed_text || ''
        userMessage = transcribedText
        sendMessageToWebview({
          concept: 'transcribedText',
          message: transcribedText
        })
      } catch (error) {
        console.log('Error transcribing audio:', error)
        sendMessageToWebview({ concept: 'error', message: error })
        return
      }
    }
    head.current.stopSpeaking()
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'MESSAGE', message: serverWebSocket.current })
    )
    try {
      await waitForWebSocket()
      serverWebSocket.current.send(
        JSON.stringify({
          action: 'talk',
          data: {
            userUid: uid,
            message: userMessage,
            topic: '',
            lessonId: lessonId
          }
        })
      )
      console.log('Message sent')
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'MESSAGE', message: userMessage })
      )
    } catch (error) {
      console.log('WebSocket error:', error)
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'MESSAGE', message: error.message })
      )
    }
  }
  const handleIdMessage = data => {
    const connectionId = data.connectionId
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'connectionId', message: connectionId })
    )
    if ('userUID' in data && 'lessonId' in data) {
      const useruid = data.userUID
      const lessonId = data.lessonId
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'lessonId', message: lessonId })
      )
      startLesson(lessonId, useruid)
    }
  }

  const processSpeakQueue = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        concept: 'Processing speak queue',
        message: speakQueue.current
      })
    )
    while (speakQueue.current.length > 0) {
      const text = speakQueue.current.shift()
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'Processing speak', message: text })
      )
      handleSpeak(text)
    }
  }

  const handleMessageFromServer = async event => {
    if (event.data) {
      const data = JSON.parse(event.data)
      const concept = data.concept
      switch (concept) {
        case 'text':
          let text = data['output']
          text = text.replace(/\\\\/g, '')
          text = text.replace(/\. \\/g, '')
          if (text.includes('<placement>')) {
            // Replace incorrect regular expression syntax
            isEndQueued.current = true
            const lessonRef = doc(firestore, 'lessons', data['lessonId'])
            getDoc(lessonRef).then(async doc => {
              if (doc.exists()) {
                isInExercise.current = {
                  concept: 'placementTest',
                  preferences: doc.data().Preferences
                }
              }
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  concept: 'prefLineup',
                  preferences: isInExercise.current.preferences
                })
              )
            })
            onComplete()
          }
          if (
            text === '' ||
            text === ' ' ||
            text === "'." ||
            text.length < 2 ||
            text === " '. " ||
            text === "'. " ||
            text === "  '."
          ) {
            return
          }
          if (
            /summarize|we'?ve learned/i.test(text.toLowerCase()) ||
            /completed|today'?s lesson/i.test(text.toLowerCase()) ||
            /finished|today'?s lesson/i.test(text.toLowerCase()) ||
            /conclude|our lesson/i.test(text.toLowerCase()) ||
            /let'?s\s+review/i.test(text.toLowerCase()) ||
            /progress\s+today/i.test(text.toLowerCase()) ||
            /that'?s\s+all/i.test(text.toLowerCase()) ||
            /keep\s+practicing/i.test(text.toLowerCase()) ||
            /you'?ve\s+learned/i.test(text.toLowerCase()) ||
            /let?s\s+wrap/i.test(text.toLowerCase()) ||
            /fantastic\s+job\s+learning/i.test(text.toLowerCase())
          ) {
            isEndQueued.current = true
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ concept: 'END QUEUED', message: text })
            )
            text = text.replace(/<end>/g, '')
            isInExercise.current = null
          }
          sendMessageToWebview({ concept: 'Text', message: text })
          if (
            /test/i.test(text.toLowerCase()) ||
            /examen\s+de\s+nivel/i.test(text.toLowerCase()) ||
            /quiz/i.test(text.toLowerCase()) ||
            /colocación/i.test(text.toLowerCase()) ||
            /aprender\s+inglés\s+de\s+inmediato/i.test(text.toLowerCase()) ||
            /guiaré/i.test(text.toLowerCase()) ||
            /compartir\s+esta\s+información\s+conmigo/i.test(
              text.toLowerCase()
            ) ||
            /guiar/i.test(text.toLowerCase()) ||
            /hemos\s+hablado\s+sobre\s+tus\s+objetivos/i.test(
              text.toLowerCase()
            ) ||
            /eso\s+es\s+todo/i.test(text.toLowerCase()) ||
            /te\s+dejo/i.test(text.toLowerCase()) ||
            /compartir\s+tus\s+pensamientos\s+y\s+sentimientos/i.test(
              text.toLowerCase()
            ) ||
            /compartir\s+tus\s+sentimientos/i.test(text.toLowerCase()) ||
            /compartir\s+tus\s+pensamientos/i.test(text.toLowerCase()) ||
            /compartir\s+tus\s+sentimientos\s+y\s+pensamientos/i.test(
              text.toLowerCase()
            ) ||
            /serás\s+dirigido/i.test(text.toLowerCase()) ||
            /compartido\s+tus\s+sentimientos/i.test(text.toLowerCase()) ||
            /llevaré/i.test(text.toLowerCase()) ||
            /trabajaremos\s+juntos/i.test(text.toLowerCase()) ||
            /compartir\s+información/i.test(text.toLowerCase()) ||
            /compartir\s+información\s+conmigo/i.test(text.toLowerCase())
          ) {
            getDoc(doc(firestore, 'lessons', lessonStarted.current)).then(
              async lessDoc => {
                if (lessDoc.exists()) {
                  const classId = lessDoc.data().classId
                  if (classId == 'Intro') {
                    await updateDoc(
                      doc(firestore, 'lessons', lessonStarted.current),
                      {
                        lessonTime: 0
                      }
                    )
                    const level = await getLevelFromInterview(
                      lessonStarted.current,
                      currentUserId.current
                    )
                    isInExercise.current = {
                      id: 'placementTest',
                      level: level
                    }
                  }
                }
              }
            )
          }
          // const questionRegex = /¿([^?]+)\?/g;
          // const questions = "";
          // let match;
          // while ((match = questionRegex.exec(text)) !== null) {
          //     const question = match[1].trim();
          //     questions += question + " ";
          // }
          // if (questions.length > 3) {
          //     // Do something with the extracted questions
          //     window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "helperPrompt", "message": questions }));
          // }
          if (/^\s*[\-\*\+]\s/.test(text)) {
            // The text is formatted like a list
            isInExercise.current = text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line !== '')
          } else {
            // The text is not formatted like a list
            text = text.replace(/<end>/g, '')
            if (isPaused.current) {
              speakQueue.current.push(text)
            } else {
              if (speakQueue.current.length == 0) {
                handleSpeak(text)
              } else {
                speakQueue.current.push(text)
              }
            }
          }

          break
        case 'id':
          handleIdMessage(data)
          break
        case 'audioEval':
          let response = data['output']
          if (
            response === 'undefined' ||
            response === 'null' ||
            response === ''
          ) {
            return
          }
          sendMessageToWebview({
            concept: 'audioEvalResponse',
            message: response
          })
          break
        default:
          console.log('No matching action found')
          break
      }
    }
  }

  const handleExercise = exercise => {
    head.current.stopSpeaking()
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'handleExercise', exercise: exercise })
    )
    isPaused.current = true
    if (isInAudioEval.current) {
      isInAudioEval.current = false
      return
    }
    if (exercise.id !== null) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'exercise', exercise: exercise })
      )
    }
    isInAudioEval.current = true
    switch (exercise.id) {
      case 'pronunciation':
        sendMessageToWebview({ concept: 'audioEval', exercise: exercise })
        break
      case 'readingExercise':
        // Assuming you have a function called handleFillInTheBlank to call
        sendMessageToWebview({ concept: 'awaitingResponse' })
        sendMessageToWebview({ concept: 'readingExercise' })
        break
      case 'placementTest':
        sendMessageToWebview({
          concept: 'placementTest',
          level: exercise.level
        })
        updateDoc(doc(firestore, 'users', currentUserId.current), {
          level: exercise.level
        })
        updateDoc(doc(firestore, 'lessons', lessonStarted.current), {
          lessonTime: 0
        })
        sendMessageToWebview({
          concept: 'placementTest',
          level: exercise.level
        })
        break
      default:
        console.log('No matching exercise ID found')
        sendMessageToWebview({
          concept: 'unknownExercise',
          exercise: exercise
        })
        break
    }
    isInExercise.current = null
  }
  const waitForResume = () => {
    return new Promise(resolve => {
      const intervalId = setInterval(() => {
        if (!isPaused.current) {
          sendMessageToWebview({ concept: 'resuming' })
          clearInterval(intervalId)
          resolve()
        }
      }, 100) // Check every 100ms
    })
  }

  const fiveMinuteTimer = (lessonId, uid) => {
    let elapsedSeconds = 0
    const timer = setInterval(async () => {
      elapsedSeconds++
      if (elapsedSeconds >= 280) {
        clearInterval(timer)
        head.current.stopSpeaking()
        await updateDoc(doc(firestore, 'lessons', lessonId), {
          lessonTime: 0
        })
        await updateDoc(doc(firestore, 'users', uid), {
          userPlaySpeed: playSpeed.current
        })
        lessonStarted.current = null
        handleSpeak(
          'Ohh look at that! It seems like your class time has ended. I hope you enjoyed it and learned something new. Have a great day! Goodbye!'
        )
        sendMessageToWebview({
          concept: 'videoEnd',
          message: 'Practice ended'
        })
        isInExercise.current = null
        updateUserTime(uid, lessonId)
        lessonStarted.current = null
      }
    }, 1000)
  }

  const updateUserTime = (uid, lessonId) => {
    getDoc(doc(firestore, 'users', uid)).then(async document => {
      if (document.exists()) {
        updateDoc(doc(firestore, 'users', uid), {
          userTime: document.data().userTime - 1
        })
      }
    })
    updateDoc(doc(firestore, 'lessons', lessonId), {
      lessonTime: 0
    })
    lessonStarted.current = null
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'VIDEO HAS ENDED', message: 'Practice ended' })
    )
  }
  const startLesson = (lessonId, uid) => {
    if (lessonStarted.current != null) return
    lessonStarted.current = lessonId
    console.log('Lesson STARTED', lessonStarted)
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: lessonStarted })
    )
    let classId = ''
    getDoc(doc(firestore, 'lessons', lessonId))
      .then(async docu => {
        if (docu.exists()) {
          sendMessageToWebview({
            concept: 'lesson',
            lesson: docu.data().classId
          })
          classId = docu.data().classId
        } else {
          sendMessageToWebview({
            concept: 'error',
            message: 'Lesson not found'
          })
        }
        if (classId == 'Intro') {
          setIsIntro(true)
          sendMessageToWebview({
            concept: 'id',
            lessonId: lessonId,
            classId: classId,
            userUID: uid
          })
          sendMessageToWebview({ concept: 'started' })
          sendMessage('Hola Clara!', uid, lessonId, 'text')
          // const text = ["<esp>Bienvenido a Edgen AI. Soy tu profesora Clara. Me gustaría empezar conociendo por qué estudias inglés. ¿Puedes decirme por qué estudias inglés?</esp>",
          //     "<esp>Segunda pregunta, ¿has estudiado inglés anteriormente?</esp>",
          //     "<esp>Última pregunta, ¿en qué te gustaría centrarte en este curso, en la escritura, la lectura o el habla?</esp>",
          //     "<esp>¡Genial! Tendré eso en cuenta a medida que avancemos en el curso. Adelante y pasa a un pequeño examen para conocer tu nivel.</esp>"
          // ]
          // for (let i = 0; i < text.length; i++) {
          //     if (isPaused.current) {

          //         window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "pause" }));
          //         await waitForResume();
          //     }
          //     handleSpeak(text[i]);
          //     if (i == 0) {
          //         window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "started" }));
          //     }
          //     if (i == 3) {
          //         lessonStarted.current = null;
          //         isPaused.current = false;
          //         window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": lessonStarted.current }));
          //         await getDoc(doc(firestore, "lessons", lessonId)).then(async (lessDoc) => {
          //             if (lessDoc.exists()) {
          //                 isInExercise.current = { id: "placementTest", preferences: lessDoc.data().Preferences };
          //             }
          //             window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "prefLineup", "preferences": isInExercise.current.preferences }));
          //         });
          //         await updateDoc(doc(firestore, "lessons", lessonId), {
          //             lessonTime: 0
          //         });
          //         setIsIntro(false);
          //         return;
          //     }
          //     window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "awaitingResponse" }));
          //     isPaused.current = true;
          // }
          return
        }
        sendMessageToWebview({ concept: 'CLASSID', lesson: classId })
        const lessonData = docu.data()
        if (lessonData.topic == 'reading') {
          console.log('ClassId ends with 3... READING EXERCISE')
          await handleReadingExercise(lessonId, classId)
          sendMessageToWebview({ concept: 'started' })
          return
        }
        try {
          sendMessageToWebview({
            concept: 'id',
            lessonId: lessonId,
            classId: classId,
            userUID: uid
          })
        } catch (error) {
          console.log(`Error sending message to React Native: ${error}`)
        }
        console.log('Lesson Started', lessonStarted.current)
        if (parseInt(classId.slice(-1)) % 2 === 0) {
          fiveMinuteTimer(lessonId, uid)
        } else {
        }
        fetch(
          `https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/precompute/${uid}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lessonId: lessonId
            })
          }
        )
          .then(response => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ concept: 'started' })
            )
            isInExercise.current = null
            return response.json()
          })
          .then(async data => {
            console.log('Lesson Started', lessonStarted)
            const output = data['Output']
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ concept: 'output', message: output })
            )
            const splitedOutput = output.split(' //')
            const exercises = data['exercises']
            if (exercises && exercises.length > 0) {
              isInExercise.current = exercises[0]
            }
            let hasPaused = false
            for (let i = 0; i < splitedOutput.length; i++) {
              if (isPaused.current) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ concept: 'pause' })
                )
                await waitForResume()
                hasPaused = true
              }
              let cleanedOutput = splitedOutput[i].replace(/\s*\/\/\s*/g, '') // Remove // markers with optional spaces around them
              if (
                cleanedOutput === '' ||
                cleanedOutput === ' ' ||
                cleanedOutput === "'." ||
                cleanedOutput.length < 2 ||
                cleanedOutput === " '. " ||
                cleanedOutput === "'. " ||
                cleanedOutput === "  '." ||
                hasPaused
              ) {
                continue
              }
              handleSpeak(cleanedOutput)

              if (exercises && exercises.length > 0) {
                const matchingExercise = exercises.find(
                  exercise => exercise.index == i
                )
                if (matchingExercise) {
                  isPaused.current = true
                  try {
                    isInExercise.current = matchingExercise
                  } catch (error) {
                    console.log(`error in handleExercise: ${error}`)
                  }
                }
              }
            }
            const totalSeconds = calculateTimeToSentence({
              splitedOutput: splitedOutput,
              sentenceIndex: splitedOutput.length - 1
            })
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ concept: 'awaitingResponse' })
              )
            }, totalSeconds * 1000)
          })
      })
      .catch(error => {
        lessonStarted.current = null
        console.log('Error getting document:', error)
      })
    // lessonStarted.current = false;
  }

  const sendWebSocketMessage = message => {
    if (serverWebSocket.current === null) {
      messageQueue.current.push(message)
      return
    }
    if (serverWebSocket.current.readyState === WebSocket.OPEN) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ concept: 'MESSAGE', message: JSON.stringify(message) })
      )
      serverWebSocket.current.send(
        JSON.stringify({
          action: 'init',
          data: {
            userUID: currentUserId.current
          }
        })
      )
    } else {
      messageQueue.current.push(message)
    }
  }

  async function handleReadingExercise(lessonId, classId) {
    lessonStarted.current = lessonId
    const text = [
      'Hello, how are you? Today we will read a passage of your intrest to practice your reading skill <esp> Hoy vamos a leer un articulo sobre tus gustos </esp> ',
      'After that we will have a small exercise to test your understanding of the passage <esp> Después de eso, tendremos un pequeño ejercicio para probar tu comprensión del pasaje </esp>',
      "Let's get started <esp> Empecemos </esp>"
    ]
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'reading' })
    )
    for (let i = 0; i < text.length; i++) {
      if (isPaused.current) {
        sendMessageToWebview({ concept: 'pause' })
        await waitForResume()
      }
      handleSpeak(text[i])
      if (i == 2) {
        lessonStarted.current = null
        isPaused.current = false
        sendMessageToWebview({
          concept: 'id',
          lessonId: lessonId,
          reading: true,
          classId: classId
        })
        await getDoc(doc(firestore, 'lessons', lessonId)).then(
          async lessDoc => {
            if (lessDoc.exists()) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  concept: 'EXERCISE UPDATED',
                  lesson: lessDoc.data().classId
                })
              )
              isInExercise.current = { id: 'readingExercise' }
            }
          }
        )
        return
      }
    }
  }
  const processEvent = async event => {
    // Log the event message for debugging purposes
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'event', message: event })
    )

    // Parse the incoming message
    let eventData
    try {
      eventData = JSON.parse(event.data)
    } catch (e) {
      console.error('Received message is not valid JSON:', event.data)
      return // Exit the function as the data is not JSON.
    }
    if (serverWebSocket.current === null) {
      setupWebSocket()
    }

    // Check if the parsed event data contains the required properties
    if (eventData !== null && 'id' in eventData && 'userUID' in eventData) {
      switch (eventData.id) {
        case 'init':
          const { userUID: initUserUID } = eventData
          currentUserId.current = initUserUID
          // Fetch user document from Firestore
          getDoc(doc(firestore, 'users', initUserUID)).then(userDoc => {
            if (userDoc.exists()) {
              const userPlaySpeed = userDoc.data().userPlaySpeed
              if (
                userPlaySpeed !== undefined &&
                userPlaySpeed !== null &&
                userPlaySpeed !== '' &&
                typeof userPlaySpeed === 'number'
              ) {
                playSpeed.current = userDoc.data().userPlaySpeed
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    concept: 'playSpeedChange',
                    message: playSpeed.current
                  })
                )
              }
            }
          })
          // Handle WebSocket initialization or fallback to REST API call
          if (serverWebSocket.current !== null) {
            try {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  concept: 'Sent to init wait init',
                  message: initUserUID
                })
              )
              await waitForWebSocket()
            } catch (error) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  concept: 'Sent to init error',
                  message: initUserUID
                })
              )
            }

            // Check if WebSocket is open and send init message
            if (serverWebSocket.current.readyState === WebSocket.OPEN) {
              serverWebSocket.current.send(
                JSON.stringify({
                  action: 'init',
                  data: {
                    userUID: initUserUID
                  }
                })
              )
            }
          } else {
            setupWebSocket(initUserUID)
            // Fallback to REST API call if WebSocket is not available
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                concept: 'Sent to init REST',
                message: initUserUID
              })
            )

            fetch(
              'https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/connect-class',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userUID: initUserUID
                })
              }
            )
              .then(response => response.json())
              .then(data => {
                const { lessonId } = JSON.parse(data.body) // Parse the JSON string in data.body
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ concept: 'lessonId', message: lessonId })
                )
                startLesson(lessonId, initUserUID)
              })
              .catch(error => {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    concept: `Error in rest ${error} RESPONSE `,
                    message: error.message
                  })
                )
                console.error('Error:', error)
              })
          }
          break
        case 'message':
          sendMessageToWebview({
            concept: 'message',
            message: eventData.userUID
          })
          const {
            content,
            userUID: audioUserUID,
            type: messageType
          } = eventData
          const userRef = doc(firestore, 'users', audioUserUID)
          let lessonId = ''
          getDoc(userRef)
            .then(doc => {
              if (doc.exists()) {
                const user = doc.data()
                lessonId = user.selectedClass
                if (isIntro) {
                  // if (messageType == "text") {
                  //     window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "Preferences", "message": content + " " + lessonId }));
                  //     updateDoc(doc(firestore, "lessons", lessonId), {
                  //         Preferences: content
                  //     });
                  //     window.ReactNativeWebView.postMessage(JSON.stringify({ "concept": "Preferences updated" }));

                  // }
                  return
                }
              } else {
                console.log('No such document!')
              }
            })
            .catch(error => {
              console.log('Error getting document:', error)
            })
          // check if content has a <end> tag
          sendMessage(content, audioUserUID, lessonId, messageType)
          break
        case 'resume':
          bounceRef.current = Math.floor(Date.now() / 1000)
          sendMessageToWebview({
            concept: 'bounceUpdated',
            message: bounceRef.current
          })
          sendMessageToWebview({ concept: 'Class was resumed' })
          processSpeakQueue()
          head.current.startSpeaking(true)
          isPaused.current = false
          isInExercise.current = null
          isInAudioEval.current = false
          break
        case 'subtitles':
          sendMessageToWebview({ concept: 'subtitlos', message: eventData })
          const { isSubtitlesActive } = eventData
          if (isSubtitlesActive) {
            setIsSubtitlesActive(true)
          } else {
            setIsSubtitlesActive(false)
          }
          break
        case 'keyboard':
          const { isActive } = eventData
          if (isActive) {
            setIsKeyboardOpen(true)
          } else {
            setIsKeyboardOpen(false)
          }
          break
        case 'pause':
          head.current.pauseSpeaking()
          isPaused.current = true
          break
        case 'playSpeed':
          const { newSpeed } = eventData
          playSpeed.current = newSpeed
          break
        default:
          console.log('No matching ID found')
          break
      }
    } else {
      console.log(
        'Received event without id or not in expected format:',
        eventData
      )
    }
  }
  window.handleReactMessage = async event => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ concept: 'event', message: event })
    )
    if (!head.current) {
      reactQueue.current.push(event)
      return
    }
    await processEvent(event)
  }
  const initTalkingHead = async (
    nodeAvatar,
    url = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png'
  ) => {
    if (!nodeAvatar) return
    const newHead = new TalkingHead(nodeAvatar, {
      ttsEndpoint:
        'https://texttospeech.googleapis.com/v1beta1/text:synthesize',
      ttsApikey: 'AIzaSyCThnj2tzZAo_m7LvK8-dkIHzuxAzDnAzo', // Change this
      cameraView: 'upper'
    })
    console.log('Head' + head)
    console.log(head)
    try {
      console.log('Trying')
      await newHead.showAvatar(
        {
          url: url,
          body: 'F',
          avatarMood: 'neutral',
          ttsLang: 'en-GB',
          ttsVoice: 'en-GB-Wavenet-F',
          lipsyncLang: 'en'
        },
        ev => {
          if (ev.lengthComputable) {
            let val = Math.min(100, Math.round((ev.loaded / ev.total) * 100))
            setLoadingMessage('Loading ' + val + '%')
          }
        }
      )
      head.current = newHead
      while (reactQueue.current.length > 0) {
        const event = reactQueue.current.shift()
        await processEvent(event)
      }
      serverWebSocket.current = new WebSocket(
        'wss://bl2elj9f14.execute-api.us-west-1.amazonaws.com/production/'
      )
      serverWebSocket.current.onopen = () => {
        setWebSocketReady(true) // Update connection status
        // Send queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift() // Remove the first message from the queue
          sendMessageToWebview({
            concept: 'MESSAGE',
            message: messageQueue.current
          })
          sendWebSocketMessage(message) // Implement this function to send a message through the WebSocket
        }
      }
      serverWebSocket.current.onclose = () => {
        console.log('Connection closed')
      }
      serverWebSocket.current.onmessage = handleMessageFromServer
      setLoadingMessage('')
    } catch (error) {
      console.log(error)
      setLoadingMessage(error.toString())
    }
  }

  const setupWebSocket = () => {
    serverWebSocket.current = new WebSocket(
      'wss://bl2elj9f14.execute-api.us-west-1.amazonaws.com/production/'
    )
    serverWebSocket.current.onopen = () => {
      setWebSocketReady(true) // Update connection status
      processMessageQueue() // Send queued messages
      serverWebSocket.current.send(
        JSON.stringify({
          action: 'getConnectionId',
          data: {
            userUID: currentUserId.current
          }
        })
      )
    }
    serverWebSocket.current.onclose = () => {
      console.log('Connection closed. Attempting to reconnect...')
      setTimeout(setupWebSocket, 5000) // Attempt to reconnect after 5 seconds
    }
    serverWebSocket.current.onerror = error => {
      console.log('WebSocket error: ', error)
      serverWebSocket.current.close()
    }
    serverWebSocket.current.onmessage = handleMessageFromServer
  }

  const processMessageQueue = () => {
    while (messageQueue.current.length > 0) {
      const message = messageQueue.current.shift() // Remove the first message from the queue
      sendWebSocketMessage(message) // Send the message through the WebSocket
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        maxWidth: '100%',
        width: '100%',
        height: 'calc(100vh - 64px)', // Changed to viewport height to ensure it covers the whole screen
        margin: '0 auto', // Updated for consistency, though 'auto' was fine for horizontal centering
        backgroundPosition: 'center', // Center the background image
        backgroundSize: 'cover', // Ensure the image covers the whole area
        backgroundImage: `url(${localImage})`, // Use backticks here
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div
        id="avatar"
        ref={avatarRef}
        style={{
          minWidth: '400px',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      />
      {loadingMessage ? <Loading message={loadingMessage} /> : null}
      {subtitles !== '' && isSubtitlesActive ? (
        <Subtitles
          subtitles={subtitles}
          isKeyboardOpen={isKeyboardOpen}
          fontSize={fontSize}
        />
      ) : null}
    </div>
  )
}

export default TalkingHeadComponent
