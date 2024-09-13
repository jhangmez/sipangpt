import { NextUIProvider } from '@nextui-org/react'
import { ViewTransitions } from 'next-view-transitions'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransitions>
      <NextUIProvider>{children}</NextUIProvider>
    </ViewTransitions>
  )
}
