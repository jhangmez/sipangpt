export interface Server {
  key: string
  name: string
  url: string
}
export interface MessageCustom {
  type: 'user' | 'admin' | 'bot' | 'feedback' | 'form'
  content: string
}
