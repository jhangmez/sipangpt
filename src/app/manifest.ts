import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SipánGPT by @jhangmez',
    short_name: 'SipánGPT',
    description: 'SipánGPT by @jhangmez',
    start_url: '/',
    display: 'standalone',
    background_color: '#333333',
    theme_color: '#5FED00',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '128x128',
        type: 'image/x-icon'
      }
    ]
  }
}
