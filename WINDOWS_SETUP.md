# Windows Setup Guide for Strava VAM Extension

## Quick Setup Instructions

Since you're on Windows, here's a simplified setup process:

### Prerequisites
- Git installed (https://git-scm.com/download/win)
- Node.js installed (https://nodejs.org/)

### Step 1: Initialize Git Repository

```powershell
# You're already in the right directory
# C:\Users\Kuro\Documents\Git\strava-vam-extension-repo

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Strava VAM Extension v1.0.0"
```

### Step 2: Connect to GitHub

```powershell
# Add your GitHub repository as remote
git remote add origin https://github.com/Kuro95/strava-vam-extension.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Install Dependencies

```powershell
# Install npm packages
npm install

# Build the extension
npm run build

# Run tests
npm test
```

### Step 4: Test in Firefox

1. Open Firefox
2. Go to: `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to: `C:\Users\Kuro\Documents\Git\strava-vam-extension-repo\dist\`
5. Select `manifest.json`

**Verifying the Installation:**

If you get an error about an invalid manifest, verify your build:

```powershell
# Check that manifest.json exists in dist
Test-Path dist\manifest.json

# View the manifest content
Get-Content dist\manifest.json | ConvertFrom-Json | ConvertTo-Json

# Validate with web-ext
npm run validate
```

The `dist` folder should have this structure:
```
dist/
├── manifest.json       (at root, not in subdirectory)
├── background.js
├── content.js
├── popup.html
├── popup.js
├── options.html
├── options.js
├── styles.css
├── leaderboard.html
├── leaderboard.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Testing the Release ZIP

After creating a release package, test it like a user would:

```powershell
# Create the package
npm run package

# Extract it to a test folder
Expand-Archive -Path "dist\strava-vam-extension-v1.0.4.zip" -DestinationPath "test-install"

# Verify manifest is at root
Test-Path test-install\manifest.json

# Load this folder in Firefox as a temporary add-on
```

### Step 5: Create First Release

```powershell
# Verify everything works
npm test
npm run lint

# Create version tag
git tag v1.0.0

# Push tag to trigger GitHub Actions
git push origin v1.0.0
```

## GitHub Actions will automatically:
- ✅ Run tests
- ✅ Run linter
- ✅ Build extension
- ✅ Package extension (creates ZIP)
- ✅ Validate package structure
- ✅ Validate with web-ext lint
- ✅ Sign with Firefox
- ✅ Create GitHub release with ZIP and XPI files
- ✅ Publish to Firefox Add-ons (after manual first submission)

The release will include:
- `strava-vam-extension-vX.Y.Z.zip` - For temporary installation and testing
- `strava_vam_extension-X.Y.Z.xpi` - Signed version for distribution

## Notes for Windows Users

### Running Scripts
Since bash scripts won't work on Windows, use npm commands instead:

```powershell
# Instead of: bash scripts/build.sh
npm run build

# Instead of: bash scripts/package.sh
npm run package
```

### Git Bash Alternative
If you have Git Bash installed, you can run the bash scripts:

```bash
# Open Git Bash in the repository folder
bash scripts/build.sh
bash scripts/package.sh
```

### PowerShell vs CMD
Use PowerShell (recommended) or Command Prompt for git and npm commands.

## Troubleshooting

**Git not found:**
- Install from: https://git-scm.com/download/win
- Restart PowerShell after installation

**npm not found:**
- Install Node.js from: https://nodejs.org/
- Restart PowerShell after installation

**Scripts fail to execute:**
- Use `npm run` commands instead of bash scripts
- Or use Git Bash for bash script execution

## All Set! 🎉

Your repository is now:
- ✅ Configured with your username (Kuro95)
- ✅ Configured with your name (Kuro)
- ✅ Ready to push to GitHub
- ✅ GitHub secrets already added by you

Just follow the steps above and you're ready to go!
