export interface Server {
  key: string
  name: string
  url: string
}
export interface Messagecustom {
  type: 'user' | 'admin' | 'bot' | 'feedback' | 'form'
  content: string
}
