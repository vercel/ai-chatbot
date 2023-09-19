export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export const decodeMonoMpegAudioData = (mpegData: ArrayBuffer): Promise<Float32Array> => {
  return new Promise((resolve, reject) => {
    const audioContext = new window.AudioContext()
    audioContext.decodeAudioData(mpegData, (audioBuffer) => {
      if (audioBuffer.numberOfChannels !== 1) {
        reject(new Error('Expected mono audio'))
      }
      resolve(audioBuffer.getChannelData(0))
    }, (error) => {
      reject(error)
    })
  })
}
