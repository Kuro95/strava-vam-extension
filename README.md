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
1. Download the latest `strava-vam-extension-vX.Y.Z.zip` from the [Releases page](https://github.com/Kuro95/strava-vam-extension/releases)
2. Extract the ZIP file to a folder
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the extracted folder

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
