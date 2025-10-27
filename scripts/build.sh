#!/bin/bash

# Build script for Strava VAM Extension
# This script prepares the extension for distribution

set -e

echo "🔨 Building Strava VAM Extension..."

# Clean dist directory
echo "🧹 Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Copy source files
echo "📦 Copying source files..."
cp -r src/*.js src/*.html src/*.css dist/
cp src/manifest.json dist/

# Copy icons
echo "🎨 Copying icons..."
mkdir -p dist/icons
cp icons/*.png icons/*.svg dist/icons/

# Validate manifest
echo "✅ Validating manifest.json..."
if ! jq empty dist/manifest.json; then
  echo "❌ manifest.json is not valid JSON"
  exit 1
fi

# Get version from manifest
VERSION=$(jq -r '.version' dist/manifest.json)
echo "📌 Version: $VERSION"

# Create version info file
echo "📝 Creating version info..."
cat > dist/VERSION.txt << EOF
Strava VAM Extension
Version: $VERSION
Build Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF

echo "✨ Build complete! Extension ready in dist/"
echo "📊 Build summary:"
echo "  - Version: $VERSION"
echo "  - Files: $(find dist -type f | wc -l)"
echo "  - Size: $(du -sh dist | cut -f1)"
