# Strava VAM Extension 🚴⛰️

[![Build Status](https://github.com/Kuro95/strava-vam-extension/workflows/Test%20and%20Lint/badge.svg)](https://github.com/Kuro95/strava-vam-extension/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Download-orange.svg)](https://addons.mozilla.org/firefox/addon/strava-vam-extension/)

A Firefox browser extension that tracks and displays your **VAM (Vertical Ascent Meters per hour)** personal bests across all your Strava activities.

## ✨ Features

- ✅ **Automatic VAM Calculation** - Analyzes elevation data from your activities
- ✅ **Personal Best Tracking** - Tracks your best VAM across multiple time periods, ascent distances, and distances
- ✅ **Multiple Tracking Modes** - Time-based (1-60 min), Ascent-based (100-1500m), Distance-based (1-10km)
- ✅ **Activity Page Integration** - Displays VAM stats directly on Strava activity pages
- ✅ **New PB Alerts** - Highlights when you achieve a new personal best
- ✅ **All-Time View** - Popup interface to view all your personal bests
- ✅ **Leaderboard** - Rankings of all your activities by VAM performance with sport type filtering
- ✅ **Bulk Sync** - Load all your past activities at once instead of visiting each one
- ✅ **Customizable Tracking** - Configure custom time periods, ascents, and distances
- ✅ **Dark Mode Support** - Automatically adapts to your theme preference

## 📊 Tracking Modes

### ⏱️ Time-Based Tracking
Track your best VAM over fixed time periods:
- 1 minute, 2 minutes, 5 minutes
- 10 minutes, 15 minutes, 20 minutes
- 30 minutes, 60 minutes

### ⛰️ Ascent-Based Tracking
Track your best VAM over fixed elevation gains:
- 100m, 250m, 500m
- 1000m, 1500m

### 📏 Distance-Based Tracking
Track your best VAM over fixed distances:
- 1 km, 2 km, 5 km, 10 km

**All values are customizable in the settings!**

## 🚀 Installation

### From Firefox Add-ons (Recommended)
1. Visit the [Firefox Add-ons page](https://addons.mozilla.org/firefox/addon/strava-vam-extension/)
2. Click "Add to Firefox"
3. Grant the necessary permissions
4. Start using the extension on Strava.com!

### Manual Installation (Development)
1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on"
6. Select the `manifest.json` file from the `dist/` directory

### From Release ZIP (Testing without Build)

**This is the easiest way to test the extension locally without setting up a development environment.**

1. Download the latest `strava-vam-extension-vX.Y.Z.zip` from the [Releases page](https://github.com/Kuro95/strava-vam-extension/releases)
2. Extract the ZIP file to a folder on your computer
   - **Important:** Extract to a location where you plan to keep the files (not Downloads or Temp)
   - The extension will remain installed only while Firefox is running
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
4. Click **"Load Temporary Add-on"**
5. Navigate to the extracted folder and select the `manifest.json` file
6. The extension is now loaded and ready to use!

**Note:** Temporary add-ons are removed when Firefox closes. You'll need to reload them each time you restart Firefox. For permanent installation, use the Firefox Add-ons page method above.

#### Verifying the Installation Package

To verify the ZIP file is valid before installation:

```bash
# Extract the ZIP
unzip strava-vam-extension-vX.Y.Z.zip -d extension-test

# Check that manifest.json is at the root
ls extension-test/manifest.json

# Validate with web-ext (requires Node.js)
npx web-ext lint --source-dir=extension-test
```

A valid extension package should have `manifest.json` at the root level (not in a subdirectory).

## 📖 How to Use

1. **Visit a Strava Activity**
   - Open any of your cycling activities on Strava.com
   - The extension will automatically analyze the elevation data

2. **View VAM Stats**
   - A new widget will appear on the activity page showing:
     - Your VAM for each time period in this activity
     - Your all-time personal best for each period
     - The elevation gain for your best efforts
   - New personal bests are highlighted with a ⭐ and orange background

3. **Bulk Sync Your Activities**
   - Click "🔄 Sync All Activities" on any activity page
   - The extension will automatically process your activities
   - Progress is shown in real-time

4. **View All Personal Bests**
   - Click the extension icon in your browser toolbar
   - See a complete table of all your VAM personal bests
   - Click "View →" next to any record to open that activity

5. **View the Leaderboard**
   - Click "🏆 Leaderboard" in the popup
   - See all activities ranked by VAM performance
   - Filter by sport type, tracking mode, and specific periods

6. **Customize Settings**
   - Click "⚙️ Settings" to configure:
     - Enable/disable tracking modes
     - Add custom time periods, ascent values, or distances

## 🔧 Development

### Prerequisites
- Node.js 16+
- npm 8+
- Firefox 109+

### Setup
```bash
# Clone the repository
git clone https://github.com/Kuro95/strava-vam-extension.git
cd strava-vam-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Package for distribution
npm run package

# Validate package structure
npm run validate:package
```

### Publishing to Firefox Add-ons

#### For First-Time Submission (Manual Upload)

Before your extension is approved by Mozilla, use the manual upload process:

1. **Create a signed release package:**
   ```bash
   # Using GitHub Actions (recommended)
   git tag v1.0.4-manual
   git push origin v1.0.4-manual
   ```
   
2. **Download the signed .xpi from the [Releases page](https://github.com/Kuro95/strava-vam-extension/releases)**

3. **Manually upload to Mozilla Add-ons:**
   - Visit https://addons.mozilla.org/developers/
   - Upload the signed .xpi file
   - Fill in extension details and submit for review

**📚 Detailed Instructions:** See [docs/MANUAL_UPLOAD.md](docs/MANUAL_UPLOAD.md) for complete step-by-step guide.

#### After Mozilla Approval (Automatic Publishing)

Once your extension is listed and approved on AMO:

1. **Set up API credentials in GitHub Secrets** (see [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md))
2. **Use regular version tags:**
   ```bash
   git tag v1.0.5
   git push origin v1.0.5
   ```
3. **GitHub Actions automatically:**
   - Builds and tests the extension
   - Signs with Mozilla
   - Submits to AMO for review
   - Creates GitHub release with artifacts

### Project Structure
```
strava-vam-extension/
├── src/               # Source files
│   ├── background.js
│   ├── content.js
│   ├── popup.html/js
│   ├── leaderboard.html/js
│   ├── options.html/js
│   └── manifest.json
├── icons/            # Extension icons
├── tests/            # Test files
├── scripts/          # Build scripts
└── dist/             # Built extension (generated)
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🔧 Troubleshooting

### Firefox: "File does not contain a valid manifest"

If you get this error when loading the extension:

1. **Extract the ZIP file first** - Firefox cannot load extensions directly from ZIP files for temporary installations
2. **Check the extracted folder structure** - The `manifest.json` file must be at the root of the folder, not in a subdirectory
3. **Verify the manifest is valid JSON** - Open `manifest.json` in a text editor and check for syntax errors
4. **Use the correct location** - When clicking "Load Temporary Add-on", navigate to the extracted folder and select `manifest.json`

### Extension Not Appearing on Strava

1. Make sure you're on a Strava activity page: `https://www.strava.com/activities/*`
2. Refresh the page after installing the extension
3. Check that the extension has the necessary permissions granted
4. Open the browser console (F12) and check for any error messages

### Data Not Syncing

1. Visit at least one activity page to initialize the extension
2. Use the "🔄 Sync All Activities" button from an activity page
3. Check the extension popup to verify data is being stored

### Performance Issues

If you experience slowdowns:

1. Reduce the number of custom tracking periods in settings
2. Clear the extension data from the popup and re-sync
3. Sync activities in smaller batches

For more help, please [open an issue](https://github.com/Kuro95/strava-vam-extension/issues) on GitHub.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ❓ What is VAM?

**VAM (Vertical Ascent Meters)** is a measure of climbing speed, expressed as meters of elevation gain per hour (m/h).

- **Average cyclist:** 300-600 m/h
- **Good climber:** 800-1000 m/h
- **Professional cyclist:** 1400-1800 m/h
- **Elite pros (steep climbs):** 1800+ m/h

VAM normalizes climbing performance regardless of gradient or weight, making it easier to compare different climbs and track improvement over time.

## 🔒 Privacy

- **No data collection** - All data stays on your device
- **No external servers** - Everything runs locally in your browser
- **Open source** - You can verify the code yourself

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/Kuro95/strava-vam-extension/issues) page to report bugs or request features.

## 💖 Support

If you find this extension useful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or suggesting features
- 🔀 Contributing code improvements
- ☕ [Buying me a coffee](https://buymeacoffee.com/Kuro95) (optional)

## 🙏 Acknowledgments

Created to complement Sauce for Strava and provide additional VAM tracking functionality.

---

**Note:** This extension is not affiliated with Strava or Sauce for Strava. Strava is a trademark of Strava, Inc.
