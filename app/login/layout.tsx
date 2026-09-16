import type * as React from 'react'
import type { Metadata } from 'next'

const shortTitle = 'Login'
const description = 'Chatea con SipánGPT'
const sipangpt = ' | SipánGPT'
const title = `${shortTitle}${sipangpt}`
const imageUrl = `https://jhangmez.vercel.app/api/og2?title=${encodeURIComponent(shortTitle)}&description=${encodeURIComponent(description)}`

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    url: 'https://sipangpt.xyz/login',
    images: [{ url: imageUrl }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className='min-h-screen bg-background text-foreground font-exo'>{children}</div>
}
