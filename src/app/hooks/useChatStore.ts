import { CoreMessage } from 'ai'
import { create } from 'zustand'

interface State {
  messages: CoreMessage[]
}

interface Actions {
  setMessages: (fn: (messages: CoreMessage[]) => CoreMessage[]) => void
}

const useChatStore = create<State & Actions>()((set) => ({
  messages: [],
  setMessages: (fn) => set((state) => ({ messages: fn(state.messages) }))
}))

export default useChatStore
