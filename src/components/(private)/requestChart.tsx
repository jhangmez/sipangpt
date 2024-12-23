'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface RequestData {
  successful: number
  failed: number
  time: string
}

export function RequestChart() {
  const [data, setData] = useState<RequestData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastUpdateTime = useRef<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // Solo mostrar el skeleton la primera vez
      if (data.length === 0) {
        setIsLoading(true)
      }

      try {
        const response = await fetch('/api/requests')
        if (response.ok) {
          const newPoint: RequestData = await response.json()

          // Comprobar si el nuevo punto es más reciente
          const newPointTime = new Date(newPoint.time).getTime()
          if (
            !lastUpdateTime.current ||
            newPointTime > lastUpdateTime.current
          ) {
            setData((prevData) => {
              const fiveMinutesAgo = new Date(
                Date.now() - 3 * 60 * 1000
              ).getTime()
              const filteredData = prevData.filter(
                (point) => new Date(point.time).getTime() > fiveMinutesAgo
              )
              return [...filteredData, newPoint]
            })
            lastUpdateTime.current = newPointTime
          }
        } else {
          console.error('Error fetching request data')
        }
      } catch (error) {
        console.error('Error fetching request data:', error)
      } finally {
        // Solo ocultar el skeleton si era la carga inicial
        if (data.length === 0) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    const intervalId = setInterval(fetchData, 3000)

    return () => clearInterval(intervalId)
  }, [data.length]) // Dependencia en data.length

  const formatXAxis = (tickItem: string) => {
    return new Date(tickItem).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleExport = async (range: string) => {
    try {
      const response = await fetch(`/api/export-logs?range=${range}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download =
          response.headers.get('Content-Disposition')?.split('filename=')[1] ||
          `log_${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Error exporting logs')
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  return (
    <Card className='col-span-full md:col-span-6'>
      <CardHeader>
        <CardTitle className='font-frances text-2xl'>
          Peticiones al servidor
        </CardTitle>
        <CardDescription className='font-exo'>
          Peticiones en los últimos 5 minutos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-[350px]'>
            <Skeleton className='h-full w-full' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id='colorUv' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#82ca9d' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='#82ca9d' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='colorPv' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#ff758f' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='#ff758f' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='#ccc' />
              <XAxis
                dataKey='time'
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12, fill: '#666' }}
                className='font-exo'
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#666' }}
                className='font-exo'
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#222',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  padding: '10px'
                }}
                labelStyle={{ color: '#fff', fontFamily: 'Exo' }}
                itemStyle={{ color: '#fff', fontFamily: 'Exo' }}
              />
              <Area
                type='monotone'
                dataKey='successful'
                stroke='#82ca9d'
                fillOpacity={1}
                fill='url(#colorUv)'
                style={{ color: '#fff', fontFamily: 'Exo' }}
                name='Exitosas'
              />
              <Area
                type='monotone'
                dataKey='failed'
                stroke='#ff758f'
                fillOpacity={1}
                fill='url(#colorPv)'
                style={{ color: '#fff', fontFamily: 'Exo' }}
                name='Fallidas'
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter className='flex flex-wrap justify-end gap-2'>
        <Button
          variant='outline'
          className='font-frances text-primary whitespace-nowrap'
          onClick={() => handleExport('1h')}
        >
          1 Hora
        </Button>
        <Button
          variant='outline'
          className='font-frances text-primary whitespace-nowrap'
          onClick={() => handleExport('7h')}
        >
          7 Horas
        </Button>
        <Button
          variant='outline'
          className='font-frances text-primary whitespace-nowrap'
          onClick={() => handleExport('24h')}
        >
          24 Horas
        </Button>
        <Button
          variant='outline'
          className='font-frances text-primary whitespace-nowrap'
          onClick={() => handleExport('all')}
        >
          Todo
        </Button>
      </CardFooter>
    </Card>
  )
}
