#!/usr/bin/env node

/**
 * Build script for Strava VAM Extension
 * Cross-platform Node.js version (works on Windows, Mac, Linux)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building Strava VAM Extension...\n');

// Clean dist directory
console.log('🧹 Cleaning dist directory...');
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy source files
console.log('📦 Copying source files...');
const srcDir = path.join(__dirname, '..', 'src');
const srcFiles = fs.readdirSync(srcDir);

srcFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.statSync(srcPath).isFile()) {
    fs.copyFileSync(srcPath, destPath);
  }
});

// Copy icons
console.log('🎨 Copying icons...');
const iconsDir = path.join(__dirname, '..', 'icons');
const distIconsDir = path.join(distDir, 'icons');
fs.mkdirSync(distIconsDir);

const iconFiles = fs.readdirSync(iconsDir);
iconFiles.forEach(file => {
  fs.copyFileSync(
    path.join(iconsDir, file),
    path.join(distIconsDir, file)
  );
});

// Validate manifest
console.log('✅ Validating manifest.json...');
const manifestPath = path.join(distDir, 'manifest.json');
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;
  console.log(`📌 Version: ${version}`);
  
  // Create version info file
  console.log('📝 Creating version info...');
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Git not available or not a git repo
  }
  
  const versionInfo = `Strava VAM Extension
Version: ${version}
Build Date: ${new Date().toISOString()}
Commit: ${gitCommit}
`;
  
  fs.writeFileSync(path.join(distDir, 'VERSION.txt'), versionInfo);
  
  console.log('\n✨ Build complete! Extension ready in dist/');
  console.log('📊 Build summary:');
  
  // Count files
  const countFiles = (dir) => {
    let count = 0;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isFile()) {
        count++;
      } else if (fs.statSync(fullPath).isDirectory()) {
        count += countFiles(fullPath);
      }
    });
    return count;
  };
  
  const fileCount = countFiles(distDir);
  console.log(`  - Version: ${version}`);
  console.log(`  - Files: ${fileCount}`);
  
  // Calculate size
  const getDirSize = (dir) => {
    let size = 0;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        size += stats.size;
      } else if (stats.isDirectory()) {
        size += getDirSize(fullPath);
      }
    });
    return size;
  };
  
  const size = getDirSize(distDir);
  const sizeKB = Math.round(size / 1024);
  console.log(`  - Size: ${sizeKB} KB`);
  
} catch (error) {
  console.error('❌ manifest.json is not valid JSON');
  console.error(error.message);
  process.exit(1);
}
