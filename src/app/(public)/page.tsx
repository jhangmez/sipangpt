import Header from '@Components/(private)/Header'
import Sidebar from '@Components/(private)/Sidebar'
import ChatInterface from '@Components/(private)/ChatInterference'
import { Messagecustom } from '@/types/chat'

const messages: Messagecustom[] = [
  { type: 'user', content: 'Hola' },
  { type: 'bot', content: 'Respuesta 1' },
  { type: 'admin', content: 'Respuesta 1' },
  { type: 'admin', content: 'Respuesta 2' }, // Este no mostrará el label DTI
  { type: 'feedback', content: 'Califica tu experiencia' },
  { type: 'form', content: 'Llena el formulario' }
]

export default function Home() {
  return (
    <main className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex flex-col w-full'>
        <Header />
        <div className='flex-grow overflow-hidden'>
          <ChatInterface messages={[]} />
        </div>
      </div>
    </main>
  )
}
