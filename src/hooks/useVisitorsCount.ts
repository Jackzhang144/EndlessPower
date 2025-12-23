import { useState, useEffect, useRef } from 'react'

export const useVisitorsCount = () => {
  const [visitorsCount, setVisitorsCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (navigator.webdriver) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/visitors`
    
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl)
        
        wsRef.current.onopen = () => {
          setIsConnected(true)
        }
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'userCount') {
              setVisitorsCount(data.count)
            }
          } catch (error) {
            console.warn('Failed to parse WebSocket message:', error)
          }
        }
        
        wsRef.current.onclose = () => {
          setIsConnected(false)
          // 3秒后重连
          setTimeout(connectWebSocket, 3000)
        }
        
        wsRef.current.onerror = () => {
          setIsConnected(false)
        }
      } catch (error) {
        console.warn('Failed to connect to visitors WebSocket:', error)
        setIsConnected(false)
        // 5秒后重连
        setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    // 清理函数
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { visitorsCount, isConnected }
}
