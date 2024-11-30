'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

enum ErrorType {
  Configuration = 'Configuration'
}

const errorMap: Record<ErrorType, React.ReactNode> = {
  [ErrorType.Configuration]: (
    <Alert variant='destructive'>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle className='font-frances'>Error de autenticación</AlertTitle>
      <AlertDescription className='font-exo'>
        Se produjo un problema al intentar autenticarse. Comuníquese con
        nosotros si el error persiste. Código de error único:
        <code className='ml-1 rounded-sm bg-destructive-foreground/10 p-1 text-xs font-mono'>
          Configuration
        </code>
      </AlertDescription>
    </Alert>
  )
}

export default function AuthErrorPage() {
  const search = useSearchParams()
  const error = search.get('error') as ErrorType

  return (
    <div className='flex min-h-screen w-full items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-center font-frances'>
            Algo pasó...
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMap[error] || (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle className='text-center font-frances'>
                Error
              </AlertTitle>
              <AlertDescription className='text-center font-exo'>
                Por favor contáctenos si este error persiste.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
