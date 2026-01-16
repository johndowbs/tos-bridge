# Contributing to TOS Bridge

Thank you for your interest in contributing to TOS Bridge! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Windows 10/11 (required for winax/COM automation)
- ThinkOrSwim desktop application
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/johndowbs/tos-bridge.git
   cd tos-bridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install -g winax
   ```

3. **Run in development mode**
   ```bash
   npm start
   ```

### Project Structure

```
tos-bridge/
├── main.js              # Electron main process
├── preload.js           # IPC bridge (contextBridge)
├── bridge-worker.js     # TOS RTD connection (runs in separate Node process)
├── auto-updater.js      # GitHub release auto-updater
├── index.html           # Main window HTML
├── renderer.js          # UI logic
├── styles.css           # Styling
├── icon.ico             # Application icon
├── install-deps.bat     # Post-install script for winax
├── package.json         # Dependencies and build config
└── scripts/
    └── release.ps1      # Release automation script
```

### Architecture Notes

**Why bridge-worker.js runs separately:**

The `winax` module (used for COM/RTD automation) is incompatible with Electron's bundled Node.js due to V8 API differences. To work around this:

1. `main.js` spawns `bridge-worker.js` as a child process using the system's Node.js
2. Communication happens via stdin/stdout JSON messages
3. This allows winax to work while keeping the Electron UI functional

**IPC Flow:**
```
Renderer → preload.js → main.js → bridge-worker.js → TOS RTD
                                        ↓
WebSocket clients ← bridge-worker.js (ws server)
```

## Making Changes

### Code Style

- Use ES6+ features (const/let, arrow functions, async/await)
- 2-space indentation
- Single quotes for strings
- No semicolons (unless required for ASI edge cases)
- Meaningful variable names

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(rtd): add support for futures quotes
fix(ws): handle client disconnect gracefully
docs: update installation instructions
```

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
   - Ensure TOS connection works
   - Test WebSocket subscriptions
   - Check UI responsiveness
5. **Commit your changes**
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**
   - Describe what changes you made
   - Explain why the changes are needed
   - Link any related issues

## Testing

### Manual Testing Checklist

Before submitting a PR, verify:

- [ ] App starts without errors
- [ ] TOS connection works (when TOS is running)
- [ ] WebSocket server starts on port 8765
- [ ] Clients can connect and subscribe
- [ ] Quotes are received and broadcast correctly
- [ ] System tray works (minimize, restore, quit)
- [ ] Update banner appears when update is available
- [ ] Logs display correctly
- [ ] All buttons function (Reconnect, Restart, Copy, Clear)

### Testing WebSocket API

Use a WebSocket client (like wscat) to test:

```bash
npm install -g wscat
wscat -c ws://localhost:8765

# Subscribe
{"type":"subscribe","symbols":[".SPXW250117C5900"]}

# You should receive quote updates
# Unsubscribe
{"type":"unsubscribe","symbols":[".SPXW250117C5900"]}
```

## Building

### Development Build

```bash
npm start
```

### Production Build

```bash
npm run build
```

Output will be in the `release/` folder.

### Creating a Release

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run release:patch

# Minor version (1.0.1 -> 1.1.0)
npm run release:minor

# Major version (1.1.0 -> 2.0.0)
npm run release:major
```

## Reporting Issues

### Bug Reports

Include:
- TOS Bridge version
- Windows version
- Node.js version
- ThinkOrSwim version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant log entries

### Feature Requests

- Describe the feature
- Explain the use case
- Provide examples if possible

## Questions?

- Open a GitHub issue for questions
- Check existing issues first
- Be respectful and patient

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
