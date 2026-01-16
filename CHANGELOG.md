# Changelog

All notable changes to TOS Bridge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-16

### Added
- Comprehensive documentation (README, TROUBLESHOOTING, CONTRIBUTING)
- Detailed WebSocket API documentation
- Installation guide with step-by-step instructions

## [1.0.0] - 2025-01-16

### Added
- Initial release
- ThinkOrSwim RTD connection via winax COM automation
- WebSocket server on port 8765 for broadcasting option quotes
- Real-time streaming of bid, ask, last, volume, and Greeks
- System tray support for background operation
- Auto-update functionality via GitHub Releases
- Clean UI matching SPX 0DTE Trader design language
- Manual TOS reconnection button
- Bridge restart functionality
- Connection URL copy button for easy configuration
- Real-time logging display

### Technical
- Electron 22 for Windows desktop app
- Separate bridge-worker.js process for winax compatibility
- IPC communication between main process and worker
- electron-updater for seamless updates
