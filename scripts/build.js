#!/usr/bin/env node

/**
 * Build script for Strava VAM Extension
 * Ensures dist contains a valid manifest and all assets.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function validateManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found in dist');
    process.exit(1);
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.error('❌ manifest.json is not valid JSON');
    process.exit(1);
  }
  const required = ['manifest_version', 'name', 'version'];
  const missing = required.filter(k => !(k in manifest));
  if (missing.length) {
    console.error(`❌ manifest.json missing required fields: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`📄 manifest version: ${manifest.version}`);
}

function main() {
  // Clean and recreate dist
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  // Copy all assets from src to dist, including manifest.json
  copyRecursive(srcDir, distDir);

  // Optionally copy icons if stored outside src
  const iconsDir = path.join(rootDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    copyRecursive(iconsDir, path.join(distDir, 'icons'));
  }

  // Validate manifest in dist
  validateManifest(path.join(distDir, 'manifest.json'));

  console.log('✅ Build completed; dist is ready');
}

main();
