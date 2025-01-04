import Header from '@Components/landing/Header'
import Footer from '@Components/landing/Footer'
import Hero from '@Components/landing/Hero'
import Features from '@root/src/components/landing/Features'
import Benefits from '@root/src/components/landing/Benefits'
import CallToAction from '@root/src/components/landing/CallToAction'
import AboutProject from '@root/src/components/landing/AboutProject'
import Feedback from '@root/src/components/landing/Feedback'

export default function Home() {
  return (
    <main className='flex flex-col min-h-screen'>
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
      <Features />
      <Benefits />
      <Feedback />
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        version='1.1'
        width='100%'
        className='bg-gray-50 color-change'
      >
        <path
          transform='rotate(180) translate(-1440, -60)'
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='currentColor'
        ></path>
      </svg>
      <CallToAction />
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        width='100%'
        className='bg-gray-50 color-change'
      >
        <path
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='currentColor'
        ></path>
      </svg>
      <AboutProject />
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
    </main>
  )
}
