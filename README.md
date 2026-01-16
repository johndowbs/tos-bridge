# TOS Bridge

A lightweight Electron app that streams real-time option data from ThinkOrSwim to your trading applications via WebSocket.

## Features

- Connects to ThinkOrSwim RTD (Real-Time Data) server
- Broadcasts option quotes via WebSocket (ws://localhost:8765)
- System tray support for background operation
- Auto-update functionality via GitHub Releases

## Requirements

- Windows 10/11
- ThinkOrSwim desktop application (running and logged in)
- Node.js 18+ (for winax dependency)

## Installation

### From Release (Recommended)

1. Download the latest `TOS-Bridge-Setup-X.X.X.exe` from [Releases](https://github.com/johndowbs/tos-bridge/releases)
2. Run the installer
3. After installation, open a command prompt in the install directory and run:
   ```
   install-deps.bat
   ```
   This installs the winax module which cannot be bundled with Electron.

### From Source

```bash
git clone https://github.com/johndowbs/tos-bridge.git
cd tos-bridge
npm install
npm install -g winax
npm start
```

## Usage

1. Start ThinkOrSwim and log in
2. Launch TOS Bridge
3. The bridge will automatically connect to TOS and start the WebSocket server
4. Configure your trading app to connect to `ws://localhost:8765`

## WebSocket API

### Subscribe to Option Quotes

```json
{
  "type": "subscribe",
  "symbols": [".SPXW250117C5900", ".SPXW250117P5900"]
}
```

### Quote Update (broadcast)

```json
{
  "type": "quote",
  "symbol": ".SPXW250117C5900",
  "data": {
    "bid": 12.50,
    "ask": 12.60,
    "last": 12.55,
    "volume": 1234,
    "delta": 0.45,
    "gamma": 0.02,
    "theta": -0.15,
    "vega": 0.08,
    "iv": 0.18
  }
}
```

### Unsubscribe

```json
{
  "type": "unsubscribe",
  "symbols": [".SPXW250117C5900"]
}
```

## Development

```bash
# Run in development mode
npm start

# Build installer
npm run build

# Release (patch version)
npm run release:patch
```

## Troubleshooting

### "TOS not connected"
- Ensure ThinkOrSwim is running and you're logged in
- TOS RTD server starts automatically when TOS is open

### "winax module not found"
- Run `npm install -g winax` with administrator privileges
- Restart the bridge

### Port 8765 already in use
- Another instance may be running
- Check Task Manager for existing node.exe or TOS Bridge processes

## License

MIT
