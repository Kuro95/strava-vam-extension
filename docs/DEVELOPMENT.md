# Development Setup Guide

Complete guide to setting up the Strava VAM Extension for development.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 16 or higher ([Download](https://nodejs.org/))
- **npm** 8 or higher (comes with Node.js)
- **Firefox** 109 or higher ([Download](https://www.mozilla.org/firefox/))
- **Git** ([Download](https://git-scm.com/))
- A **GitHub account** ([Sign up](https://github.com/))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Kuro95/strava-vam-extension.git
cd strava-vam-extension
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- ESLint for code linting
- Jest for testing
- web-ext for Firefox extension development
- Other development dependencies

### 3. Build the Extension

```bash
npm run build
```

This creates a `dist/` directory with the compiled extension.

### 4. Load Extension in Firefox

#### Option A: Temporary Installation (Development)

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on"**
4. Navigate to your project's `dist/` folder
5. Select `manifest.json`

The extension is now loaded! It will be removed when you close Firefox.

#### Option B: Use web-ext (Recommended for Development)

```bash
npm run dev
```

This will:
- Start Firefox with the extension loaded
- Watch for file changes
- Auto-reload the extension when files change

### 5. Verify Installation

1. Go to [Strava.com](https://www.strava.com)
2. Open any cycling activity with elevation data
3. You should see the VAM widget appear on the page
4. Click the extension icon in the toolbar to see the popup

## 🛠️ Development Workflow

### File Structure

```
strava-vam-extension/
├── .github/              # GitHub Actions workflows
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Issue templates
├── src/                  # Source code
│   ├── manifest.json     # Extension manifest
│   ├── background.js     # Background service worker
│   ├── content.js        # Content script (Strava pages)
│   ├── popup.html/js     # Extension popup
│   ├── leaderboard.html/js # Leaderboard view
│   ├── options.html/js   # Settings page
│   └── styles.css        # Styles
├── icons/                # Extension icons
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── scripts/             # Build scripts
│   ├── build.sh         # Build extension
│   └── package.sh       # Create distribution package
├── docs/                # Documentation
└── dist/                # Build output (generated)
```

### Making Changes

1. **Edit source files** in `src/`
2. **Rebuild** the extension: `npm run build`
3. **Reload** in Firefox:
   - Click "Reload" in `about:debugging`
   - Or restart `npm run dev`
4. **Test** your changes on Strava

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting Code

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## 🧪 Testing

### Unit Tests

Located in `tests/unit/`. Tests individual functions and components.

```bash
npm test
```

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] VAM widget appears on activity pages
- [ ] Personal bests are calculated correctly
- [ ] Popup displays all PBs correctly
- [ ] Leaderboard filters work
- [ ] Settings save and apply correctly
- [ ] Bulk sync processes activities
- [ ] Dark mode works

### Testing on Strava

1. Go to a test activity: `https://www.strava.com/activities/YOUR_ACTIVITY_ID`
2. Open browser console (F12) to check for errors
3. Verify VAM calculations are accurate
4. Test all UI interactions

## 📦 Building for Distribution

### Create Distribution Package

```bash
npm run build
npm run package
```

This creates a ZIP file in `dist/` ready for distribution.

### Validate Extension

```bash
npm run validate
```

Checks for:
- Manifest errors
- Missing files
- Permission issues
- Firefox compatibility

## 🔐 Setting Up CI/CD

### GitHub Secrets

To enable automatic publishing to Firefox Add-ons:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add two secrets:

   **FIREFOX_API_KEY**
   - Name: `FIREFOX_API_KEY`
   - Value: Your Firefox API key (JWT issuer)
   - Example: `user:12345678:123`

   **FIREFOX_API_SECRET**
   - Name: `FIREFOX_API_SECRET`
   - Value: Your Firefox API secret (JWT secret)
   - Example: `abc123...`

### Getting Firefox API Credentials

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in with your Mozilla account
3. Click your name → **API Credentials**
4. Click **"Generate new credentials"**
5. Copy both the **API Key** and **API Secret**

### Creating a Release

When you push a version tag, GitHub Actions will automatically:
1. Run tests
2. Build the extension
3. Sign with Firefox
4. Publish to Firefox Add-ons
5. Create a GitHub release

```bash
# Update version in src/manifest.json to 1.1.0
# Update CHANGELOG.md

git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

## 🐛 Debugging

### Browser Console

Open Firefox DevTools (F12):
- **Console**: See JavaScript errors and logs
- **Network**: Monitor API requests to Strava
- **Storage**: Inspect browser.storage data

### Extension Debugging

1. Open `about:debugging#/runtime/this-firefox`
2. Find your extension
3. Click **"Inspect"** to open DevTools for the extension
4. View background script logs and storage

### Common Issues

**Extension doesn't load:**
- Check manifest.json is valid JSON
- Verify all file paths are correct
- Check browser console for errors

**VAM not calculating:**
- Ensure activity has elevation data
- Check console for API errors
- Verify stream data is being fetched

**Storage not saving:**
- Check browser.storage permissions
- Verify not in private browsing mode
- Check storage quota

## 📚 Additional Resources

- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [MDN WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [web-ext Documentation](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
- [Strava API Documentation](https://developers.strava.com/)

## 💡 Tips

- Use `console.log()` liberally during development
- Test on multiple activities (short, long, flat, hilly)
- Clear extension storage between major changes
- Keep browser and extension DevTools open
- Use Firefox's "Browser Console" (Ctrl+Shift+J) for all log output

## 🤝 Need Help?

- Create an [Issue](https://github.com/Kuro95/strava-vam-extension/issues)
- Start a [Discussion](https://github.com/Kuro95/strava-vam-extension/discussions)
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

Happy developing! 🚀
