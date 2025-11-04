# GitHub Actions CI/CD Setup Guide

This guide will help you set up automated testing, building, and publishing for the Strava VAM Extension.

## 🎯 Unified Publishing Workflow

The extension uses a single workflow that automatically determines the publishing channel based on the version:

### Publishing Channels
- **Listed** (for minor releases): Automatically submitted to AMO for public listing
  - Triggered by: `vX.Y` or `vX.Y.0` tags (e.g., `v1.1`, `v2.0.0`)
  - Best for: Major feature releases
  
- **Unlisted** (for patch releases): Signed but not auto-submitted for review
  - Triggered by: `vX.Y.Z` tags where Z > 0 (e.g., `v1.0.7`, `v1.1.1`)
  - Best for: Bug fixes and minor updates
  - Can be manually uploaded to AMO if desired

## 🎯 What Gets Automated

Once configured, GitHub Actions will automatically:

### On Every Push/Pull Request
- ✅ Run ESLint to check code quality
- ✅ Run all unit tests
- ✅ Validate manifest.json
- ✅ Check for security vulnerabilities

### On Version Tag Push (e.g., v1.1 or v1.0.7)
- ✅ Run full test suite
- ✅ Build the extension
- ✅ Verify tag version matches manifest.json
- ✅ Determine channel (listed vs unlisted) based on version
- ✅ Sign with Firefox Add-ons
- ✅ Create GitHub release with signed .xpi and ZIP
- ✅ For listed releases: Auto-submit to AMO for review
- ✅ For unlisted releases: Sign only (can be manually uploaded)

## 🔧 Setup Instructions

### Step 1: Get Firefox API Credentials

You need API credentials to automatically sign and publish to Firefox Add-ons.

**⚠️ Note:** You can skip this step for manual releases. API credentials are only required for automatic submission (Phase 2).

1. **Go to Firefox Add-on Developer Hub**
   - Visit: https://addons.mozilla.org/developers/
   - Sign in with your Mozilla account (create one if needed)

2. **Create Your Extension Listing** (if not already done)
   - Go to: https://addons.mozilla.org/developers/addon/submit/
   - Choose "On this site"
   - Fill in basic information:
     - Name: Strava VAM Extension
     - Summary: Track VAM personal bests on Strava
     - Categories: Sports, Productivity
   - Upload your extension or submit for manual review first

3. **Generate API Credentials** (After extension is listed)
   - Click your username → **"API Credentials"**
   - Click **"Generate new credentials"**
   - You'll see:
     - **JWT issuer** (API Key): `user:12345678:123`
     - **JWT secret** (API Secret): Long hexadecimal string
   - ⚠️ **IMPORTANT**: Copy both values immediately - the secret won't be shown again!

### Step 2: Add Secrets to GitHub

1. **Go to Your Repository**
   - Navigate to: `https://github.com/Kuro95/strava-vam-extension`

2. **Open Settings**
   - Click **"Settings"** tab (top of repository)
   - Click **"Secrets and variables"** → **"Actions"** (left sidebar)

3. **Add WEB_EXT_API_KEY**
   - Click **"New repository secret"**
   - Name: `WEB_EXT_API_KEY`
   - Secret: Paste your **JWT issuer** (e.g., `user:19544985:357`)
   - Click **"Add secret"**

4. **Add WEB_EXT_API_SECRET**
   - Click **"New repository secret"** again
   - Name: `WEB_EXT_API_SECRET`
   - Secret: Paste your **JWT secret** (the long hex string)
   - Click **"Add secret"**

### Step 3: Verify Workflows Are Enabled

1. Go to **"Actions"** tab in your repository
2. You should see workflows:
   - 🧪 **Test and Lint**
   - 🚀 **Publish to Firefox Add-ons**
   - 🔍 **Code Quality**
3. If they're disabled, click **"I understand my workflows, go ahead and enable them"**

## 🚀 How to Trigger a Release

### Prerequisites
1. All tests pass locally: `npm test`
2. Code is linted: `npm run lint`
3. Version updated in `src/manifest.json`
4. CHANGELOG.md updated with changes

### Option A: Using Git Tags (Recommended)

#### For Patch Releases (Unlisted)
```bash
# 1. Update version in manifest.json to X.Y.Z where Z > 0
# Edit src/manifest.json and change "version": "1.0.6" to "1.0.7"

# 2. Update CHANGELOG.md
# Add entry for new version

# 3. Commit changes
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.7"

# 4. Create and push tag
git tag v1.0.7
git push origin main
git push origin v1.0.7

# Result: Signs extension as unlisted (can be manually uploaded to AMO if desired)
```

#### For Minor Releases (Listed - Auto-Submit)
```bash
# 1. Update version in manifest.json to X.Y or X.Y.0
# Edit src/manifest.json and change "version": "1.0.7" to "1.1.0"

# 2. Update CHANGELOG.md
# Add entry for new version

# 3. Commit changes
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.1.0"

# 4. Create and push tag
git tag v1.1.0
git push origin main
git push origin v1.1.0

# Result: Signs and automatically submits to AMO for review
```

