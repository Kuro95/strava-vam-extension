#!/bin/bash

# Package script for Strava VAM Extension
# Creates a distributable ZIP file

set -e

echo "📦 Packaging Strava VAM Extension..."

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found. Run 'npm run build' first."
  exit 1
fi

# Get version from manifest
VERSION=$(jq -r '.version' dist/manifest.json)
PACKAGE_NAME="strava-vam-extension-v${VERSION}"

echo "📌 Version: $VERSION"
echo "📦 Package name: ${PACKAGE_NAME}.zip"

# Create package
cd dist
zip -r "../${PACKAGE_NAME}.zip" . -x "*.DS_Store" "*.git*"
cd ..

# Move to dist for consistency
mv "${PACKAGE_NAME}.zip" dist/

echo "✨ Package created: dist/${PACKAGE_NAME}.zip"
echo "📊 Package info:"
ls -lh "dist/${PACKAGE_NAME}.zip" | awk '{print "  - Size: " $5}'
echo "  - Ready for distribution"
