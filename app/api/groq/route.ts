import Groq from 'groq-sdk'
import create_response from '@/lib/api/create_response'
import { Readable } from 'stream'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function convertWebReadableStreamToNodeReadable(webStream: any) {
  const reader = webStream.getReader()

  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read()
        if (done) {
          this.push(null) // No more data
        } else {
          this.push(value) // Push the chunk into the Node.js Readable stream
        }
      } catch (error) {
        this.emit('error', error)
      }
    }
  })
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    )
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', err => reject(err))
  })
}

export async function POST(request: any) {
  const formData = await request.formData()
  const audioFile = formData.get('audio') // Get the file from formData

  if (!audioFile) {
    throw new Error('No audio file found in the request')
  }

  const nodeReadableStream = convertWebReadableStreamToNodeReadable(
    audioFile.stream()
  )
  const fileBuffer = await streamToBuffer(nodeReadableStream) // Convert the stream to a buffer

  // Create a FileLike object
  const fileLikeObject = {
    lastModified: Date.now(),
    name: 'audio-file.webm', // You may want to dynamically determine the file type or name
    size: fileBuffer.length,
    type: 'audio/webm',
    text: async () => fileBuffer.toString(),
    arrayBuffer: async () => fileBuffer.buffer,
    // @ts-expect-error - The slice method is not part of the FileLike interface
    slice: (start, end, contentType) => {
      return new Blob([fileBuffer.slice(start, end)], { type: contentType })
    },
    stream: () => Readable.from(fileBuffer)
  }

  const transcriptionText = await groq.audio.transcriptions.create({
    // @ts-expect-error - The file property we had to cohese to a FileLike object
    file: fileLikeObject,
    model: 'distil-whisper-large-v3-en',
    prompt: 'Specify context or spelling',
    response_format: 'json',
    language: 'en',
    temperature: 0.0
  })

  console.log(transcriptionText)
  return create_response({
    request,
    data: { transcription: transcriptionText },
    status: 200
  })
}
