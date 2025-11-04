# Extension Packaging and Signing Guide

This document explains how the Strava VAM Extension is packaged and signed for distribution on Firefox Add-ons.

## 📦 Package Structure

The extension follows Mozilla's WebExtension package structure requirements:

```
strava-vam-extension.xpi (or .zip)
├── manifest.json          # Extension metadata (MUST be at root)
├── background.js          # Background script
├── content.js            # Content script
├── popup.html            # Extension popup
├── popup.js              # Popup script
├── options.html          # Settings page
├── options.js            # Settings script
├── leaderboard.html      # Leaderboard page
├── leaderboard.js        # Leaderboard script
├── styles.css            # Content styles
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Requirements
- ✅ `manifest.json` MUST be at the root level (not in a subdirectory)
- ✅ All files referenced in manifest.json must exist
- ✅ Icons must be in the correct sizes (16x16, 48x48, 128x128)
- ✅ Package must be a valid ZIP archive
- ✅ File names and structure must match exactly

## 🔨 Build Process

### 1. Build Command
```bash
npm run build
```

**What it does:**
- Cleans the `dist/` directory
- Copies all source files from `src/` to `dist/`
- Copies icons to `dist/icons/`
- Validates `manifest.json` structure
- Verifies all required fields are present

**Script:** `scripts/build.js`

### 2. Package Command
```bash
npm run package
```

**What it does:**
- Reads version from `dist/manifest.json`
- Creates ZIP archive: `strava-vam-extension-vX.Y.Z.zip`
- Packages all files from `dist/` (at root level)
- Excludes any existing .zip files
- Uses maximum compression
- Saves to `dist/` directory

**Script:** `scripts/package.js`

### 3. Validation
```bash
npm run validate
```

**What it does:**
- Runs `web-ext lint` on the `dist/` directory
- Checks manifest.json validity
- Verifies file references
- Reports errors and warnings
- Ensures Firefox compatibility

**Note:** Some warnings (like UNSAFE_VAR_ASSIGNMENT for innerHTML) are expected and safe in this context.

## 🔐 Signing Process

### Why Signing is Required

Firefox requires all extensions to be signed by Mozilla before they can be installed. This:
- ✅ Prevents malicious extensions
- ✅ Ensures code integrity
- ✅ Protects users from tampering
- ✅ Enables automatic updates

### Signing Methods

#### Method 1: Automated via GitHub Actions (Recommended)

**For Manual Upload (Pre-Approval):**
```bash
**For Patch Releases (Unlisted):**
```bash
git tag v1.0.7
git push origin v1.0.7
```

**Workflow:** `.github/workflows/publish-firefox.yml`
- Detects patch release (vX.Y.Z where Z > 0)
- Signs with `--channel=unlisted`
- Creates signed .xpi ready for manual upload if desired
- Does NOT auto-submit to AMO

**For Minor Releases (Listed - Auto-Submit):**
```bash
git tag v1.1.0
git push origin v1.1.0
```

**Workflow:** `.github/workflows/publish-firefox.yml`
- Detects minor release (vX.Y or vX.Y.0)
- Signs with `--channel=listed`
- Automatically submits to AMO
- Creates GitHub release

#### Method 2: Local Signing

**Prerequisites:**
- Mozilla Add-ons account
- API credentials (JWT issuer and secret)
- Extension already listed on AMO (for most cases)

**Setup:**
```bash
export WEB_EXT_API_KEY="user:12345678:123"
export WEB_EXT_API_SECRET="your-secret-here"
```

**Sign for Manual Upload:**
```bash
npm run build
npm run sign
# or
npm run sign:manual
```

**Sign with Auto-Submit:**
```bash
npm run build
npm run sign:auto
```

### web-ext sign Command Options

#### Unlisted Channel (Manual Upload)
```bash
web-ext sign \
  --source-dir=dist \
  --artifacts-dir=artifacts \
  --channel=unlisted \
  --api-key=$WEB_EXT_API_KEY \
  --api-secret=$WEB_EXT_API_SECRET
```

**Use for:**
- First-time submissions
- Pre-approval testing
- Manual upload workflow

**Result:**
- Creates signed .xpi in `artifacts/`
- Does NOT submit to AMO
- Can be manually uploaded

#### Listed Channel (Automatic Submission)
```bash
web-ext sign \
  --source-dir=dist \
  --artifacts-dir=artifacts \
  --channel=listed \
  --api-key=$WEB_EXT_API_KEY \
  --api-secret=$WEB_EXT_API_SECRET
```

**Use for:**
- After extension is approved and listed
- Automatic CI/CD releases
- Regular version updates

**Result:**
- Creates signed .xpi
- Automatically submits to AMO for review
- Published after review approval

## ✅ Validation Checklist

Before packaging or signing, ensure:

### Manifest Validation
- [ ] `manifest_version` is set (should be 2 for Firefox)
- [ ] `name` is present
- [ ] `version` follows semantic versioning (X.Y.Z)
- [ ] `description` is clear and helpful
- [ ] `permissions` are necessary and justified
- [ ] `browser_specific_settings.gecko.id` is set
- [ ] `browser_specific_settings.gecko.strict_min_version` is appropriate

### File References
- [ ] All `content_scripts.js` files exist
- [ ] All `content_scripts.css` files exist
- [ ] All `icons` exist in correct sizes
- [ ] `background.scripts` files exist
- [ ] `browser_action.default_popup` file exists
- [ ] `options_ui.page` file exists

