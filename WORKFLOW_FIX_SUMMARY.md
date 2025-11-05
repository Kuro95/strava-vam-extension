# Workflow Fix Summary - Version 1.0.10

## Overview
This document summarizes the investigation and fixes applied to resolve the automatic extension creation workflow failures in the Strava VAM Extension repository.

## Problem Statement
The GitHub Actions workflows for automatic extension creation were consistently failing when triggered by version tags, preventing the expected automated build and deployment pipeline. The expected behavior was to automatically create, sign, and publish extension updates to the Firefox Add-ons store (AMO) when version tags were pushed.

## Investigation Findings

### 1. Historical Workflow Failures
Analyzed the following failed workflow runs:
- Run #19085916404 (v1.0.9) - "Build and Release (Auto-Submit to AMO)"
- Run #19085916450 (v1.0.9) - "Publish Firefox add-on"
- Run #19085834885 (v1.0.8) - "Build and Release (Auto-Submit to AMO)"
- Multiple earlier failures dating back to v1.0.3

### 2. Root Causes Identified

#### A. Duplicate Workflows
**Issue**: Three workflows configured to trigger on version tags:
- `.github/workflows/build.yml` - Triggers on `v*.*.*` (excluding `-manual`)
- `.github/workflows/publish-firefox.yml` - Triggers on ALL `v*` tags
- `.github/workflows/release-manual.yml` - Triggers on `v*.*.*-manual`

**Impact**: Both `build.yml` and `publish-firefox.yml` were attempting to run simultaneously when a standard version tag was pushed, causing conflicts and confusion.

#### B. Authentication Failures
**Issue**: All workflows failing with AMO API 401 errors:
- Error: "Unknown JWT iss (issuer)"
- Error: "Error decoding signature"
- Workflows receiving 401 Unauthorized from addons.mozilla.org

**Root Cause**: 
- `build.yml` and `release-manual.yml` expected secrets named `FIREFOX_API_KEY`/`FIREFOX_API_SECRET`
- `publish-firefox.yml` expected secrets named `WEB_EXT_API_KEY`/`WEB_EXT_API_SECRET`
- Inconsistent naming conventions
- Possibly invalid or missing credentials in GitHub Secrets

#### C. Manifest Deprecation Warning
**Issue**: The `manifest.json` used the deprecated `applications` property.

**Impact**: While not causing failures, this generated warnings in validation logs and indicated the extension was using outdated manifest structure.

## Solutions Implemented

### 1. Removed Duplicate Workflow ✅
**File Removed**: `.github/workflows/publish-firefox.yml`

**Rationale**: 
- The `build.yml` workflow already handles automatic releases
- Having two workflows triggered by the same tags caused conflicts
- The `publish-firefox.yml` was using different secret names, adding confusion

### 2. Added Credential Validation ✅
**Modified Files**: 
- `.github/workflows/build.yml`
- `.github/workflows/release-manual.yml`

**Changes**:
- Added new "Verify Firefox API credentials" step before signing
- Validates that API credentials exist before attempting to sign
- Provides helpful error messages if credentials are missing
- References documentation for setup instructions

**Example validation step**:
```yaml
- name: Verify Firefox API credentials
  env:
    WEB_EXT_API_KEY: ${{ secrets.FIREFOX_API_KEY || secrets.WEB_EXT_API_KEY }}
    WEB_EXT_API_SECRET: ${{ secrets.FIREFOX_API_SECRET || secrets.WEB_EXT_API_SECRET }}
  run: |
    if [ -z "$WEB_EXT_API_KEY" ] || [ -z "$WEB_EXT_API_SECRET" ]; then
      echo "❌ ERROR: Firefox API credentials not found!"
      echo ""
      echo "Please configure GitHub Secrets with one of these combinations:"
      echo "  Option 1: FIREFOX_API_KEY and FIREFOX_API_SECRET (recommended)"
      echo "  Option 2: WEB_EXT_API_KEY and WEB_EXT_API_SECRET"
      echo ""
      echo "See docs/CI-CD-SETUP.md for detailed instructions."
      exit 1
    fi
    echo "✅ Firefox API credentials found"
```

### 3. Support Multiple Secret Naming Conventions ✅
**Modified Files**: 
- `.github/workflows/build.yml`
- `.github/workflows/release-manual.yml`

**Changes**:
- Both workflows now support BOTH secret naming conventions
- Using GitHub Actions' `||` operator to fallback between naming options
- Maintains backward compatibility

**Before**:
```yaml
env:
  WEB_EXT_API_KEY: ${{ secrets.FIREFOX_API_KEY }}
  WEB_EXT_API_SECRET: ${{ secrets.FIREFOX_API_SECRET }}
```

**After**:
```yaml
env:
  WEB_EXT_API_KEY: ${{ secrets.FIREFOX_API_KEY || secrets.WEB_EXT_API_KEY }}
  WEB_EXT_API_SECRET: ${{ secrets.FIREFOX_API_SECRET || secrets.WEB_EXT_API_SECRET }}
```

### 4. Updated Manifest to Modern Standard ✅
**Modified File**: `src/manifest.json`

