const shortTitle = 'Login'
const description = 'Chatea con SipánGPT'
const sipangpt = ' | SipánGPT'
const title = `${shortTitle}${sipangpt}`
const imageUrl = `https://jhangmez.vercel.app/api/og2?title=${shortTitle}&description=${description}`

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    url: 'https://sipangpt.xyz/',
    images: [{ url: imageUrl }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl]
  }
}

export default async function LoginLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
