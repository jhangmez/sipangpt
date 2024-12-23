'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { Feedback } from '@prisma/client'
import { ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage } from '@/components/ui/avatar'

interface FeedbackWithUser extends Feedback {
  user?: {
    image?: string | null
    email?: string | null
  } | null
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false) // Nuevo estado para indicar si se está buscando nuevos feedbacks
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 5
  const latestFeedbackId = useRef<string | null>(null)

  useEffect(() => {
    const fetchFeedbacks = async () => {
      // Solo mostrar el skeleton la primera vez que se carga la página
      if (feedbacks.length === 0) {
        setIsLoading(true)
      }
      setIsFetching(true)
      try {
        const response = await fetch(
          `/api/feedback?page=${page}&limit=${limit}`
        )
        const data = await response.json()

        if (feedbacks.length === 0) {
          // Si es la primera carga, establecer los feedbacks y el ID del último feedback
          setFeedbacks(data.feedbacks)
          latestFeedbackId.current =
            data.feedbacks.length > 0 ? data.feedbacks[0].id : null
        } else {
          // Si no es la primera carga, comparar y agregar solo los nuevos feedbacks
          const newFeedbacks = data.feedbacks.filter(
            (fb: FeedbackWithUser) => !feedbacks.some((f) => f.id === fb.id)
          )

          if (newFeedbacks.length > 0) {
            setFeedbacks((prevFeedbacks) =>
              [...newFeedbacks, ...prevFeedbacks].slice(0, limit)
            ) // Mantener el límite
            latestFeedbackId.current = newFeedbacks[0].id
          }
        }

        setTotal(data.total)
      } catch (error) {
        console.error('Error fetching feedback:', error)
      } finally {
        setIsLoading(false)
        setIsFetching(false) // Indicar que la búsqueda de nuevos feedbacks ha finalizado
      }
    }

    fetchFeedbacks()

    const intervalId = setInterval(fetchFeedbacks, 100000)

    return () => clearInterval(intervalId)
  }, [page, feedbacks.length]) // Dependencia en feedbacks.length

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    latestFeedbackId.current = null
    setFeedbacks([]) // Limpiar los feedbacks actuales al cambiar de página
    setIsLoading(true)
  }

  const hasPreviousPage = page > 1
  const hasNextPage = page < Math.ceil(total / limit)

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList className='font-exo'>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href='/admin/dashboard'>Datos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Feedback</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <h1 className='font-frances text-3xl font-bold'>Feedback</h1>
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='font-frances'>Usuario</TableHead>
                <TableHead className='font-frances'>Feedback</TableHead>
                <TableHead className='font-frances'>Puntuación</TableHead>
                <TableHead className='font-frances'>Fecha</TableHead>
                <TableHead className='font-frances text-right'>
                  Enlace
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Mostrar skeletons solo si isLoading es true */}
              {isLoading ? (
                Array.from({ length: limit }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-8 w-8 rounded-full' />
                        <Skeleton className='h-4 w-20' />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-12' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Skeleton className='h-4 w-10' />
                    </TableCell>
                  </TableRow>
                ))
              ) : feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {feedback.user?.image && (
                          <Avatar>
                            <AvatarImage
                              src={feedback.user.image}
                              alt='User Avatar'
                              width={32}
                              height={32}
                              className='object-contain'
                            />
                          </Avatar>
                        )}
                        <span className='font-exo'>
                          {feedback.user?.email ?? 'Anónimo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='font-exo max-w-[300px] truncate'>
                      {feedback.messageIndex &&
                      typeof feedback.messageIndex === 'number'
                        ? `Pregunta N° ${feedback.messageIndex}`
                        : 'No disponible'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {feedback.messageIndex ?? 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-exo'>
                      {new Date(feedback.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Link href={feedback.url} target='_blank'>
                        <Button variant='outline' size='icon'>
                          <ExternalLinkIcon className='h-4 w-4' />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center font-exo text-muted-foreground'
                  >
                    No hay feedback disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Paginación */}
          <div className='flex items-center justify-center space-x-2 py-4'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handlePageChange(page - 1)}
              disabled={!hasPreviousPage || isLoading}
            >
              <ChevronLeftIcon className='h-4 w-4' />
            </Button>
            <span className='font-exo'>
              Página {page} de {Math.ceil(total / limit)}
            </span>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage || isLoading}
            >
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
