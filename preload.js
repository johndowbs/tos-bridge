const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bridge', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  connectTOS: () => ipcRenderer.invoke('connect-tos'),
  restartBridge: () => ipcRenderer.invoke('restart-bridge'),
  getSubscriptions: () => ipcRenderer.invoke('get-subscriptions'),

  onLog: (callback) => {
    const handler = (event, log) => callback(log)
    ipcRenderer.on('log', handler)
    return () => ipcRenderer.removeListener('log', handler)
  },

  onStatus: (callback) => {
    const handler = (event, status) => callback(status)
    ipcRenderer.on('status', handler)
    return () => ipcRenderer.removeListener('status', handler)
  }
})

// Expose updater API
contextBridge.exposeInMainWorld('updater', {
  getVersion: () => ipcRenderer.invoke('updater:getVersion'),
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),

  onAvailable: (callback) => {
    const handler = (event, info) => callback(info)
    ipcRenderer.on('updater:available', handler)
    return () => ipcRenderer.removeListener('updater:available', handler)
  },
  onDownloaded: (callback) => {
    const handler = (event, info) => callback(info)
    ipcRenderer.on('updater:downloaded', handler)
    return () => ipcRenderer.removeListener('updater:downloaded', handler)
  },
  onProgress: (callback) => {
    const handler = (event, progress) => callback(progress)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  },
  onError: (callback) => {
    const handler = (event, error) => callback(error)
    ipcRenderer.on('updater:error', handler)
    return () => ipcRenderer.removeListener('updater:error', handler)
  }
})
