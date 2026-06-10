import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  receive: (channel: string, func: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  },
  invoke: (channel: string, data: unknown) => {
    return ipcRenderer.invoke(channel, data)
  }
})
