// DOM Elements
const tosStatus = document.getElementById('tos-status')
const serverStatus = document.getElementById('server-status')
const wsUrl = document.getElementById('ws-url')
const urlInput = document.getElementById('url-input')
const clientCount = document.getElementById('client-count')
const subCount = document.getElementById('sub-count')
const logsContainer = document.getElementById('logs')
const connectTosBtn = document.getElementById('connect-tos-btn')
const copyBtn = document.getElementById('copy-btn')
const clearLogsBtn = document.getElementById('clear-logs-btn')
const restartBtn = document.getElementById('restart-btn')

// Update UI Elements
const versionDisplay = document.getElementById('version-display')
const updateBanner = document.getElementById('update-banner')
const updateMessage = document.getElementById('update-message')
const updateBtn = document.getElementById('update-btn')

// Update state
let updateInfo = null
let updateDownloaded = false

// Initialize
async function init() {
  // Get and display version
  const version = await window.updater.getVersion()
  versionDisplay.textContent = `v${version}`

  // Get initial status
  const status = await window.bridge.getStatus()
  updateUI(status)

  // Subscribe to log updates
  window.bridge.onLog((log) => {
    addLog(log)
  })

  // Subscribe to status updates
  window.bridge.onStatus((status) => {
    updateUI(status)
  })

  // Subscribe to update events
  window.updater.onAvailable((info) => {
    updateInfo = info
    updateBanner.classList.remove('hidden')
    updateMessage.textContent = `Update available: v${info.version}`
    updateBtn.textContent = 'Download'
  })

  window.updater.onProgress((progress) => {
    updateBanner.classList.remove('hidden')
    updateBanner.classList.add('downloading')
    updateMessage.textContent = `Downloading: ${progress.percent}%`
    updateBtn.textContent = `${progress.percent}%`
    updateBtn.disabled = true
  })

  window.updater.onDownloaded((info) => {
    updateDownloaded = true
    updateBanner.classList.remove('downloading')
    updateBanner.classList.add('ready')
    updateMessage.textContent = `v${info.version} ready to install`
    updateBtn.textContent = 'Restart'
    updateBtn.disabled = false
  })

  window.updater.onError((error) => {
    console.error('Update error:', error)
    updateBanner.classList.add('hidden')
  })

  // Update button handler
  updateBtn.addEventListener('click', async () => {
    if (updateDownloaded) {
      window.updater.install()
    } else if (updateInfo) {
      updateBtn.disabled = true
      updateBtn.textContent = 'Starting...'
      await window.updater.download()
    }
  })

  // Button handlers
  connectTosBtn.addEventListener('click', async () => {
    connectTosBtn.disabled = true
    connectTosBtn.textContent = 'Connecting...'
    const result = await window.bridge.connectTOS()
    connectTosBtn.disabled = false
    connectTosBtn.textContent = result ? 'Connected' : 'Connect to TOS'
  })

  copyBtn.addEventListener('click', () => {
    urlInput.select()
    document.execCommand('copy')
    copyBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyBtn.textContent = 'Copy'
    }, 2000)
  })

  clearLogsBtn.addEventListener('click', () => {
    logsContainer.innerHTML = ''
  })

  restartBtn.addEventListener('click', async () => {
    restartBtn.disabled = true
    restartBtn.textContent = 'Restarting...'
    await window.bridge.restartBridge()
    setTimeout(() => {
      restartBtn.disabled = false
      restartBtn.textContent = 'Restart Bridge'
    }, 2000)
  })

  // Poll for subscription count
  setInterval(async () => {
    const subs = await window.bridge.getSubscriptions()
    subCount.textContent = subs.length
  }, 2000)
}

// Update UI with status
function updateUI(status) {
  // TOS status
  if (status.tosConnected !== undefined) {
    tosStatus.textContent = status.tosConnected ? 'Connected' : 'Disconnected'
    tosStatus.className = `status-badge ${status.tosConnected ? 'connected' : 'disconnected'}`
    connectTosBtn.textContent = status.tosConnected ? 'Connected' : 'Connect to TOS'
    connectTosBtn.disabled = status.tosConnected
  }

  // Server status
  if (status.serverRunning !== undefined) {
    serverStatus.textContent = status.serverRunning ? 'Running' : 'Stopped'
    serverStatus.className = `status-badge ${status.serverRunning ? 'connected' : 'disconnected'}`
  }

  // WebSocket URL
  if (status.wsUrl) {
    wsUrl.textContent = status.wsUrl
    urlInput.value = status.wsUrl
  } else if (status.serverRunning === false) {
    wsUrl.textContent = 'Not running'
    urlInput.value = 'Not running'
  }

  // Client count
  if (status.clientCount !== undefined) {
    clientCount.textContent = status.clientCount
  }

  // Subscription count
  if (status.subscriptionCount !== undefined) {
    subCount.textContent = status.subscriptionCount
  }
}

// Add log entry
function addLog(log) {
  const entry = document.createElement('div')
  entry.className = `log-entry ${log.type}`
  entry.innerHTML = `
    <span class="log-time">${log.timestamp}</span>
    <span class="log-message">${log.message}</span>
  `
  logsContainer.appendChild(entry)
  logsContainer.scrollTop = logsContainer.scrollHeight
}

// Start
init()
