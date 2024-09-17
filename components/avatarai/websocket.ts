// utils/websocket.js

export const setupWebSocket = ({
  serverWebSocket,
  setWebSocketReady,
  processMessageQueue,
  handleMessageFromServer,
  currentUserId
}: {
  serverWebSocket: any
  setWebSocketReady: any
  processMessageQueue: any
  handleMessageFromServer: any
  currentUserId: any
}) => {
  serverWebSocket.current = new WebSocket(
    'wss://bl2elj9f14.execute-api.us-west-1.amazonaws.com/production/'
  )

  serverWebSocket.current.onopen = () => {
    setWebSocketReady(true)
    processMessageQueue()
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
    setTimeout(
      () =>
        setupWebSocket({
          serverWebSocket,
          setWebSocketReady,
          processMessageQueue,
          handleMessageFromServer,
          currentUserId
        }),
      5000
    )
  }

  serverWebSocket.current.onerror = (error: any) => {
    console.log('WebSocket error: ', error)
    serverWebSocket.current.close()
  }

  serverWebSocket.current.onmessage = handleMessageFromServer
}