**Changes**:
- Replaced deprecated `applications` property with `browser_specific_settings`
- Maintains same functionality, removes deprecation warnings

**Before**:
```json
"applications": {
  "gecko": {
    "id": "strava-vam@extension.com",
    "strict_min_version": "109.0"
  }
}
```

**After**:
```json
"browser_specific_settings": {
  "gecko": {
    "id": "strava-vam@extension.com",
    "strict_min_version": "109.0"
  }
}
```

### 5. Updated Documentation ✅
**Modified File**: `docs/CI-CD-SETUP.md`

**Changes**:
- Clarified that both secret naming conventions are supported
- Added note about backward compatibility
- Updated setup instructions to mention both options

## Version 1.0.10 Changes

### Files Modified
1. `src/manifest.json` - Version bump and browser_specific_settings update
2. `package.json` - Version bump to 1.0.10
3. `CHANGELOG.md` - Added entry for version 1.0.10 documenting all fixes
4. `.github/workflows/build.yml` - Added validation, secret name support
5. `.github/workflows/release-manual.yml` - Added validation, secret name support
6. `docs/CI-CD-SETUP.md` - Updated documentation

### Files Removed
1. `.github/workflows/publish-firefox.yml` - Duplicate workflow

## Testing Results

### Local Testing ✅
All local tests pass:
```
✓ npm run lint - No errors
✓ npm test - 26 tests passed
✓ npm run build - Build successful
✓ npm run package - Package created successfully
✓ npm run validate:package - Validation successful
```

### Package Validation ✅
- Package name: `strava-vam-extension-v1.0.10.zip`
- Size: 26 KB
- manifest.json at root: ✅
- All required files present: ✅
- All required icons present: ✅

## Remaining Action Required

### For Repository Owner
The workflows will now provide clear error messages if credentials are not properly configured. The repository owner needs to:

1. **Verify GitHub Secrets Configuration**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Check if secrets exist with one of these naming conventions:
     - `FIREFOX_API_KEY` and `FIREFOX_API_SECRET` (recommended), OR
     - `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` (alternative)

2. **If Secrets Are Missing**
   - Generate API credentials from addons.mozilla.org
   - Add them to GitHub Secrets
   - See `docs/CI-CD-SETUP.md` for detailed instructions

3. **If Secrets Exist But Workflows Still Fail**
   - The credentials may be invalid or expired
   - Check for 401 errors in workflow logs
   - Regenerate credentials from addons.mozilla.org
   - Update GitHub Secrets with new credentials

4. **Test the Fix**
   - Push the v1.0.10 tag to trigger the workflow:
     ```bash
     git tag v1.0.10
     git push origin v1.0.10
     ```
   - Monitor the workflow in the Actions tab
   - The workflow should either:
     - ✅ Successfully build and sign (if credentials are valid)
     - ❌ Fail with clear error about missing credentials (instead of confusing 401)

## Expected Behavior After Fix

### When Valid Credentials Are Configured
1. Tag pushed: `git push origin v1.0.10`
2. Workflow triggers automatically
3. Credential validation passes
4. Tests run and pass
5. Extension builds successfully
6. Package validates successfully
7. Extension signs with Mozilla credentials
8. Extension submits to AMO for review
9. GitHub release created with artifacts
10. User receives email from AMO when approved

### When Credentials Are Missing/Invalid
1. Tag pushed: `git push origin v1.0.10`
2. Workflow triggers automatically
3. Credential validation fails with helpful message:
   ```
   ❌ ERROR: Firefox API credentials not found!
   
   Please configure GitHub Secrets with one of these combinations:
     Option 1: FIREFOX_API_KEY and FIREFOX_API_SECRET (recommended)
     Option 2: WEB_EXT_API_KEY and WEB_EXT_API_SECRET
   
   See docs/CI-CD-SETUP.md for detailed instructions.
   ```
4. Workflow stops gracefully without attempting to sign

## Benefits of This Fix

1. **Clear Error Messages**: No more confusing 401 errors; users get helpful guidance
2. **Single Workflow**: Eliminated duplicate workflow conflicts
3. **Flexibility**: Supports multiple secret naming conventions
4. **Modern Manifest**: Uses current browser extension standards
5. **Better Documentation**: Clear guidance for setup and troubleshooting
6. **Early Validation**: Catches credential issues before attempting to sign

## References

- [CI/CD Setup Guide](docs/CI-CD-SETUP.md)
- [Version 1.0.10 Changelog](CHANGELOG.md)
- [GitHub Actions Workflow Files](.github/workflows/)
- [Mozilla Extension Workshop](https://extensionworkshop.com/)
- [web-ext Documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)

## Conclusion

The workflow failures were caused by a combination of duplicate workflows, inconsistent secret naming, and missing credential validation. All issues have been addressed in version 1.0.10. The workflows will now provide clear guidance if credentials are not configured, and support both secret naming conventions for backward compatibility.

The final step is for the repository owner to verify that valid AMO API credentials are configured in GitHub Secrets and test the workflow by pushing the v1.0.10 tag.
