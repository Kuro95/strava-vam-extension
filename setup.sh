#!/bin/bash

# Setup script for Strava VAM Extension repository
# This script helps you initialize the repository on GitHub

set -e

echo "🚀 Strava VAM Extension - Repository Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if [ -d .git ]; then
    echo "⚠️  Git repository already initialized."
    read -p "Do you want to reinitialize? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    rm -rf .git
fi

echo "📦 Step 1: Initializing Git repository..."
git init
git add .
git commit -m "Initial commit: Strava VAM Extension v1.0.0"

echo ""
echo "✅ Git repository initialized!"
echo ""

# Get GitHub username
echo "📝 Step 2: GitHub Configuration"
echo "--------------------------------"
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

# Update package.json and README with GitHub username
echo "🔧 Updating repository URLs..."
sed -i.bak "s/YOUR_USERNAME/$GITHUB_USERNAME/g" package.json README.md CONTRIBUTING.md CHANGELOG.md
rm -f package.json.bak README.md.bak CONTRIBUTING.md.bak CHANGELOG.md.bak

# Update LICENSE with user's name
read -p "Enter your name for the LICENSE: " USER_NAME
if [ ! -z "$USER_NAME" ]; then
    sed -i.bak "s/\[Your Name\]/$USER_NAME/g" LICENSE
    rm -f LICENSE.bak
fi

echo ""
echo "✅ Configuration updated!"
echo ""

# Check if remote repository exists
echo "🌐 Step 3: Connecting to GitHub"
echo "--------------------------------"
echo "Please create a repository on GitHub first:"
echo "  1. Go to: https://github.com/new"
echo "  2. Repository name: strava-vam-extension"
echo "  3. Make it public"
echo "  4. DO NOT initialize with README, .gitignore, or license"
echo ""

read -p "Have you created the repository? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the repository first, then run this script again."
    exit 0
fi

# Add remote
REPO_URL="https://github.com/$GITHUB_USERNAME/strava-vam-extension.git"
echo "Adding remote: $REPO_URL"
git remote add origin "$REPO_URL"

echo ""
echo "✅ Remote repository connected!"
echo ""

# Create main branch and push
echo "📤 Step 4: Pushing to GitHub"
echo "----------------------------"
git branch -M main

echo "Pushing to GitHub..."
if git push -u origin main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
else
    echo ""
    echo "⚠️  Push failed. You may need to authenticate with GitHub."
    echo "Try running: git push -u origin main"
fi

echo ""
echo "🎉 Repository Setup Complete!"
echo "============================="
echo ""
echo "📋 Next Steps:"
echo "1. Add GitHub Secrets for CI/CD:"
echo "   - Go to: https://github.com/$GITHUB_USERNAME/strava-vam-extension/settings/secrets/actions"
echo "   - Add secret: FIREFOX_API_KEY = user:19544985:357"
echo "   - Add secret: FIREFOX_API_SECRET = 38b82723dd35583400e3fa5dfd4b24e97645abcdfce5ec5830735904e8f93897"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Build the extension:"
echo "   npm run build"
echo ""
echo "4. Run tests:"
echo "   npm test"
echo ""
echo "5. Create your first release:"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0"
echo ""
echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/strava-vam-extension"
echo ""
echo "Happy coding! 🚴⛰️"
