#!/usr/bin/env node

/**
 * Validation script for Strava VAM Extension package
 * Ensures the packaged ZIP contains a valid manifest.json at root
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execPromise = promisify(exec);

const distDir = path.join(__dirname, '..', 'dist');

async function validatePackage() {
  console.log('🔍 Validating package structure...\n');

  // Find the ZIP file
  const files = fs.readdirSync(distDir);
  const zipFiles = files.filter(f => f.endsWith('.zip'));

  if (zipFiles.length === 0) {
    console.error('❌ No ZIP file found in dist/');
    process.exit(1);
  }

  if (zipFiles.length > 1) {
    console.error(`❌ Multiple ZIP files found: ${zipFiles.join(', ')}`);
    console.error('   Expected only one ZIP file.');
    process.exit(1);
  }

  const zipFile = zipFiles[0];
  const zipPath = path.join(distDir, zipFile);

  console.log(`📦 Found package: ${zipFile}`);

  // List contents of ZIP
  let zipContents;
  try {
    const { stdout } = await execPromise(`unzip -l "${zipPath}"`);
    zipContents = stdout;
  } catch (error) {
    console.error('❌ Failed to read ZIP contents:', error.message);
    process.exit(1);
  }

  // Check for manifest.json at root
  const manifestPattern = /^\s+\d+\s+[\d-]+\s+[\d:]+\s+manifest\.json\s*$/m;
  if (!manifestPattern.test(zipContents)) {
    console.error('❌ manifest.json not found at root of ZIP');
    console.error('\nZIP contents:');
    console.error(zipContents);
    process.exit(1);
  }

  console.log('✅ manifest.json found at root');

  // Extract and validate manifest
  const tempDir = path.join('/tmp', `validate-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    await execPromise(`unzip -q "${zipPath}" -d "${tempDir}"`);

    const manifestPath = path.join(tempDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ manifest.json not found after extraction');
      process.exit(1);
    }

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest;
    try {
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      console.error('❌ manifest.json is not valid JSON:', error.message);
      process.exit(1);
    }

    // Validate required fields
    const requiredFields = ['manifest_version', 'name', 'version'];
    const missingFields = requiredFields.filter(field => !(field in manifest));

    if (missingFields.length > 0) {
      console.error(`❌ manifest.json missing required fields: ${missingFields.join(', ')}`);
      process.exit(1);
    }

    console.log('✅ manifest.json is valid JSON with required fields');
    console.log(`   - Name: ${manifest.name}`);
    console.log(`   - Version: ${manifest.version}`);
    console.log(`   - Manifest Version: ${manifest.manifest_version}`);

    // Check for required files
    const requiredFiles = [
      'background.js',
      'content.js',
      'popup.html',
      'popup.js',
      'options.html',
      'options.js',
      'styles.css'
    ];

    const extractedFiles = fs.readdirSync(tempDir);
    const missingFiles = requiredFiles.filter(file => !extractedFiles.includes(file));

    if (missingFiles.length > 0) {
      console.error(`❌ Missing required files: ${missingFiles.join(', ')}`);
      process.exit(1);
    }

    console.log('✅ All required files present');

    // Check for icons directory
    const iconsDir = path.join(tempDir, 'icons');
    if (!fs.existsSync(iconsDir)) {
      console.error('❌ icons directory not found');
      process.exit(1);
    }

    const iconFiles = fs.readdirSync(iconsDir);
    const requiredIcons = ['icon16.png', 'icon48.png', 'icon128.png'];
    const missingIcons = requiredIcons.filter(icon => !iconFiles.includes(icon));

    if (missingIcons.length > 0) {
      console.error(`❌ Missing required icons: ${missingIcons.join(', ')}`);
      process.exit(1);
    }

    console.log('✅ All required icons present');

  } finally {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n✨ Package validation successful!');
  console.log('📦 The package is ready for distribution and Firefox installation.');
}

validatePackage().catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});
