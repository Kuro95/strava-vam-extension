# Quick Reference: Release Workflows

## 🎯 Which Workflow Should I Use?

### ❓ Is your extension already approved and listed on Mozilla Add-ons?

#### ❌ NO - Not Yet Approved
**Use: Manual Release Workflow**
- Tag format: `v1.0.4-manual`
- Result: Signed .xpi for manual upload
- Next step: Upload to https://addons.mozilla.org/developers/

#### ✅ YES - Already Approved and Listed
**Use: Automatic Release Workflow**
- Tag format: `v1.0.4` (no suffix)
- Result: Automatically submitted to AMO
- Next step: Wait for review (1-3 days)

---

## 🚀 Publishing to Firefox Add-ons

### Channel Selection (Automatic)

The workflow automatically determines the channel based on version:

- **Unlisted** (Patch): vX.Y.Z where Z > 0 (e.g., v1.0.7, v1.1.1)
  - Signs but doesn't auto-submit
  - Good for: Bug fixes, minor updates
  
- **Listed** (Minor): vX.Y or vX.Y.0 (e.g., v1.1.0, v2.0.0)
  - Signs and auto-submits to AMO
  - Good for: Feature releases

### Quick Start - Patch Release (Unlisted)
```bash
# 1. Update version in src/manifest.json to X.Y.Z (where Z > 0)
# 2. Update CHANGELOG.md

# 3. Commit and tag
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.7"
git tag v1.0.7
git push origin main v1.0.7

# 4. Wait for GitHub Actions (3-5 min)
# 5. Download signed .xpi from GitHub Releases
# 6. Manually upload to AMO if desired
```

### Quick Start - Minor Release (Listed)
```bash
# 1. Update version in src/manifest.json to X.Y.0
# 2. Update CHANGELOG.md

# 3. Commit and tag
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main v1.1.0

# 4. Wait for GitHub Actions (3-5 min)
# 5. Extension automatically submitted to AMO
# 6. Wait for Mozilla review (1-3 days)
```

### Workflow File
`.github/workflows/publish-firefox.yml`

### Prerequisites
- GitHub Secrets configured:
  - `WEB_EXT_API_KEY`
  - `WEB_EXT_API_SECRET`

---

## 🛠️ Local Development Workflows

### Build and Test Locally
```bash
npm install
npm run build
npm run test
npm run lint
npm run validate
```

### Test in Firefox
```bash
npm run dev
# Opens Firefox with extension loaded
```

### Create Package (No Signing)
```bash
npm run build
npm run package
# Creates: dist/strava-vam-extension-vX.Y.Z.zip
```

### Sign Locally (Requires API Credentials)
```bash
export WEB_EXT_API_KEY="user:12345678:123"
export WEB_EXT_API_SECRET="your-secret-here"

npm run build
npm run sign
# Creates signed .xpi in artifacts/
```

---

## 📊 Publishing Channels

| Feature | Patch Release (Unlisted) | Minor Release (Listed) |
|---------|--------------------------|------------------------|
| **Tag Format** | `v1.0.7` (Z > 0) | `v1.1.0` or `v1.1` |
| **Channel** | unlisted | listed |
| **Auto-Submit** | No | Yes |
| **Use When** | Bug fixes, minor updates | Feature releases |
| **Manual Upload** | Optional | Not needed |
| **Workflow File** | `publish-firefox.yml` | `publish-firefox.yml` |

---

## 🎓 Common Scenarios

### Scenario 1: First-Time Submission (Patch)
```bash
# Create patch release (unlisted)
git tag v1.0.7
git push origin v1.0.7

# Download .xpi from Releases
# Manually upload to AMO
# Wait for approval
```

### Scenario 2: Feature Release (Auto-Submit)
```bash
# Create minor release (listed)
git tag v1.1.0
git push origin v1.1.0

# Workflow auto-submits to AMO
# Wait for approval
```

### Scenario 3: Testing Before Release
```bash
# Build locally
npm run build
npm run dev

# Test thoroughly
# Then create release tag
```

### Scenario 4: Emergency Hotfix
```bash
# Update version to 1.0.2 (patch)
# Fix the bug
git tag v1.0.2
git push origin v1.0.2

# Auto-submits to AMO
```

---

## 🔑 Required GitHub Secrets

Setup once before using automatic releases:

1. Go to https://addons.mozilla.org/developers/
2. Generate API credentials
3. Add to GitHub:
   - Settings → Secrets and variables → Actions
   - `FIREFOX_API_KEY`: Your JWT issuer
   - `FIREFOX_API_SECRET`: Your JWT secret

See [CI-CD-SETUP.md](CI-CD-SETUP.md) for detailed instructions.

---

## 📚 Documentation

- [Manual Upload Guide](MANUAL_UPLOAD.md) - Step-by-step manual submission
- [CI/CD Setup](CI-CD-SETUP.md) - Configure automatic releases
- [Packaging Guide](PACKAGING.md) - Technical details on packaging
- [Mozilla Workshop](https://extensionworkshop.com/) - Official docs

---

## ⚠️ Important Notes

1. **Version Numbers**
   - Must follow semver: X.Y.Z
   - Must increment sequentially
   - Cannot reuse versions

2. **Tag Suffixes**
   - `-manual` suffix = manual upload workflow
   - No suffix = automatic submission workflow
   - Don't mix them up!

3. **First Submission**
   - Always use manual workflow first
   - Switch to automatic after approval

4. **API Credentials**
   - Only needed for automatic releases
   - Keep them secret
   - Rotate if compromised

---

## 🆘 Quick Troubleshooting

### Build Fails
```bash
npm ci          # Clean install
npm run test    # Check tests
npm run lint    # Check linting
```

### Version Mismatch
```bash
# Ensure version in src/manifest.json matches tag
jq -r '.version' src/manifest.json
```

### Signing Fails
- Check API credentials are correct
- Verify extension is listed on AMO
- Ensure version doesn't already exist
- Check network connectivity

### Wrong Workflow Triggered
- Manual: Tag must have `-manual` suffix
- Automatic: Tag must NOT have `-manual` suffix
- Check tag: `git tag -l`
- Delete wrong tag: `git tag -d vX.Y.Z && git push origin :vX.Y.Z`

---

**Last Updated:** 2025-10-28
