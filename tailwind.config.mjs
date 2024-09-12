/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        primary: 'rgb(125, 250, 0)', // #7dfa00
        background: 'rgb(51, 51, 51)', // #333333
        onPrimary: 'rgb(51, 51, 51)', // #333333
        secondary: 'rgb(95,237,0)',
        'gray-100': 'rgb(240, 240, 240)', // #f0f0f0
        'gray-200': 'rgb(220, 220, 220)', // #dcdcdc
        'gray-300': 'rgb(190, 190, 190)' // #bebebe
      },
      fontFamily: {
        exo: ['"Exo 2"', 'system-ui'],
        frances: ['"Fraunces"', 'system-ui']
      }
    }
  },

  plugins: [require('tailwindcss-animate')]
}
