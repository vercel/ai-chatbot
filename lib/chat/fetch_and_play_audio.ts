export default async function fetch_and_play_audio({ text }: { text: string }) {
  const SERVER_URL =
    'https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/testing/speak' // Use your server's IP address or domain
  try {
    const response = await fetch(
      `${SERVER_URL}?text=${encodeURIComponent(text)}`
      , {
        method: 'GET',
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      }
    )
    if (response.ok) {
      const audioContext = new window.AudioContext()
      if (!response.body) {
        return
      }
      const reader = response.body.getReader()
      // Create an empty buffer to store incoming audio chunks
      let audioChunks = []

      // Process the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        audioChunks.push(value)
      }
      console.log('Audio chunks:', audioChunks)
      // Concatenate all chunks into a single array buffer
      const audioBuffer = new Uint8Array(
        audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
      )
      let offset = 0
      for (let chunk of audioChunks) {
        audioBuffer.set(chunk, offset)
        offset += chunk.byteLength
      }
      console.log('Audio buffer:', audioBuffer)

      // Decode the audio data
      const decodedAudio = await audioContext.decodeAudioData(
        audioBuffer.buffer
      )
      // Create a buffer source
      // const source = audioContext.createBufferSource()
      // source.buffer = decodedAudio
      // source.connect(audioContext.destination)
      // source.start(0) // Play the audio
      return decodedAudio
    } else {
      console.error(`Error: ${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error fetching or playing audio:', error)
  }
}
