import { useEffect, useRef, useState } from 'react'

export function useRotatingMessage(messages: string[], intervalMs = 3500) {
  const [msg, setMsg] = useState(messages[0]!)
  const idx = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      idx.current = (idx.current + 1) % messages.length
      setMsg(messages[idx.current]!)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [messages, intervalMs])
  return msg
}
