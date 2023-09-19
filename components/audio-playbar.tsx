import { use, useEffect, useRef, useState } from "react"

export interface AudioPlaybarProps {
  audioData: ArrayBuffer[]
}

export function AudioPlaybar({audioData}: AudioPlaybarProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [mediaSource] = useState<MediaSource>(new MediaSource())
  const [sourceBuffer, setSourceBuffer] = useState<SourceBuffer|null>(null)
  const [audioDataIndex, setAudioDataIndex] = useState<number>(0);
  const [queue, setQueue] = useState<ArrayBuffer[]>([]);

  // Perform one-time initialization.
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement || audioElement.src) return

    mediaSource.addEventListener('sourceopen', function() {
      console.log('Adding source buffer.')
      let sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
      setSourceBuffer(sourceBuffer)

      // Observe 'updateend' events so that we can trigger queue processing.
      let count = 0
      sourceBuffer.addEventListener('updateend', function() {
        console.log(`Source buffer update ended [count=${count}].`)
        count += 1
        setUpdateEndIndex(prevIndex => prevIndex + 1)
      })

    }, { once: true })

    audioElement.src = URL.createObjectURL(mediaSource)
  }, [mediaSource])

  // When the source buffer finishes an update (e.g. applies an audio chunk), if we've
  // queued up more audio data, append it.
  const [updateEndIndex, setUpdateEndIndex] = useState<number>(0);
  useEffect(() => {
    if (!sourceBuffer || !queue.length) return

    if (!sourceBuffer.updating) {
      console.log(`Appending queued audio data [updateEndIndex=${updateEndIndex}, queue.length=${queue.length}].`)
      sourceBuffer.appendBuffer(queue.shift() as ArrayBuffer)
    }
  }, [updateEndIndex, queue, sourceBuffer])

  // When new audio data comes in, append it to the source buffer or queue it for future appending.
  useEffect(() => {
    if (sourceBuffer && audioData.length && audioDataIndex < audioData.length) {
      console.log(`Appending audio data [audioDataIndex=${audioDataIndex}, updateEndIndex=${updateEndIndex}].`)
      if (!sourceBuffer.updating && !queue.length) {
        console.log(`Immediately appending audio data [audioDataIndex=${audioDataIndex}, updateEndIndex=${updateEndIndex}].`)
        sourceBuffer.appendBuffer(audioData[audioDataIndex])
      } else {
        setQueue(prevQueue => [...prevQueue, audioData[audioDataIndex]])
        console.log(`Queueing audio data [audioDataIndex=${audioDataIndex}, updateEndIndex=${updateEndIndex}, queue.length=${queue.length}].`)
      }
      setAudioDataIndex(prevIndex => prevIndex + 1)
    }
  }, [audioData, sourceBuffer, queue, audioDataIndex])

  // TODO(shaper):
  // - Handle potential "buffer full" errors, see also https://developer.chrome.com/blog/quotaexceedederror/
  // - Find a way to call `endofStream` when we reach completion. May need to pass sentinel from server.
  // - If gaps, try mode switching from `segments` to `sequence` and/or playing with `timestampOffset`.

  return (
    <audio style={{ height: '75%' }} ref={audioRef} controls autoPlay />
  );
}
