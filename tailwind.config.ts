import type { Config } from 'tailwindcss'
const { nextui } = require('@nextui-org/react')

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(125, 250, 0)', // #7dfa00
        background: 'rgb(51, 51, 51)', // #333333
        onPrimary: 'rgb(51, 51, 51)', // #333333
        secondary: 'rgb(95,237,0)',
        'gray-100': 'rgb(240, 240, 240)', // #f0f0f0
        'gray-200': 'rgb(220, 220, 220)', // #dcdcdc
        'gray-300': 'rgb(190, 190, 190)', // #bebebe
        error: '#BA1A1A',
        onError: '#FFFFFF',
        errorContainer: '#FFDAD6',
        onErrorContainer: '#410002'
      },
      fontFamily: {
        exo: ['"Exo 2"', 'system-ui'],
        frances: ['"Fraunces"', 'system-ui']
      }
    }
  },
  plugins: [nextui()]
}
export default config
