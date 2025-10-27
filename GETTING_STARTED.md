# 🚀 Getting Started - Repository Setup

**Congratulations!** You have a complete, production-ready repository structure for your Strava VAM Extension.

## 📦 What's Included

Your repository is set up with:

✅ **Complete Source Code** - All extension files organized properly  
✅ **CI/CD Pipeline** - Automated testing, building, and publishing  
✅ **Testing Framework** - Jest with sample unit tests  
✅ **Code Quality Tools** - ESLint configuration  
✅ **Documentation** - README, contributing guidelines, changelog  
✅ **GitHub Templates** - Issue and PR templates  
✅ **Build Scripts** - Automated build and packaging  
✅ **MIT License** - Free to use and fork  

## 🎯 Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Navigate to the repository folder
cd strava-vam-extension-repo

# Run the setup script
bash setup.sh
```

The script will:
1. Initialize git repository
2. Update configuration with your GitHub username
3. Create initial commit
4. Connect to your GitHub repository
5. Push everything to GitHub

### Option 2: Manual Setup

```bash
# 1. Navigate to repository folder
cd strava-vam-extension-repo

# 2. Initialize git
git init
git add .
git commit -m "Initial commit: Strava VAM Extension v1.0.0"

# 3. Create GitHub repository
# Go to: https://github.com/new
# Name: strava-vam-extension
# Make it public
# DO NOT initialize with README

# 4. Connect to GitHub (replace Kuro95)
git remote add origin https://github.com/Kuro95/strava-vam-extension.git
git branch -M main
git push -u origin main

# 5. Update references in files
# Replace Kuro95 with your GitHub username in:
# - package.json
# - README.md
# - CONTRIBUTING.md
# - CHANGELOG.md
```

## 🔐 Configure GitHub Secrets (IMPORTANT)

For automated publishing to Firefox Add-ons:

1. **Go to your repository on GitHub**
   - `https://github.com/Kuro95/strava-vam-extension`

2. **Navigate to Settings → Secrets → Actions**

3. **Add two secrets:**
   - `FIREFOX_API_KEY` = `user:19544985:357`
   - `FIREFOX_API_SECRET` = `38b82723dd35583400e3fa5dfd4b24e97645abcdfce5ec5830735904e8f93897`

📖 **Detailed Instructions**: See `docs/CI-CD-SETUP.md`

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Package for distribution
npm run package
```

## 🧪 Test Your Extension

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load in Firefox:**
   - Open Firefox
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `dist/manifest.json`

3. **Test on Strava:**
   - Visit any Strava activity with elevation data
   - The VAM widget should appear automatically

## 🎉 Create Your First Release

Once you've tested everything:

```bash
# Verify everything works
npm test
npm run lint
npm run build

# Create and push version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
- ✅ Run tests
- ✅ Build extension
- ✅ Sign with Firefox
- ✅ Create GitHub release
- ✅ Publish to Firefox Add-ons (if secrets configured)

## 📚 Documentation

- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Complete development guide
- **[CI-CD-SETUP.md](docs/CI-CD-SETUP.md)** - GitHub Actions setup
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🎓 Next Steps

1. ✅ Push code to GitHub
2. ✅ Configure GitHub secrets
3. ✅ Test extension locally
4. ✅ Create first release (v1.0.0)
5. ⭐ Star your own repo!
6. 📢 Share with the Strava community

## ❓ Need Help?

- 📖 Read the docs in the `docs/` folder
- 🐛 Check for existing issues
- 💬 Create a discussion on GitHub
- 📧 Review Firefox Add-ons documentation

## 📋 File Structure Overview

```
strava-vam-extension/
├── .github/           # GitHub Actions & templates
├── src/               # Extension source code
├── icons/             # Extension icons
├── tests/             # Unit tests
├── scripts/           # Build scripts
├── docs/              # Documentation
├── package.json       # Node.js config
├── README.md          # Main documentation
├── LICENSE            # MIT License
├── CHANGELOG.md       # Version history
└── setup.sh           # Setup script
```

## 🎊 You're Ready!

Your extension is:
- ✅ Properly structured
- ✅ Fully documented
- ✅ Test-ready
- ✅ CI/CD enabled
- ✅ Production-ready

Now go build something amazing! 🚴⛰️

---

**Questions?** Check the docs or create an issue on GitHub.

**Happy coding!** 🎉
