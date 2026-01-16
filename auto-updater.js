// Auto-updater module for automatic app updates via GitHub Releases
const { autoUpdater } = require('electron-updater')
const { BrowserWindow, ipcMain, app } = require('electron')

// Configure logging
autoUpdater.logger = console
autoUpdater.autoDownload = false  // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true  // Install on quit if downloaded

let mainWindow = null

// Send status to renderer
function sendStatusToWindow(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

// Register version handler immediately
ipcMain.handle('updater:getVersion', () => {
  return app.getVersion()
})

// Initialize auto-updater
function initAutoUpdater(window) {
  mainWindow = window

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    console.log('[AutoUpdater] Checking for updates...')
    autoUpdater.checkForUpdates().catch(err => {
      console.error('[AutoUpdater] Error checking for updates:', err)
    })
  }, 5000)

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for update...')
    sendStatusToWindow('updater:checking')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    sendStatusToWindow('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] No update available. Current version:', app.getVersion())
    sendStatusToWindow('updater:not-available', {
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err)
    sendStatusToWindow('updater:error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    console.log(`[AutoUpdater] Download progress: ${percent}%`)
    sendStatusToWindow('updater:progress', {
      percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version)
    sendStatusToWindow('updater:downloaded', {
      version: info.version
    })
  })

  // IPC handlers for renderer to control updates
  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, updateInfo: result?.updateInfo }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('updater:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

module.exports = { initAutoUpdater }
