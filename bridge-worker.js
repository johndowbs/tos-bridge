/**
 * TOS Bridge Worker
 *
 * This runs as a separate Node.js process and communicates with the Electron app
 * via stdout/stdin. This allows winax to work with the system Node.js.
 */

const os = require('os')
const WebSocket = require('ws')

// TOS RTD connection
let rtd = null
let wss = null

// Track subscriptions and clients
const subscriptions = new Map()
const clients = new Set()

// Send message to parent (Electron)
function sendToParent(type, data) {
  process.stdout.write(JSON.stringify({ type, ...data }) + '\n')
}

// Log with type
function log(message, logType = 'info') {
  sendToParent('log', { message, logType, timestamp: new Date().toLocaleTimeString() })
}

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

// Build TOS option symbol
function buildTOSSymbol(expiration, strike, optionType) {
  const [year, month, day] = expiration.split('-')
  const shortYear = year.slice(2)
  const type = optionType === 'CALL' ? 'C' : 'P'
  return `.SPXW${shortYear}${month}${day}${type}${strike}`
}

// Initialize RTD connection to TOS
function initializeRTD() {
  try {
    // Try to load winax
    let winax
    try {
      winax = require('winax')
    } catch (loadError) {
      log('winax module not found!', 'error')
      log('Please run: npm install -g winax', 'error')
      log('Or run install-deps.bat in the app folder', 'warning')
      sendToParent('status', { tosConnected: false, needsWinax: true })
      return false
    }

    rtd = new winax.Object('tos.rtd')
    log('Connected to ThinkOrSwim RTD server', 'success')
    sendToParent('status', { tosConnected: true })
    return true
  } catch (error) {
    if (error.message.includes('Class not registered') || error.message.includes('tos.rtd')) {
      log('ThinkOrSwim RTD server not found', 'error')
      log('Make sure ThinkOrSwim is running and logged in', 'warning')
    } else {
      log(`Failed to connect to TOS RTD: ${error.message}`, 'error')
    }
    sendToParent('status', { tosConnected: false })
    return false
  }
}

// Get quote from TOS RTD
function getQuote(symbol, field) {
  if (!rtd) return null
  try {
    const value = rtd.Invoke('Quote', symbol, field)
    return value
  } catch (error) {
    return null
  }
}

// Poll subscriptions and broadcast quotes
function pollAndBroadcast() {
  if (!rtd || subscriptions.size === 0 || clients.size === 0) return

  for (const [key, sub] of subscriptions) {
    const symbol = sub.symbol

    const bid = parseFloat(getQuote(symbol, 'BID')) || 0
    const ask = parseFloat(getQuote(symbol, 'ASK')) || 0
    const last = parseFloat(getQuote(symbol, 'LAST')) || 0
    const volume = parseInt(getQuote(symbol, 'VOLUME')) || 0
    const delta = parseFloat(getQuote(symbol, 'DELTA')) || 0
    const gamma = parseFloat(getQuote(symbol, 'GAMMA')) || 0
    const theta = parseFloat(getQuote(symbol, 'THETA')) || 0
    const vega = parseFloat(getQuote(symbol, 'VEGA')) || 0
    const iv = parseFloat(getQuote(symbol, 'IMPL_VOL')) || 0

    if (bid > 0 || ask > 0 || last > 0) {
      const quote = {
        type: 'quote',
        data: {
          symbol,
          expiration: sub.expiration,
          strike: sub.strike,
          optionType: sub.optionType,
          bid,
          ask,
          last,
          volume,
          delta,
          gamma,
          theta,
          vega,
          iv,
          timestamp: Date.now()
        }
      }

      const message = JSON.stringify(quote)
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      }
    }
  }
}

// Start WebSocket server
function startServer(port = 8765) {
  if (wss) {
    wss.close()
  }

  const localIP = getLocalIP()

  wss = new WebSocket.Server({ port, host: '0.0.0.0' })

  log(`WebSocket server started on port ${port}`, 'success')
  log(`Local URL: ws://localhost:${port}`, 'info')
  log(`Network URL: ws://${localIP}:${port}`, 'info')

  sendToParent('status', {
    serverRunning: true,
    port,
    localIP,
    wsUrl: `ws://${localIP}:${port}`
  })

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress
    log(`Client connected from ${clientIP}`, 'success')
    clients.add(ws)
    sendToParent('status', { clientCount: clients.size })

    ws.send(JSON.stringify({
      type: 'status',
      message: 'Connected to TOS Bridge',
      tosConnected: rtd !== null
    }))

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        handleClientMessage(ws, msg)
      } catch (error) {
        log(`Invalid message from client: ${error.message}`, 'error')
      }
    })

    ws.on('close', () => {
      log(`Client disconnected from ${clientIP}`, 'warning')
      clients.delete(ws)
      sendToParent('status', { clientCount: clients.size })
    })

    ws.on('error', (error) => {
      log(`Client error: ${error.message}`, 'error')
      clients.delete(ws)
      sendToParent('status', { clientCount: clients.size })
    })
  })

  wss.on('error', (error) => {
    log(`Server error: ${error.message}`, 'error')
    sendToParent('status', { serverRunning: false })
  })

  // Start polling interval
  setInterval(pollAndBroadcast, 500)
}

// Handle messages from clients
function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'subscribe': {
      const { expiration, strike, optionType } = msg
      const symbol = buildTOSSymbol(expiration, strike, optionType)
      const key = `${expiration}:${strike}:${optionType}`

      subscriptions.set(key, { symbol, expiration, strike, optionType })
      log(`Subscribed to ${symbol}`, 'info')
      sendToParent('status', { subscriptionCount: subscriptions.size })

      ws.send(JSON.stringify({
        type: 'subscribed',
        symbol,
        expiration,
        strike,
        optionType
      }))
      break
    }

    case 'unsubscribe': {
      const { expiration, strike, optionType } = msg
      const key = `${expiration}:${strike}:${optionType}`

      if (subscriptions.has(key)) {
        const sub = subscriptions.get(key)
        log(`Unsubscribed from ${sub.symbol}`, 'info')
        subscriptions.delete(key)
        sendToParent('status', { subscriptionCount: subscriptions.size })
      }
      break
    }

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }))
      break

    default:
      log(`Unknown message type: ${msg.type}`, 'warning')
  }
}

// Handle commands from parent (Electron)
process.stdin.on('data', (data) => {
  try {
    const lines = data.toString().split('\n').filter(l => l.trim())
    for (const line of lines) {
      const cmd = JSON.parse(line)
      switch (cmd.type) {
        case 'connect-tos':
          initializeRTD()
          break
        case 'start-server':
          startServer(cmd.port || 8765)
          break
        case 'get-status':
          sendToParent('status', {
            tosConnected: rtd !== null,
            serverRunning: wss !== null,
            clientCount: clients.size,
            subscriptionCount: subscriptions.size
          })
          break
        case 'quit':
          process.exit(0)
          break
      }
    }
  } catch (error) {
    // Ignore parse errors
  }
})

// Start automatically
log('TOS Bridge Worker starting...', 'info')
initializeRTD()
startServer()

// Keep alive
process.on('SIGINT', () => {
  log('Shutting down...', 'warning')
  process.exit(0)
})
