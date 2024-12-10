import { useState, useEffect, useCallback } from 'react'

type DataPoint = {
  timestamp: number
  value: number
}

export function useRealtimeData(
  initialData: DataPoint[],
  updateInterval: number = 1000
) {
  const [data, setData] = useState(initialData)
  const [isLive, setIsLive] = useState(true)

  const addDataPoint = useCallback((newValue: number) => {
    setData((currentData) => {
      const newData = [
        ...currentData,
        { timestamp: Date.now(), value: newValue }
      ]
      if (newData.length > 20) {
        newData.shift()
      }
      return newData
    })
  }, [])

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const newValue = Math.floor(Math.random() * 100)
      addDataPoint(newValue)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [addDataPoint, updateInterval, isLive])

  return { data, isLive, setIsLive }
}
