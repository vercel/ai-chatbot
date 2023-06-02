import { useEffect, useRef } from 'react'

const scrollToEnd = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    left: 0
  })
}

export function useFollowScroll(shouldFollow: boolean) {
  const shouldFollowRef = useRef(shouldFollow)
  const scrollRef = useRef(false)
  const triggeredBySelfRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (triggeredBySelfRef.current) {
        triggeredBySelfRef.current = false
        return
      }
      scrollRef.current = true
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!scrollRef.current && shouldFollowRef.current) {
      setTimeout(() => {
        triggeredBySelfRef.current = true
        scrollToEnd()
      })
    }
  })

  useEffect(() => {
    shouldFollowRef.current = shouldFollow
    if (!shouldFollow) {
      // Reset scrollRef
      scrollRef.current = false
    }
  }, [shouldFollow])
}
