# Manual Upload to Firefox Add-ons Store

This guide explains how to manually upload a signed extension package (.xpi) to the Firefox Add-ons Store.

## 📋 Overview

For the **first submission** or when you need full control over the release process, you should use the manual upload workflow. Once your extension is approved and listed on Mozilla Add-ons (AMO), you can switch to automatic publishing.

## 🎯 When to Use Manual Upload

Use manual upload when:
- ✅ Submitting your extension for the **first time**
- ✅ Your extension is not yet **approved** by Mozilla
- ✅ You want to **review** the package before submission
- ✅ You need to upload **source code** separately (for extensions using minification/compilation)
- ✅ Testing a release before automatic deployment

## 🚀 Creating a Signed Release Package

### Option 1: Using GitHub Actions (Recommended)

#### A. Manual Workflow Dispatch
1. Go to your repository on GitHub
2. Click **Actions** → **Manual Release (Signed XPI)**
3. Click **Run workflow**
4. Enter the version number (e.g., `1.0.4`)
5. Click **Run workflow**
6. Wait for the workflow to complete (2-5 minutes)
7. Download the signed `.xpi` from the **Releases** page

#### B. Git Tag Method
```bash
# Make sure your manifest.json has the correct version
# Example: "version": "1.0.4"

# Create a tag with -manual suffix
git tag v1.0.4-manual

# Push the tag to trigger the workflow
git push origin v1.0.4-manual

# The workflow will automatically:
# - Build the extension
# - Run tests and validation
# - Sign the .xpi
# - Create a GitHub release with the signed package
```

### Option 2: Local Build and Sign

If you have Mozilla API credentials set up locally:

```bash
# 1. Build the extension
npm run build

# 2. Validate the package
npm run validate

# 3. Sign the extension (requires API credentials)
npx web-ext sign \
  --source-dir=dist \
  --artifacts-dir=artifacts \
  --channel=unlisted \
  --api-key=$WEB_EXT_API_KEY \
  --api-secret=$WEB_EXT_API_SECRET

# The signed .xpi will be in the artifacts/ directory
```

**Note:** For local signing, you need to:
1. Get API credentials from https://addons.mozilla.org/developers/
2. Set environment variables `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`

## 📤 Uploading to Firefox Add-ons Store

### Step 1: Prepare Your Account

1. **Create/Sign in to Mozilla Account**
   - Visit: https://addons.mozilla.org/developers/
   - Sign in or create an account
   - Accept the Developer Agreement if prompted

### Step 2: Submit Your Extension

#### For First-Time Submission:

1. **Go to Submit Page**
   - Click **"Submit a New Add-on"**
   - OR visit: https://addons.mozilla.org/developers/addon/submit/

2. **Choose Distribution Channel**
   - Select **"On this site"** (for listing on AMO)
   - Click **Continue**

3. **Upload Your Signed .xpi**
   - Click **"Select a file..."**
   - Choose the signed `.xpi` from your release
   - Wait for validation (30 seconds - 2 minutes)
   - Review any warnings or errors

4. **Fill in Extension Details**
   - **Name**: Strava VAM Extension
   - **Summary**: Track and display your VAM (Vertical Ascent Meters per hour) personal bests across all Strava activities
   - **Categories**: Sports, Productivity
   - **Support Email**: Your contact email
   - **Support Website**: GitHub repository URL
   - **License**: MIT License
   - **Privacy Policy**: Not required (no data collection)

5. **Add Metadata**
   - **Description**: Detailed description of features
   - **Screenshots**: Upload screenshots showing the extension in action
   - **Icon**: Extension icon (already in package)
   - **Release Notes**: What's new in this version

6. **Submit for Review**
   - Review all information
   - Click **"Submit Version"**
   - Your extension enters the review queue

#### For Updating Existing Extension:

1. **Go to Your Extension**
   - Visit: https://addons.mozilla.org/developers/addons
   - Click on "Strava VAM Extension"

2. **Upload New Version**
   - Click **"Upload New Version"**
   - Upload the signed `.xpi` file
   - Fill in release notes
   - Submit for review

### Step 3: Review Process

