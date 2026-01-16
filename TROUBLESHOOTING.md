# Troubleshooting Guide

This guide covers common issues and their solutions when using TOS Bridge.

## Table of Contents

- [Connection Issues](#connection-issues)
- [Installation Issues](#installation-issues)
- [WebSocket Issues](#websocket-issues)
- [Performance Issues](#performance-issues)
- [Update Issues](#update-issues)

---

## Connection Issues

### "TOS Disconnected" - Bridge cannot connect to ThinkOrSwim

**Symptoms:**
- TOS status shows "Disconnected" (red badge)
- Logs show "Failed to connect to TOS RTD server"

**Solutions:**

1. **Ensure ThinkOrSwim is running and logged in**
   - TOS must be fully loaded (not just the login screen)
   - You must be logged into your TD Ameritrade/Schwab account
   - Wait for the main TOS window to fully load before starting the bridge

2. **Check if RTD is enabled in TOS**
   - In TOS, go to Setup > Application Settings > General
   - Ensure "Enable DDE/RTD server" is checked
   - Restart TOS after enabling

3. **Restart the bridge**
   - Click "Restart Bridge" button
   - Or close and reopen TOS Bridge

4. **Run as Administrator**
   - Right-click TOS Bridge and select "Run as administrator"
   - COM/RTD connections sometimes require elevated privileges

5. **Check Windows COM registration**
   - Open Command Prompt as Administrator
   - Run: `regsvr32 "C:\Program Files\thinkorswim\TOS.DDE.tlb"`
   - (Path may vary based on your TOS installation)

### Connection drops intermittently

**Symptoms:**
- TOS status flickers between Connected/Disconnected
- Quotes stop updating briefly then resume

**Solutions:**

1. **Check TOS stability**
   - Ensure TOS itself isn't experiencing issues
   - Check your internet connection stability

2. **Reduce subscription load**
   - Too many symbol subscriptions can overwhelm the RTD server
   - Limit to 50-100 active subscriptions

3. **Check system resources**
   - Open Task Manager and check CPU/Memory usage
   - TOS and the bridge together can use significant resources

---

## Installation Issues

### "winax module not found"

**Symptoms:**
- Logs show "winax module not found! Please run: npm install -g winax"
- Bridge worker fails to start

**Solutions:**

1. **Install winax globally**
   ```cmd
   npm install -g winax
   ```

2. **Run install-deps.bat**
   - Navigate to TOS Bridge installation folder
   - Run `install-deps.bat` as Administrator

3. **Check Node.js installation**
   - winax requires Node.js 18 or higher
   - Run `node --version` to check
   - Download from https://nodejs.org if not installed

4. **Install Visual Studio Build Tools**
   - winax is a native module requiring compilation
   - Install "Desktop development with C++" workload
   - Or run: `npm install -g windows-build-tools`

### Installation fails with permission errors

**Solutions:**

1. **Run installer as Administrator**
   - Right-click the installer exe
   - Select "Run as administrator"

2. **Check antivirus**
   - Some antivirus software blocks Electron apps
   - Add TOS Bridge to your antivirus whitelist

3. **Install to a different location**
   - Don't install in Program Files if you have permission issues
   - Try installing to `C:\TOS-Bridge` or your user folder

---

## WebSocket Issues

### Client cannot connect to ws://localhost:8765

**Symptoms:**
- SPX 0DTE Trader shows "TOS Bridge disconnected"
- WebSocket connection refused errors

**Solutions:**

1. **Check if server is running**
   - TOS Bridge should show "WebSocket Server: Running" (green)
   - If not, restart the bridge

2. **Check port availability**
   ```cmd
   netstat -ano | findstr :8765
   ```
   - If another process is using port 8765, close it
   - Or configure a different port (coming in future update)

3. **Check firewall settings**
   - Windows Firewall may be blocking the connection
   - Add TOS Bridge to allowed apps
   - Or allow port 8765 inbound connections

4. **Try 127.0.0.1 instead of localhost**
   - Some systems have localhost resolution issues
   - Use `ws://127.0.0.1:8765` instead

### No quotes being received

**Symptoms:**
- Client connects successfully
- No quote updates arrive

**Solutions:**

1. **Check subscription format**
   - Symbols must be in TOS format: `.SPXW250117C5900`
   - Format: `.{ROOT}{YYMMDD}{C/P}{STRIKE}`

2. **Verify subscription was sent**
   ```json
   {"type": "subscribe", "symbols": [".SPXW250117C5900"]}
   ```

3. **Check market hours**
   - Options quotes only update during market hours
   - Extended hours may have limited data

4. **Check TOS data subscription**
   - Ensure you have real-time options data in TOS
   - Delayed data will still work but with 15-min delay

---

## Performance Issues

### High CPU usage

**Symptoms:**
- TOS Bridge using >20% CPU constantly
- System becomes sluggish

**Solutions:**

1. **Reduce active subscriptions**
   - Each subscription adds processing overhead
   - Unsubscribe from symbols you don't need

2. **Check for duplicate subscriptions**
   - Ensure your client isn't subscribing to the same symbol multiple times

3. **Restart the bridge**
   - Memory leaks can accumulate over long sessions
   - Restart every few hours for best performance

### Memory usage grows over time

**Solutions:**

1. **Restart periodically**
   - Close and reopen TOS Bridge daily
   - Use system tray to keep it running in background

2. **Limit log history**
   - Click "Clear" button to clear log display
   - Logs can consume memory if left to accumulate

---

## Update Issues

### Auto-update fails

**Symptoms:**
- Update banner appears but download fails
- "Update error" shown

**Solutions:**

1. **Check internet connection**
   - Updates are downloaded from GitHub Releases
   - Ensure github.com is accessible

2. **Manual update**
   - Go to https://github.com/johndowbs/tos-bridge/releases
   - Download latest installer manually
   - Install over existing installation

3. **Check write permissions**
   - Updates need write access to installation folder
   - Run as Administrator if needed

### Update installs but app won't start

**Solutions:**

1. **Reinstall from scratch**
   - Uninstall TOS Bridge completely
   - Download fresh installer from GitHub
   - Install to a clean location

2. **Clear app data**
   - Delete `%APPDATA%\tos-bridge` folder
   - Reinstall

---

## Getting Help

If none of these solutions work:

1. **Check existing issues**
   - https://github.com/johndowbs/tos-bridge/issues

2. **Create a new issue**
   - Include TOS Bridge version
   - Include Windows version
   - Include Node.js version (`node --version`)
   - Include relevant log entries
   - Describe steps to reproduce

3. **Include logs**
   - Copy log entries from the app
   - Or check `%APPDATA%\tos-bridge\logs` for log files