### Option B: Using Workflow Dispatch
```bash
# 1. Go to GitHub Actions → Publish to Firefox Add-ons
# 2. Click "Run workflow"
# 3. Enter tag name (e.g., v1.0.7)
# 4. Click "Run workflow"
# 5. Download signed .xpi from Releases page
```

#### What Happens Next

1. **GitHub Actions Starts** (automatically on tag push)
   - View progress: Repository → Actions tab

2. **Build Process** (2-5 minutes)
   - Runs tests
   - Builds extension
   - Signs with Firefox
   - Submits to Firefox Add-ons

3. **GitHub Release Created**
   - Visit: `https://github.com/Kuro95/strava-vam-extension/releases`
   - Contains:
     - Release notes (auto-generated from commits)
     - Signed `.xpi` file
     - Source code `.zip`

4. **Firefox Add-ons Submission**
   - Extension submitted automatically
   - Status: "Awaiting Review" initially
   - Review typically takes 1-3 days
   - You'll receive email when approved

## 📊 Monitoring CI/CD

### View Build Status

1. Go to **"Actions"** tab
2. Click on a workflow run
3. View logs for each step
4. Download artifacts if needed

### Build Status Badges

Add to your README.md:

```markdown
[![Build Status](https://github.com/Kuro95/strava-vam-extension/workflows/Test%20and%20Lint/badge.svg)](https://github.com/Kuro95/strava-vam-extension/actions)
```

### Check Firefox Add-ons Status

1. Visit: https://addons.mozilla.org/developers/addons
2. Find "Strava VAM Extension"
3. Check review status and any reviewer comments

## 🔒 Security Best Practices

### Protect Your Secrets
- ✅ Never commit API keys to the repository
- ✅ Never share API secrets publicly
- ✅ Use GitHub Secrets (they're encrypted)
- ✅ Rotate API keys if compromised

### Review Workflow Files
The workflow files in `.github/workflows/` define what gets executed. Review them to ensure:
- Only trusted actions are used
- No secrets are echoed to logs
- Artifacts don't contain sensitive data

## 🐛 Troubleshooting

### "Secrets not found" Error

**Problem**: GitHub Actions can't find WEB_EXT_API_KEY or WEB_EXT_API_SECRET

**Solution**:
1. Go to Settings → Secrets and variables → Actions
2. Verify both secrets exist
3. Check spelling matches exactly: `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`
4. Re-add secrets if necessary

### "web-ext sign failed" Error

**Problem**: Extension signing failed

**Possible causes**:
1. **Invalid API credentials**
   - Regenerate credentials at addons.mozilla.org
   - Update GitHub secrets

2. **Extension not listed on AMO**
   - Submit extension manually first
   - Wait for approval
   - Then use automated publishing

3. **Version already exists**
   - Increment version number in manifest.json
   - Create new tag

### Build Fails on Test Step

**Problem**: Tests fail during CI/CD

**Solution**:
1. Run tests locally first: `npm test`
2. Fix any failing tests
3. Commit and push fixes
4. Re-run workflow or create new tag

### Firefox Add-ons Rejects Submission

**Problem**: Automated submission rejected by AMO reviewers

**Common reasons**:
- Manifest issues
- Missing permissions explanation
- Code doesn't match source code submission
- Policy violations

**Solution**:
1. Check email from AMO for specific feedback
2. Address issues locally
3. Increment version
4. Create new release

## 📝 Workflow Files Explained

### `.github/workflows/test.yml`
Runs on every push and PR:
- Installs dependencies
- Runs ESLint
- Runs unit tests
- Validates extension

### `.github/workflows/publish-firefox.yml`
Runs on version tags (v*) or workflow dispatch:
- Verifies version matches tag
- Builds extension
- Determines channel (listed vs unlisted) based on version
- Signs with Firefox Add-ons
- Creates GitHub release
- Publishes to AMO (for listed releases)

### `.github/workflows/lint.yml`
Runs on push and PR:
- Code quality checks
- Security scanning
- Dependency audits

## 🎓 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firefox Extension Publishing](https://extensionworkshop.com/documentation/publish/)
- [web-ext Sign Documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)

## ✅ Checklist

### Initial Setup:

- [ ] Mozilla Add-ons account created
- [ ] API credentials generated
- [ ] GitHub secrets added (WEB_EXT_API_KEY and WEB_EXT_API_SECRET)
- [ ] Workflows enabled in GitHub Actions

### Before Each Release:

- [ ] Version updated in src/manifest.json
- [ ] CHANGELOG.md updated
- [ ] All tests passing locally (`npm test`)
- [ ] Code linted (`npm run lint`)
- [ ] Extension validates (`npm run validate`)
- [ ] Decide on channel:
  - [ ] For patch releases (vX.Y.Z where Z>0): Unlisted
  - [ ] For minor releases (vX.Y or vX.Y.0): Listed (auto-submits to AMO)

### Release Process:

After setup, releases are just:
```bash
# For patch releases (unlisted)
git tag v1.0.7 && git push origin v1.0.7

# For minor releases (listed, auto-submit)
git tag v1.1.0 && git push origin v1.1.0
```

🎉 **You're all set!** Your extension will now automatically build, test, and publish on every release!
