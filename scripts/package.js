#!/usr/bin/env node

/**
 * Package script for Strava VAM Extension
 * Cross-platform Node.js version (works on Windows, Mac, Linux)
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('📦 Packaging Strava VAM Extension...\n');

// Check if dist exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Run \'npm run build\' first.');
  process.exit(1);
}

// Get version from manifest
const manifestPath = path.join(distDir, 'manifest.json');
let version;
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  version = manifest.version;
} catch (error) {
  console.error('❌ Could not read manifest.json');
  process.exit(1);
}

const packageName = `strava-vam-extension-v${version}.zip`;
const outputPath = path.join(distDir, packageName);

console.log(`📌 Version: ${version}`);
console.log(`📦 Package name: ${packageName}`);

// Create ZIP archive
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  const sizeBytes = archive.pointer();
  const sizeKB = Math.round(sizeBytes / 1024);
  
  console.log(`\n✨ Package created: dist/${packageName}`);
  console.log('📊 Package info:');
  console.log(`  - Size: ${sizeKB} KB`);
  console.log('  - Ready for distribution');
});

archive.on('error', (err) => {
  console.error('❌ Error creating package:', err);
  process.exit(1);
});

archive.pipe(output);

// Add files from dist directory, excluding the zip files themselves
archive.glob('**/*', {
  cwd: distDir,
  ignore: ['*.zip']
});

archive.finalize();
