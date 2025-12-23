# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔧 Fixed
- **Robust DOM Selectors** - Updated content script with multiple fallback selectors for Strava's changing page structure
  - Added 15+ fallback selectors for activity page injection point
  - Added multiple fallback selectors for activity name and sport type extraction
  - Extension now adapts to Strava's modern React-based UI
- **User-Visible Error Messages** - Added error widget with retry button when data loading fails
- **Floating Widget Fallback** - When injection point not found, displays a floating widget
- **API Retry Logic** - Added exponential backoff retry logic for API calls (3 retries)
- **SPA Support** - Added URL change observer for Strava's single-page navigation

### ✨ Added
- **Expanded Activity Type Support** - Bulk sync now processes:
  - Ride, VirtualRide, Run, VirtualRun
  - Hike, Walk, RockClimbing
  - BackcountrySki, AlpineSki, NordicSki, Snowshoe
- **Error Handling UI** - Visual error messages with retry functionality
- **Floating Widget** - Compact widget for when normal injection fails

### 🎨 Improved
- **Dark Mode** - Added dark mode styles for error and floating widgets
- **Animations** - Added slide-in animation for floating widget
- **Logging** - Better console logging for debugging

## [1.0.10] - 2025-11-05

### 🔧 Fixed
- **Automatic Release Workflow** - Fixed GitHub Actions workflow failures preventing automatic extension creation
  - Removed duplicate `publish-firefox.yml` workflow that was conflicting with main build workflow
  - Added credential validation with helpful error messages before signing attempts
  - Support both `FIREFOX_API_KEY` and `WEB_EXT_API_KEY` secret naming conventions
  - Updated manifest.json to use `browser_specific_settings` instead of deprecated `applications` property

### 📚 Documentation
- Updated CI-CD-SETUP.md to reflect both supported secret naming conventions
- Added troubleshooting guidance for authentication failures

## [1.0.9] - 2025-10-30

### 🔧 Fixed
- **CRITICAL: VAM Calculation Bug** - Fixed major calculation error in VAM computation
  - Now uses CUMULATIVE elevation gain (sum of positive changes) instead of NET gain (end - start)
  - This is the industry-standard method used by Strava, TrainingPeaks, and Sauce for Strava
  - Impact: VAM values now 10-50% more accurate for climbs with descents
  - Pure climbs (no descents) unaffected - same values as before
  - See [docs/VAM_CALCULATION_FIX.md](docs/VAM_CALCULATION_FIX.md) for detailed analysis

### ✨ Added
- **Elevation Data Smoothing** - 3-point moving average reduces GPS noise
- **Minimum Thresholds** - Filters unrealistic segments (5m for time/distance, 90% for ascent)
- **Comprehensive Tests** - 14 new tests covering cumulative gain calculation
- **Technical Documentation** - Detailed explanation of fix and impact

### 📈 Impact
- Climbs with small descents/switchbacks now show correct VAM (typically 10-30% higher)
- More consistent with other cycling platforms and tools
- Historical PBs preserved (not recalculated) - new activities use correct method

## [1.0.0] - 2025-10-27

### 🎉 Initial Release

#### Added
- **Automatic VAM Calculation** - Analyzes elevation data from Strava activities
- **Personal Best Tracking** - Tracks best VAM across multiple time periods
- **Three Tracking Modes**:
  - Time-based tracking (1-60 minutes)
  - Ascent-based tracking (100-1500m)
  - Distance-based tracking (1-10km)
- **Activity Page Integration** - Displays VAM stats directly on Strava
- **New PB Alerts** - Highlights new personal bests with ⭐
- **Extension Popup** - View all personal bests in one place
- **Leaderboard View** - Rankings of all activities by VAM
  - Filter by sport type (Cycling, Running, etc.)
  - Filter by tracking mode and specific periods
  - Sort by any column
  - Top 3 medals 🥇🥈🥉
- **Bulk Sync Feature** - Process multiple activities at once
- **Settings Page** - Customize tracking periods
- **Dark Mode Support** - Adapts to browser theme
- **Privacy-First** - All data stored locally, no external servers

#### Technical
- Firefox Manifest V2 extension
- Local storage for personal bests
- Content script injection on Strava activity pages
- Background service worker for data management
- Comprehensive test suite
- CI/CD pipeline with GitHub Actions
- Automated Firefox Add-ons publishing

---

## Version History

### Upcoming Features
- [ ] Export personal bests to CSV
- [ ] Power-to-VAM analysis integration
- [ ] Historical trend charts
- [ ] Segment-specific VAM tracking
- [ ] Multi-device sync (requires backend)

---

## Release Notes Format

### Version Number Format
- MAJOR.MINOR.PATCH (e.g., 1.0.0)
- MAJOR: Breaking changes
- MINOR: New features, backwards compatible
- PATCH: Bug fixes, backwards compatible

### Change Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

[1.0.0]: https://github.com/Kuro95/strava-vam-extension/releases/tag/v1.0.0
