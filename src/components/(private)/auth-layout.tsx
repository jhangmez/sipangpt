import { FC, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps {
  children: ReactNode
  title: string
}

export const AuthLayout: FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className='flex items-center justify-center min-h-screen bg-background'>
      <Card className='w-[350px]'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold text-center text-primary font-frances'>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
