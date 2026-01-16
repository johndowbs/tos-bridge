const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const readline = require('readline')
const { initAutoUpdater } = require('./auto-updater')

let mainWindow = null
let tray = null
let isQuitting = false
let bridgeProcess = null
let currentStatus = {
  tosConnected: false,
  serverRunning: false,
  clientCount: 0,
  subscriptionCount: 0,
  wsUrl: null,
  port: 8765,
  localIP: null
}

// Send log to renderer
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const logEntry = { timestamp, message, type }
  console.log(`[${timestamp}] ${message}`)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log', logEntry)
  }
}

// Send status update to renderer
function updateStatus(status) {
  Object.assign(currentStatus, status)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status', currentStatus)
  }
}

// Start the bridge worker process
function startBridgeWorker() {
  if (bridgeProcess) {
    return
  }

  const workerPath = path.join(__dirname, 'bridge-worker.js')

  // Use system Node.js to run the worker
  // This allows winax to work properly
  // Set NODE_PATH so system Node.js can find modules in the app's node_modules
  const nodeModulesPath = path.join(__dirname, 'node_modules')
  bridgeProcess = spawn('node', [workerPath], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_PATH: nodeModulesPath
    }
  })

  log('Starting bridge worker...', 'info')

  // Read output line by line
  const rl = readline.createInterface({
    input: bridgeProcess.stdout,
    crlfDelay: Infinity
  })

  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line)
      if (msg.type === 'log') {
        log(msg.message, msg.logType)
      } else if (msg.type === 'status') {
        updateStatus(msg)
      }
    } catch (error) {
      // Not JSON, just log it
      if (line.trim()) {
        console.log('[Worker]', line)
      }
    }
  })

  bridgeProcess.stderr.on('data', (data) => {
    const text = data.toString().trim()
    if (text) {
      log(`Worker error: ${text}`, 'error')
    }
  })

  bridgeProcess.on('close', (code) => {
    log(`Bridge worker exited with code ${code}`, code === 0 ? 'info' : 'error')
    bridgeProcess = null
    updateStatus({
      tosConnected: false,
      serverRunning: false,
      clientCount: 0
    })
  })

  bridgeProcess.on('error', (error) => {
    log(`Failed to start bridge worker: ${error.message}`, 'error')
    bridgeProcess = null
  })
}

// Send command to bridge worker
function sendToBridge(command) {
  if (bridgeProcess && bridgeProcess.stdin.writable) {
    bridgeProcess.stdin.write(JSON.stringify(command) + '\n')
  }
}

// Stop the bridge worker
function stopBridgeWorker() {
  if (bridgeProcess) {
    sendToBridge({ type: 'quit' })
    setTimeout(() => {
      if (bridgeProcess) {
        bridgeProcess.kill()
        bridgeProcess = null
      }
    }, 1000)
  }
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'TOS Bridge'
  })

  mainWindow.loadFile('index.html')

  // Hide to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

// Create system tray
function createTray() {
  try {
    tray = new Tray(path.join(__dirname, 'icon.ico'))
  } catch (e) {
    // Icon not found, skip tray
    console.log('Tray icon not found, skipping tray')
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => mainWindow.show()
    },
    { type: 'separator' },
    {
      label: 'Restart Bridge',
      click: () => {
        stopBridgeWorker()
        setTimeout(startBridgeWorker, 500)
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        stopBridgeWorker()
        app.quit()
      }
    }
  ])

  tray.setToolTip('TOS Bridge')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
  })
}

// App ready
app.whenReady().then(() => {
  createWindow()
  createTray()

  // Initialize auto-updater (only in production)
  if (!process.env.ELECTRON_DEV) {
    initAutoUpdater(mainWindow)
  }

  // Start the bridge worker
  startBridgeWorker()
})

// IPC handlers
ipcMain.handle('get-status', () => {
  return currentStatus
})

ipcMain.handle('connect-tos', () => {
  sendToBridge({ type: 'connect-tos' })
  return true
})

ipcMain.handle('restart-bridge', () => {
  stopBridgeWorker()
  setTimeout(startBridgeWorker, 500)
  return true
})

ipcMain.handle('get-subscriptions', () => {
  return []  // Subscriptions are managed in worker
})

// Quit handling
app.on('before-quit', () => {
  isQuitting = true
  stopBridgeWorker()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
