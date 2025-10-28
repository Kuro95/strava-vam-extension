#!/usr/bin/env node

/**
 * Sign extension script - Creates a signed .xpi for manual upload
 * This does NOT automatically submit to AMO
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const artifactsDir = path.join(__dirname, '..', 'artifacts');

console.log('🔐 Signing Strava VAM Extension for Manual Upload\n');

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Run \'npm run build\' first.');
  process.exit(1);
}

// Check for API credentials
if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
  console.error('❌ Missing API credentials!');
  console.error('\nPlease set environment variables:');
  console.error('  WEB_EXT_API_KEY=your-api-key');
  console.error('  WEB_EXT_API_SECRET=your-api-secret');
  console.error('\nGet credentials from: https://addons.mozilla.org/developers/');
  console.error('\nAlternatively, use GitHub Actions for signing:');
  console.error('  git tag v1.0.4-manual && git push origin v1.0.4-manual');
  process.exit(1);
}

// Create artifacts directory
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Get version from manifest
const manifestPath = path.join(distDir, 'manifest.json');
let version;
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  version = manifest.version;
  console.log(`📌 Extension version: ${version}`);
} catch (error) {
  console.error('❌ Could not read manifest.json');
  process.exit(1);
}

console.log('🔄 Signing with Mozilla...');
console.log('   This may take 30-60 seconds...\n');

try {
  // Sign with unlisted channel (for manual upload)
  execSync('npx web-ext sign --source-dir=dist --artifacts-dir=artifacts --channel=unlisted', {
    stdio: 'inherit',
    env: {
      ...process.env,
      WEB_EXT_API_KEY: process.env.WEB_EXT_API_KEY,
      WEB_EXT_API_SECRET: process.env.WEB_EXT_API_SECRET
    }
  });

  console.log('\n✅ Extension signed successfully!\n');
  
  // List generated files
  const files = fs.readdirSync(artifactsDir);
  const xpiFiles = files.filter(f => f.endsWith('.xpi'));
  
  if (xpiFiles.length > 0) {
    console.log('📦 Signed package created:');
    xpiFiles.forEach(file => {
      const filePath = path.join(artifactsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${file} (${sizeKB} KB)`);
    });
    
    console.log('\n📤 Next steps:');
    console.log('   1. Go to https://addons.mozilla.org/developers/');
    console.log('   2. Upload the signed .xpi file');
    console.log('   3. Fill in extension details');
    console.log('   4. Submit for review');
    console.log('\n📚 Detailed instructions: docs/MANUAL_UPLOAD.md');
  } else {
    console.log('⚠️  No .xpi file found in artifacts/');
    console.log('   Check the output above for errors.');
  }

} catch (error) {
  console.error('\n❌ Signing failed!');
  console.error('\nPossible causes:');
  console.error('  - Invalid API credentials');
  console.error('  - Extension not yet listed on AMO');
  console.error('  - Network connectivity issues');
  console.error('  - Version already exists');
  console.error('\nFor first-time submission, manually upload an unsigned zip first:');
  console.error('  1. Run: npm run package');
  console.error('  2. Upload dist/*.zip to https://addons.mozilla.org/developers/');
  console.error('  3. After approval, you can use signing');
  process.exit(1);
}
