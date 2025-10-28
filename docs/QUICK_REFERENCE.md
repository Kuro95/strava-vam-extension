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

## 📋 Manual Release (Pre-Approval)

**When to use:** First submission or when you want manual control

### Quick Start
```bash
# 1. Update version in src/manifest.json to 1.0.4
# 2. Update CHANGELOG.md

# 3. Commit and tag
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.4"
git tag v1.0.4-manual
git push origin main v1.0.4-manual

# 4. Wait for GitHub Actions to complete (3-5 min)
# 5. Download signed .xpi from Releases page
# 6. Upload to https://addons.mozilla.org/developers/
```

### What Happens
1. ✅ Tests run
2. ✅ Extension built
3. ✅ Package validated
4. ✅ Signed with Mozilla (unlisted channel)
5. ✅ GitHub release created with .xpi
6. ⏸️ **You manually upload to AMO**

### Workflow File
`.github/workflows/release-manual.yml`

### Alternative: Workflow Dispatch
1. Go to Actions → Manual Release (Signed XPI)
2. Click "Run workflow"
3. Enter version: `1.0.4`
4. Click "Run workflow"

---

## 🚀 Automatic Release (Post-Approval)

**When to use:** After extension is approved and listed on AMO

### Quick Start
```bash
# 1. Update version in src/manifest.json to 1.0.5
# 2. Update CHANGELOG.md

# 3. Commit and tag
git add src/manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.5"
git tag v1.0.5
git push origin main v1.0.5

# 4. Wait for GitHub Actions to complete (3-5 min)
# 5. Extension automatically submitted to AMO
# 6. Wait for Mozilla review (1-3 days)
```

### What Happens
1. ✅ Tests run
2. ✅ Extension built
3. ✅ Package validated
4. ✅ Signed with Mozilla (listed channel)
5. ✅ **Automatically submitted to AMO**
6. ✅ GitHub release created with .xpi
7. ⏳ Mozilla reviews (you get email notification)

### Workflow File
`.github/workflows/build.yml`

### Prerequisites
- Extension must be approved and listed
- GitHub Secrets configured:
  - `FIREFOX_API_KEY`
  - `FIREFOX_API_SECRET`

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

## 📊 Workflow Comparison

| Feature | Manual Release | Automatic Release |
|---------|---------------|-------------------|
| **Tag Format** | `v1.0.4-manual` | `v1.0.4` |
| **Channel** | unlisted | listed |
| **Auto-Submit** | No | Yes |
| **Use When** | Pre-approval | Post-approval |
| **Manual Upload** | Required | Not needed |
| **API Credentials** | Optional* | Required |
| **Workflow File** | `release-manual.yml` | `build.yml` |

*API credentials still needed for signing, but can skip if using unsigned package for first submission

---

## 🎓 Common Scenarios

### Scenario 1: First-Time Submission
```bash
# Create manual release
git tag v1.0.0-manual
git push origin v1.0.0-manual

# Download .xpi from Releases
# Manually upload to AMO
# Wait for approval
```

### Scenario 2: Update After Approval
```bash
# Create automatic release
git tag v1.0.1
git push origin v1.0.1

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
