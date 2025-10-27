#!/bin/bash

# Create simple SVG icons for the extension

# 16x16 icon
cat > icon16.svg << 'ICON16'
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#fc4c02"/>
  <text x="8" y="12" font-size="10" text-anchor="middle" fill="white" font-weight="bold">V</text>
</svg>
ICON16

# 48x48 icon
cat > icon48.svg << 'ICON48'
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#fc4c02"/>
  <text x="24" y="32" font-size="24" text-anchor="middle" fill="white" font-weight="bold">VAM</text>
</svg>
ICON48

# 128x128 icon
cat > icon128.svg << 'ICON128'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="16" fill="#fc4c02"/>
  <path d="M30 90 L50 40 L64 70 L80 20 L100 90" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="64" y="115" font-size="18" text-anchor="middle" fill="white" font-weight="bold">VAM PB</text>
</svg>
ICON128

# Convert SVGs to PNGs (if convert is available)
if command -v convert &> /dev/null; then
    convert icon16.svg icon16.png
    convert icon48.svg icon48.png
    convert icon128.svg icon128.png
else
    # If ImageMagick is not available, just rename SVGs to PNGs
    # Most modern browsers accept SVGs as extension icons
    cp icon16.svg icon16.png
    cp icon48.svg icon48.png
    cp icon128.svg icon128.png
fi

echo "Icons created successfully"
