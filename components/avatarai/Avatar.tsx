// @ts-nocheck

import React, { useRef, useEffect } from 'react'
import { TalkingHead } from '@/components/TalkingHead/modules/talkinghead.mjs'

const Avatar = ({
  setLoadingMessage,
  avatarRef,
  head,
  reactQueue,
  processEvent,
  setupWebSocket,
  setWebSocketReady
}: {
  setLoadingMessage: any
  avatarRef: any
  head: any
  reactQueue: any
  processEvent: any
  setupWebSocket: any
  setWebSocketReady: any
}) => {
  useEffect(() => {
    const initTalkingHead = async () => {
      const nodeAvatar = avatarRef.current
      if (!nodeAvatar) return
      const newHead = new TalkingHead(nodeAvatar, {
        ttsEndpoint:
          'https://texttospeech.googleapis.com/v1beta1/text:synthesize',
        ttsApikey: 'YOUR_API_KEY',
        cameraView: 'upper'
      })

      try {
        await newHead.showAvatar(
          {
            url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
            body: 'F',
            avatarMood: 'neutral',
            ttsLang: 'en-GB',
            ttsVoice: 'en-GB-Wavenet-F',
            lipsyncLang: 'en'
          },
          ev => {
            if (ev.lengthComputable) {
              const val = Math.min(
                100,
                Math.round((ev.loaded / ev.total) * 100)
              )
              setLoadingMessage('Loading ' + val + '%')
            }
          }
        )

        head.current = newHead
        while (reactQueue.current.length > 0) {
          const event = reactQueue.current.shift()
          await processEvent(event)
        }

        setupWebSocket() // Setup WebSocket after the avatar is initialized
        setWebSocketReady(true)
        setLoadingMessage('')
      } catch (error) {
        console.log(error)
        setLoadingMessage(error.toString())
      }
    }

    initTalkingHead()
  }, [avatarRef])

  return (
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
  )
}

export default Avatar
