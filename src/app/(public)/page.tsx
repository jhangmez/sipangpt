import Header from '@Components/landing/Header'
import Hero from '@Components/landing/Hero'
import Footer from '@Components/landing/Footer'

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <Hero />
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        width='100%'
        className='bg-gray-50'
      >
        <path
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='#F0F0F0'
        ></path>
      </svg>
      <main className='flex-grow flex items-center justify-center bg-gray-50'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 font-exo'>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-sipan'>
            Pregunta lo que desees sobre la Universidad Señor de Sipán
          </h2>
        </div>
      </main>
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        version='1.1'
        width='100%'
        className='bg-gray-50'
      >
        <path
          transform='rotate(180) translate(-1440, -60)'
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='#333333'
        ></path>
      </svg>
      <Footer />
    </div>
  )
}
