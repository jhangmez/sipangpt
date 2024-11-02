const shortTitle = 'SipánGPT'
const description =
  'SipánGPT, Chatbot prototipo realizado por @jhangmez y la Universidad Señor de Sipán'
const jhangmez = ' | jhangmez'
const title = `${shortTitle}${jhangmez}`
const imageUrl = `https://www.jhangmez.xyz/api/og2?title=SipánGPT`

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

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
