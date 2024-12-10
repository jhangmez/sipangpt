'use client'

import { useEffect, useState } from 'react'

const RequestContador = () => {
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    errors: 0,
    timeouts: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/contador')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    // Actualiza las estadísticas cada 10 segundos
    const interval = setInterval(fetchStats, 10000)
    fetchStats() // Llama una vez al montar
    return () => clearInterval(interval) // Limpia el intervalo al desmontar
  }, [])

  return (
    <div>
      <h2>Estadísticas de Peticiones</h2>
      <p>Total de peticiones: {stats.total}</p>
      <p>Éxitos (200): {stats.success}</p>
      <p>Errores (500): {stats.errors}</p>
      <p>Timeouts (408): {stats.timeouts}</p>
    </div>
  )
}

export default RequestContador
