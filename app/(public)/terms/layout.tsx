import type * as React from 'react'
import type { Metadata } from 'next'

const shortTitle = 'Términos y Privacidad'
const description = 'Términos de uso, políticas de privacidad, propiedad intelectual y canales de auditoría de SipánGPT.'
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
    url: 'https://sipangpt.xyz/terms',
    images: [{ url: imageUrl }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
