# GitHub Actions CI/CD Setup Guide

This guide will help you set up automated testing, building, and publishing for the Strava VAM Extension.

## 🎯 Two Publishing Modes

The extension supports two release workflows:

### 1. **Manual Release** (For First Submission)
- **Use this BEFORE Mozilla approval**
- Creates signed .xpi for manual upload
- Triggered by: `v*.*.*-manual` tags or workflow dispatch
- Does NOT auto-submit to AMO
- See: [MANUAL_UPLOAD.md](MANUAL_UPLOAD.md)

### 2. **Automatic Release** (After Mozilla Approval)
- **Use this AFTER Mozilla approval**
- Automatically submits to AMO
- Triggered by: `v*.*.*` tags (no suffix)
- Requires API credentials

## 🎯 What Gets Automated

Once configured, GitHub Actions will automatically:

### On Every Push/Pull Request
- ✅ Run ESLint to check code quality
- ✅ Run all unit tests
- ✅ Validate manifest.json
- ✅ Check for security vulnerabilities

### On Manual Release Tag (e.g., v1.0.0-manual)
- ✅ Run full test suite
- ✅ Build the extension
- ✅ Sign with Firefox (unlisted channel)
- ✅ Create GitHub release with signed .xpi
- ✅ **Ready for manual upload to AMO**

### On Version Tag Push (e.g., v1.0.0)
- ✅ Run full test suite
- ✅ Build the extension
- ✅ Sign with Firefox (listed channel)
- ✅ **Automatically submit to Firefox Add-ons store**
- ✅ Create GitHub release with artifacts

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

3. **Add FIREFOX_API_KEY**
   - Click **"New repository secret"**
   - Name: `FIREFOX_API_KEY` (recommended) or `WEB_EXT_API_KEY` (alternative)
   - Secret: Paste your **JWT issuer** (e.g., `user:19544985:357`)
   - Click **"Add secret"**

4. **Add FIREFOX_API_SECRET**
   - Click **"New repository secret"** again
   - Name: `FIREFOX_API_SECRET` (recommended) or `WEB_EXT_API_SECRET` (alternative)
   - Secret: Paste your **JWT secret** (the long hex string)
   - Click **"Add secret"**

> **Note:** The workflows support both secret naming conventions for backward compatibility. Use `FIREFOX_API_KEY`/`FIREFOX_API_SECRET` (recommended) or `WEB_EXT_API_KEY`/`WEB_EXT_API_SECRET`.

### Step 3: Verify Workflows Are Enabled

1. Go to **"Actions"** tab in your repository
2. You should see workflows:
   - 🧪 **Test and Lint**
   - 🏗️ **Build and Release (Auto-Submit to AMO)**
   - 📦 **Manual Release (Signed XPI)**
   - 🔍 **Code Quality**
3. If they're disabled, click **"I understand my workflows, go ahead and enable them"**

## 🚀 How to Trigger a Release

### Phase 1: First Submission (Manual Upload)

**Use this BEFORE your extension is approved by Mozilla.**

#### Prerequisites
1. All tests pass locally: `npm test`
2. Code is linted: `npm run lint`
3. Version updated in `src/manifest.json`
4. CHANGELOG.md updated with changes

#### Option A: Using Workflow Dispatch
```bash
# 1. Go to GitHub Actions → Manual Release (Signed XPI)
# 2. Click "Run workflow"
# 3. Enter version number (e.g., 1.0.4)
# 4. Click "Run workflow"
# 5. Download signed .xpi from Releases page
```

#### Option B: Using Git Tags
```bash
# 1. Update version in manifest.json
# Edit src/manifest.json and change "version": "1.0.0" to "1.0.4"

# 2. Update CHANGELOG.md
# Add entry for new version

# 3. Commit changes
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.4"

# 4. Create and push tag with -manual suffix
git tag v1.0.4-manual
git push origin main
git push origin v1.0.4-manual
```

#### What Happens Next
1. **GitHub Actions Starts** (automatically on tag push)
2. **Build Process** (2-5 minutes)
   - Runs tests
   - Builds extension
   - Signs with Firefox (unlisted channel)
   - Creates GitHub release
3. **Manual Upload Required**
   - Download .xpi from GitHub Releases
   - Upload to https://addons.mozilla.org/developers/
   - Wait for Mozilla review (1-7 days typically)

**📚 See [MANUAL_UPLOAD.md](MANUAL_UPLOAD.md) for detailed upload instructions.**

### Phase 2: Automatic Submission (After Approval)

**Use this AFTER your extension is approved and listed on Mozilla Add-ons.**

#### Prerequisites
1. Extension is **approved and listed** on AMO
2. API credentials configured (see below)
3. All tests pass locally: `npm test`
4. Code is linted: `npm run lint`
5. Version updated in `src/manifest.json`
6. CHANGELOG.md updated with changes

#### Release Steps

```bash
# 1. Update version in manifest.json
# Edit src/manifest.json and change "version": "1.0.4" to "1.0.5"

# 2. Update CHANGELOG.md
# Add entry for new version

# 3. Commit changes
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.5"

# 4. Create and push tag (NO -manual suffix)
git tag v1.0.5
git push origin main
git push origin v1.0.5
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

**Problem**: GitHub Actions can't find FIREFOX_API_KEY or FIREFOX_API_SECRET

**Solution**:
1. Go to Settings → Secrets and variables → Actions
2. Verify both secrets exist
3. Check spelling matches exactly: `FIREFOX_API_KEY` and `FIREFOX_API_SECRET`
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

### `.github/workflows/build.yml`
Runs on version tags (v*.*.):
- Verifies version matches tag
- Runs full test suite
- Builds extension
- Signs with Firefox
- Creates GitHub release
- Publishes to Firefox Add-ons

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

### Before First Release (Manual Upload):

- [ ] Version updated in src/manifest.json
- [ ] CHANGELOG.md updated
- [ ] All tests passing locally (`npm test`)
- [ ] Code linted (`npm run lint`)
- [ ] Extension validates (`npm run validate`)
- [ ] Created manual release tag (e.g., `v1.0.4-manual`)
- [ ] Downloaded signed .xpi from GitHub Releases
- [ ] Mozilla Add-ons account created
- [ ] Manually uploaded .xpi to https://addons.mozilla.org/developers/
- [ ] Extension submitted and awaiting review

### After Mozilla Approval (Automatic Publishing):

- [ ] Extension approved and listed on AMO
- [ ] API credentials generated
- [ ] GitHub secrets added (FIREFOX_API_KEY and FIREFOX_API_SECRET)
- [ ] Workflows enabled in GitHub Actions
- [ ] Version updated in manifest.json
- [ ] CHANGELOG.md updated
- [ ] All tests passing locally
- [ ] Code linted

After setup, releases are just:
```bash
git tag vX.Y.Z && git push origin vX.Y.Z
```

🎉 **You're all set!** Your extension will now automatically build, test, and publish on every release!
