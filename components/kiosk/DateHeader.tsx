'use client'

import { useState, useEffect } from 'react'

export function DateHeader() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className="text-center">
      <div className="text-6xl font-bold text-white tabular-nums">{time}</div>
      <div className="text-xl text-white/60 mt-1">{date}</div>
      <div className="mt-4 text-2xl font-semibold text-white">Who's joining lunch today?</div>
    </div>
  )
}
