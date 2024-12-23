// fonts.ts
import localFont from 'next/font/local'

// Font-Fraunces
export const fontFraunces = localFont({
  src: [
    {
      path: '../../public/fonts/Fraunces-VariableFont.ttf',
      weight: '100 900',
      style: 'normal'
    },
    {
      path: '../../public/fonts/Fraunces-Italic-VariableFont.ttf',
      weight: '100 900',
      style: 'italic'
    }
  ],
  variable: '--font-frances',
  display: 'swap'
})

// Font-Exo2
export const fontExo2 = localFont({
  src: [
    {
      path: '../../public/fonts/Exo2-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'normal'
    },
    {
      path: '../../public/fonts/Exo2-Italic-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'italic'
    }
  ],
  variable: '--font-exo',
  display: 'swap'
})
