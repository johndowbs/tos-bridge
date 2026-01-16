# TOS Bridge

A lightweight Electron app that streams real-time option data from ThinkOrSwim to your trading applications via WebSocket.

[![Release](https://img.shields.io/github/v/release/johndowbs/tos-bridge)](https://github.com/johndowbs/tos-bridge/releases)
[![License](https://img.shields.io/github/license/johndowbs/tos-bridge)](LICENSE)

## Overview

TOS Bridge acts as a middleware between ThinkOrSwim's RTD (Real-Time Data) server and your trading applications. It connects to TOS via Windows COM automation and broadcasts option quotes over WebSocket, enabling any application to receive real-time market data.

```
ThinkOrSwim (RTD Server)
        │
        ▼
   TOS Bridge (winax/COM)
        │
        ▼
 WebSocket Server (:8765)
        │
    ┌───┴───┐
    ▼       ▼
 App 1   App 2  ...
```

## Features

- **Real-time option data** - Bid, ask, last, volume, and full Greeks
- **WebSocket broadcasting** - Multiple clients can connect simultaneously
- **System tray** - Runs in background, always accessible
- **Auto-updates** - Automatically downloads new versions from GitHub
- **Low latency** - Direct RTD connection, no web scraping
- **Easy setup** - One-click installer with guided setup

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Windows | 10/11 | Required for COM automation |
| ThinkOrSwim | Latest | Must be running and logged in |
| Node.js | 18+ | Required for winax module |

## Quick Start

### 1. Install TOS Bridge

Download the latest installer from [Releases](https://github.com/johndowbs/tos-bridge/releases):

```
TOS-Bridge-Setup-X.X.X.exe
```

### 2. Install Dependencies

After installation, navigate to the install folder and run:

```cmd
install-deps.bat
```

This installs the `winax` module which enables COM automation.

### 3. Start ThinkOrSwim

Launch TOS and log in to your account. Wait for the main window to fully load.

### 4. Launch TOS Bridge

Start TOS Bridge. It will automatically:
- Connect to TOS RTD server
- Start WebSocket server on `ws://localhost:8765`

### 5. Connect Your App

Configure your trading application to connect to:
```
ws://localhost:8765
```

## Installation

### From Release (Recommended)

1. Download `TOS-Bridge-Setup-X.X.X.exe` from [Releases](https://github.com/johndowbs/tos-bridge/releases)
2. Run the installer (choose installation directory)
3. Open Command Prompt in the installation directory
4. Run `install-deps.bat` (requires Node.js)
5. Launch TOS Bridge from Start Menu or desktop shortcut

### From Source

```bash
# Clone repository
git clone https://github.com/johndowbs/tos-bridge.git
cd tos-bridge

# Install dependencies
npm install
npm install -g winax

# Run
npm start
```

## WebSocket API

### Connection

Connect to `ws://localhost:8765` using any WebSocket client.

### Message Format

All messages are JSON objects with a `type` field.

### Subscribe to Symbols

Request real-time quotes for option symbols:

```json
{
  "type": "subscribe",
  "symbols": [".SPXW250117C5900", ".SPXW250117P5900"]
}
```

**Symbol Format:** `.{ROOT}{YYMMDD}{C/P}{STRIKE}`
- `.SPXW` - SPX Weekly options
- `250117` - Expiration date (Jan 17, 2025)
- `C` or `P` - Call or Put
- `5900` - Strike price

### Quote Updates

The bridge broadcasts quote updates as they arrive:

```json
{
  "type": "quote",
  "symbol": ".SPXW250117C5900",
  "data": {
    "bid": 12.50,
    "ask": 12.60,
    "last": 12.55,
    "volume": 1234,
    "openInterest": 5678,
    "delta": 0.45,
    "gamma": 0.02,
    "theta": -0.15,
    "vega": 0.08,
    "iv": 0.18
  }
}
```

### Unsubscribe

Stop receiving quotes for symbols:

```json
{
  "type": "unsubscribe",
  "symbols": [".SPXW250117C5900"]
}
```

### Connection Status

The bridge sends status updates:

```json
{
  "type": "status",
  "tosConnected": true,
  "subscriptionCount": 42
}
```

## User Interface

### Main Window

| Element | Description |
|---------|-------------|
| **ThinkOrSwim** | Connection status to TOS RTD server |
| **WebSocket Server** | Server status and client count |
| **Connection URL** | WebSocket URL to copy to your app |
| **Logs** | Real-time activity log |

### Buttons

- **Reconnect TOS** - Manually reconnect to ThinkOrSwim
- **Restart Bridge** - Restart the entire bridge worker
- **Copy** - Copy WebSocket URL to clipboard
- **Clear** - Clear the log display

### System Tray

- **Double-click** - Show main window
- **Right-click** - Context menu (Show, Restart, Quit)

## Configuration

TOS Bridge uses sensible defaults. Future versions will include configurable options for:

- WebSocket port
- Auto-start with Windows
- Logging verbosity
- Connection timeout

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common issues.

### Quick Fixes

| Issue | Solution |
|-------|----------|
| TOS Disconnected | Ensure TOS is running and logged in |
| winax not found | Run `npm install -g winax` as admin |
| Port in use | Close other TOS Bridge instances |
| No quotes | Check symbol format, verify market hours |

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

```bash
# Development mode
npm start

# Build installer
npm run build

# Create release
npm run release:patch
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Related Projects

- [SPX 0DTE Trader](https://github.com/johndowbs/spx-0dte-trader) - Options trading application that uses TOS Bridge

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/johndowbs/tos-bridge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/johndowbs/tos-bridge/discussions)
