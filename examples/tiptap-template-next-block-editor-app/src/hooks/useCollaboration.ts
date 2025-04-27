import { TiptapCollabProvider } from '@hocuspocus/provider'
import { useEffect, useState } from 'react'
import { Doc as YDoc } from 'yjs'

function getProvider({ docId, token, yDoc }: { docId: string; token: string; yDoc: YDoc }) {
  return new TiptapCollabProvider({
    name: `${process.env.NEXT_PUBLIC_COLLAB_DOC_PREFIX}${docId}`,
    appId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID ?? '',
    token: token,
    document: yDoc,
  })
}

export const useCollaboration = ({ docId, enabled = true }: { docId: string; enabled?: boolean }) => {
  const [provider, setProvider] = useState<
    | { state: 'loading' | 'idle'; provider: null; yDoc: null }
    | { state: 'loaded'; provider: TiptapCollabProvider; yDoc: YDoc }
  >(() => ({ state: enabled ? 'loading' : 'idle', provider: null, yDoc: null }))
  useEffect(() => {
    let isMounted = true
    // fetch data
    const dataFetch = async () => {
      try {
        setProvider(prev =>
          // Start loading if not already
          prev.state === 'loading'
            ? prev
            : {
                state: 'loading',
                provider: null,
                yDoc: null,
              },
        )

        // Get the collaboration token from the backend
        const response = await fetch('/api/collaboration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment')
        }
        const data = await response.json()

        if (!isMounted) {
          return
        }

        const { token } = data

        const yDoc = new YDoc()
        // set state when the data received
        setProvider({ state: 'loaded', provider: getProvider({ docId, token, yDoc }), yDoc })
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message)
        }
        if (!isMounted) {
          return
        }
        setProvider({ state: 'idle', provider: null, yDoc: null })
        return
      }
    }

    // If enabled, fetch the data
    if (enabled) {
      dataFetch()
    }
    return () => {
      isMounted = false
    }
  }, [docId, enabled])

  return provider
}
