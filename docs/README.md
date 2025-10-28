# 📚 Documentation

Welcome to the Strava VAM Extension documentation!

## 📖 Available Guides

### For Getting Started
- **[../GETTING_STARTED.md](../GETTING_STARTED.md)** - Quick setup guide (START HERE!)
- **[../README.md](../README.md)** - Main project documentation
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - How to contribute

### For Developers
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide
  - Setting up your environment
  - Building and testing
  - Debugging tips
  - Common issues and solutions

### For Publishing & Releases
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - ⭐ Quick reference for releases (START HERE!)
  - Manual vs Automatic workflows
  - Tag formats and when to use them
  - Common scenarios and troubleshooting
- **[MANUAL_UPLOAD.md](MANUAL_UPLOAD.md)** - Manual upload to Firefox Add-ons
  - Step-by-step submission process
  - First-time submission guide
  - Validation and troubleshooting
- **[PACKAGING.md](PACKAGING.md)** - Technical packaging details
  - Package structure requirements
  - Build and signing process
  - Mozilla compliance guidelines
- **[CI-CD-SETUP.md](CI-CD-SETUP.md)** - GitHub Actions configuration
  - Getting Firefox API credentials
  - Configuring GitHub secrets
  - Creating automated releases
  - Troubleshooting workflows

### For Contributors
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines
  - How to report bugs
  - How to suggest features
  - Pull request process
  - Code style guidelines

### Version History
- **[../CHANGELOG.md](../CHANGELOG.md)** - Complete version history
  - Release notes
  - Feature additions
  - Bug fixes
  - Breaking changes

## 🚀 Quick Links

### Development
```bash
npm install          # Install dependencies
npm run build        # Build extension
npm test             # Run tests
npm run lint         # Check code quality
```

### Publishing Releases

**First-Time Submission (Manual):**
```bash
git tag v1.0.0-manual      # Create manual release tag
git push origin v1.0.0-manual  # Trigger manual workflow
# Download .xpi and upload to Mozilla Add-ons
```

**After Approval (Automatic):**
```bash
git tag v1.0.1             # Create release tag
git push origin v1.0.1     # Trigger automatic submission
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more details.

## 📋 Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── QUICK_REFERENCE.md     # Quick reference for releases
├── MANUAL_UPLOAD.md       # Manual upload guide
├── PACKAGING.md           # Packaging and signing details
├── CI-CD-SETUP.md         # CI/CD configuration
└── DEVELOPMENT.md         # Development guide

Root level:
├── GETTING_STARTED.md     # Quick setup
├── README.md              # Main docs
├── CONTRIBUTING.md        # Contribution guide
├── CHANGELOG.md           # Version history
└── LICENSE                # MIT License
```

## 🔍 Finding What You Need

- **New to the project?** → Start with [GETTING_STARTED.md](../GETTING_STARTED.md)
- **Want to develop?** → Read [DEVELOPMENT.md](DEVELOPMENT.md)
- **Publishing first release?** → See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) and [MANUAL_UPLOAD.md](MANUAL_UPLOAD.md)
- **Setting up automated releases?** → Follow [CI-CD-SETUP.md](CI-CD-SETUP.md)
- **Technical packaging details?** → Check [PACKAGING.md](PACKAGING.md)
- **Want to contribute?** → See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Need version info?** → Check [CHANGELOG.md](../CHANGELOG.md)

## 💡 Additional Resources

### External Documentation
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [MDN WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [web-ext Documentation](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
- [Submitting an Add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [Signing and Distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [Strava API Documentation](https://developers.strava.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Tools & Libraries
- [ESLint](https://eslint.org/) - Code linting
- [Jest](https://jestjs.io/) - Testing framework
- [web-ext](https://github.com/mozilla/web-ext) - Firefox extension development tool

## ❓ Still Have Questions?

1. Check if your question is answered in the docs
2. Search [existing issues](https://github.com/Kuro95/strava-vam-extension/issues)
3. Create a new issue with the appropriate template
4. Join discussions on GitHub

## 📝 Contributing to Documentation

Found a typo? Have a suggestion? Documentation improvements are welcome!

1. Fork the repository
2. Edit the documentation file
3. Submit a pull request
4. Explain what you changed and why

## 🎓 Learning Path

**Beginner Developer:**
1. GETTING_STARTED.md
2. README.md (Features section)
3. DEVELOPMENT.md (Quick Start)
4. Try making small changes

**Experienced Developer:**
1. DEVELOPMENT.md (File Structure)
2. Browse source code in `src/`
3. Review tests in `tests/`
4. Set up releases with QUICK_REFERENCE.md

**Publishing Your First Release:**
1. QUICK_REFERENCE.md (Overview)
2. MANUAL_UPLOAD.md (Step-by-step)
3. Create manual release tag
4. Upload to Mozilla Add-ons

**Setting Up CI/CD:**
1. MANUAL_UPLOAD.md (First submission)
2. CI-CD-SETUP.md (API credentials)
3. QUICK_REFERENCE.md (Workflows)
4. Switch to automatic releases

**Open Source Contributor:**
1. CONTRIBUTING.md
2. DEVELOPMENT.md (Development Workflow)
3. Find an issue to work on
4. Submit your first PR

---

**Happy learning!** 🚀

*Last updated: October 28, 2025*
