# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
