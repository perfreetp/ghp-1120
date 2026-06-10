/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI?: {
    send: (channel: string, data: unknown) => void
    receive: (channel: string, func: (...args: unknown[]) => void) => void
    invoke: (channel: string, data: unknown) => Promise<unknown>
  }
}
