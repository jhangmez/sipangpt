import Header from '@Components/(private)/Header'
import Sidebar from '@Components/(private)/Sidebar'
import ChatInterface from '@Components/(private)/ChatInterference'

export default function Home() {
  return (
    <main className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex flex-col w-full'>
        <Header />
        <div className='flex-grow overflow-hidden'>
          <ChatInterface />
        </div>
      </div>
    </main>
  )
}