**What happens during review:**
- Mozilla reviewers check your extension (usually 1-3 days)
- They verify it follows [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- They may request changes or clarifications

**You'll receive email notifications for:**
- ✅ Submission received
- 🔍 Review in progress
- ✅ Approved and published
- ⚠️ Requires changes (if issues found)

## ✅ Validating Your Package Before Upload

Before uploading, validate your package:

```bash
# 1. Check package structure
npm run validate:package

# 2. Validate with web-ext lint
npm run validate

# 3. Manual verification
unzip -l artifacts/*.xpi | head -20
# Verify manifest.json is at root level
# Check all required files are present
```

### Required Files in Package:
- ✅ `manifest.json` (at root)
- ✅ JavaScript files (`background.js`, `content.js`, etc.)
- ✅ HTML files (`popup.html`, `options.html`, etc.)
- ✅ CSS files
- ✅ Icons (16x16, 48x48, 128x128)

## 📚 Mozilla Documentation References

Essential reading from Mozilla Extension Workshop:

1. **[Submitting an Add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)**
   - Step-by-step submission process
   - Required information and metadata

2. **[Signing and Distribution Overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)**
   - How signing works
   - Distribution channels explained

3. **[Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)**
   - What's allowed and prohibited
   - Review guidelines

4. **[Source Code Submission](https://extensionworkshop.com/documentation/publish/source-code-submission/)**
   - When source code is required
   - How to prepare source code

5. **[Package Your Extension](https://extensionworkshop.com/documentation/publish/package-your-extension/)**
   - Packaging requirements
   - File structure guidelines

## 🔄 Switching to Automatic Publishing

Once your extension is **approved and listed** on AMO:

1. **Verify Your Extension is Listed**
   - Check: https://addons.mozilla.org/firefox/addon/strava-vam-extension/
   - Ensure it's publicly visible

2. **Set Up API Credentials in GitHub**
   - Follow: [CI-CD-SETUP.md](CI-CD-SETUP.md)
   - Add `FIREFOX_API_KEY` and `FIREFOX_API_SECRET` to GitHub Secrets

3. **Use Regular Version Tags**
   ```bash
   # Future releases use regular tags (no -manual suffix)
   git tag v1.0.5
   git push origin v1.0.5
   
   # This triggers automatic build, sign, and submission
   ```

4. **Automatic Workflow Will**:
   - Build and test the extension
   - Sign with Mozilla
   - Automatically submit to AMO for review
   - Create GitHub release with artifacts

## 🐛 Troubleshooting

### "The uploaded file is not a valid extension"

**Causes:**
- Missing `manifest.json` at root level
- Invalid JSON in manifest
- Incorrect file structure

**Fix:**
```bash
# Check file structure
unzip -l artifacts/*.xpi | head -20

# Rebuild if needed
npm run build
npm run package
```

### "This version number is not valid"

**Causes:**
- Version already exists on AMO
- Version format incorrect (must be semver: x.y.z)

**Fix:**
- Increment version in `src/manifest.json`
- Follow semantic versioning: MAJOR.MINOR.PATCH

### Validation Errors

Check the output of:
```bash
npm run validate
```

Fix any errors before uploading.

### Upload Times Out

- Try a different browser
- Check your internet connection
- Try uploading at a different time
- Contact Mozilla support if persistent

## 🆘 Getting Help

If you encounter issues:

1. **Check Mozilla's Help**
   - [Extension Workshop](https://extensionworkshop.com/)
   - [Developer Hub](https://addons.mozilla.org/developers/)

2. **Community Support**
   - [Add-ons Discourse](https://discourse.mozilla.org/c/add-ons/35)
   - Matrix: #addons:mozilla.org

3. **Contact Mozilla**
   - Email: amo-admins@mozilla.org (for urgent issues)

## 📊 After Submission Checklist

- [ ] Extension submitted successfully
- [ ] Received confirmation email from Mozilla
- [ ] Extension shows "Awaiting Review" status
- [ ] Screenshots and description are correct
- [ ] Support links work correctly
- [ ] Release notes are clear and helpful
- [ ] Monitoring email for reviewer feedback

## 🎉 Success!

Once approved:
- ✅ Your extension will be live on Firefox Add-ons
- ✅ Users can install it from the store
- ✅ You'll receive update notification emails
- ✅ You can switch to automatic publishing for future releases

---

**Note:** First-time reviews typically take 1-7 days. Be patient and respond promptly to any reviewer feedback.