### Package Structure
- [ ] `manifest.json` is at root (not in subfolder)
- [ ] No unnecessary files included
- [ ] No development files (node_modules, .git, etc.)
- [ ] Total size is reasonable (< 100 MB)

### Testing
- [ ] Extension loads in Firefox (about:debugging)
- [ ] All features work as expected
- [ ] No console errors
- [ ] Permissions are granted correctly
- [ ] Icons display properly

## 🔍 Troubleshooting

### "Invalid manifest" Error

**Problem:** Package rejected due to manifest issues

**Solutions:**
1. Validate JSON syntax: `cat dist/manifest.json | jq`
2. Check required fields are present
3. Verify version format (must be X.Y.Z)
4. Ensure all referenced files exist

### "File not found" Error

**Problem:** Manifest references missing files

**Solutions:**
1. Run `npm run build` to ensure all files are copied
2. Check file paths in manifest.json are relative to root
3. Verify case-sensitive file names match exactly

### "Version already exists"

**Problem:** Trying to sign a version that's already on AMO

**Solutions:**
1. Increment version in `src/manifest.json`
2. Rebuild: `npm run build`
3. Try signing again

### Signing Fails with API Error

**Problem:** web-ext sign returns API error

**Possible causes:**
- Invalid API credentials
- Extension not listed on AMO yet
- Network connectivity issues
- API rate limiting

**Solutions:**
1. Verify credentials at https://addons.mozilla.org/developers/
2. For first submission, upload unsigned package manually first
3. Check internet connection
4. Wait a few minutes and retry

## 📚 Mozilla Documentation

### Official Guides
- [Package Your Extension](https://extensionworkshop.com/documentation/publish/package-your-extension/)
- [Signing and Distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [web-ext Command Reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Extension Manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)

### Submission Requirements
- [Submitting an Add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- [Source Code Submission](https://extensionworkshop.com/documentation/publish/source-code-submission/)

## 🛠️ Scripts Reference

### Available npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `node scripts/build.js` | Build extension to dist/ |
| `package` | `node scripts/package.js` | Create .zip package |
| `validate` | `web-ext lint --source-dir=dist` | Validate with web-ext |
| `validate:package` | `node scripts/validate-package.js` | Verify package structure |
| `sign` | `node scripts/sign.js` | Interactive signing script |
| `sign:manual` | `web-ext sign ... --channel=unlisted` | Sign for manual upload |
| `sign:auto` | `web-ext sign ... --channel=listed` | Sign with auto-submit |
| `dev` | `web-ext run --source-dir=dist` | Run in Firefox for testing |

### Build Scripts Location

All build scripts are in `scripts/` directory:
- `build.js` - Main build script
- `package.js` - Packaging script
- `sign.js` - Interactive signing helper
- `validate-package.js` - Package validation

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**Unified Publishing:** `.github/workflows/publish-firefox.yml`
- Triggered by: `v*` tags or workflow dispatch
- Channel determination:
  - **Listed** (auto-submit): vX.Y or vX.Y.0 (e.g., v1.1, v2.0.0)
  - **Unlisted**: vX.Y.Z where Z > 0 (e.g., v1.0.7, v1.1.1)
- Features:
  - Verifies tag version matches manifest.json
  - Builds and lints extension
  - Signs with Mozilla credentials
  - Creates GitHub release with signed .xpi and ZIP
  - Auto-submits to AMO for listed releases

### Required GitHub Secrets

For signing and submission:
- `FIREFOX_API_KEY` - Mozilla API JWT issuer
- `FIREFOX_API_SECRET` - Mozilla API JWT secret

See [CI-CD-SETUP.md](CI-CD-SETUP.md) for setup instructions.

## 📝 Version Management

### Semantic Versioning

Follow [semver](https://semver.org/):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (1.X.0): New features (backward compatible)
- **PATCH** (1.0.X): Bug fixes

### Version Update Process

1. Update version in `src/manifest.json`
2. Update `CHANGELOG.md` with changes
3. Commit: `git commit -m "chore: bump version to X.Y.Z"`
4. Tag: `git tag vX.Y.Z` or `git tag vX.Y.Z-manual`
5. Push: `git push origin main && git push origin vX.Y.Z`

### Tag Conventions

- `v1.0.4-manual` - Triggers manual release workflow
- `v1.0.4` - Triggers automatic submission workflow

## 🎯 Best Practices

1. **Always validate before signing**
   ```bash
   npm run build
   npm run validate
   npm run validate:package
   ```

2. **Test locally before releasing**
   ```bash
   npm run dev
   # Test in Firefox
   ```

3. **Version increments must be sequential**
   - Can't skip versions
   - Can't reuse versions

4. **Keep packages small**
   - Exclude development files
   - Optimize images
   - Remove unused code

5. **Document changes**
   - Update CHANGELOG.md
   - Write clear release notes
   - Document breaking changes

6. **Security**
   - Never commit API credentials
   - Use GitHub Secrets for CI/CD
   - Rotate credentials if compromised

---

For more information, see:
- [Manual Upload Guide](MANUAL_UPLOAD.md)
- [CI/CD Setup Guide](CI-CD-SETUP.md)
- [Mozilla Extension Workshop](https://extensionworkshop.com/)
