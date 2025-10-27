# Contributing to Strava VAM Extension

Thank you for your interest in contributing! 🎉

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Kuro95/strava-vam-extension/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue using the feature request template
3. Explain:
   - What problem it solves
   - How it should work
   - Why it would be useful

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/Kuro95/strava-vam-extension.git
   cd strava-vam-extension
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run lint
   npm test
   npm run build
   npm run package
   npm run validate:package  # Ensure package structure is valid
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   ```
   
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test changes
   - `chore:` for maintenance tasks

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## 📋 Development Guidelines

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Follow ESLint rules (`npm run lint`)

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Commits

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable (#123)

### Documentation

- Update README.md if you change functionality
- Add JSDoc comments for new functions
- Update CHANGELOG.md for notable changes

## 🏗️ Project Structure

```
src/
├── background.js      # Background service worker
├── content.js         # Content script (runs on Strava pages)
├── popup.html/js      # Extension popup
├── leaderboard.html/js # Leaderboard view
├── options.html/js    # Settings page
└── manifest.json      # Extension manifest
```

## 🧪 Testing Locally

1. Build the extension: `npm run build`
2. Open Firefox: `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `dist/manifest.json`
5. Navigate to Strava and test your changes

## 📦 Release Process

Releases are automated via GitHub Actions:

1. Update version in `src/manifest.json`
2. Update `CHANGELOG.md`
3. Commit changes: `git commit -m "chore: bump version to X.Y.Z"`
4. Create and push tag: 
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
5. GitHub Actions will automatically:
   - Run tests
   - Build extension
   - Sign with Firefox
   - Create GitHub release
   - Publish to Firefox Add-ons

## 🤔 Questions?

- Open a [Discussion](https://github.com/Kuro95/strava-vam-extension/discussions)
- Create an [Issue](https://github.com/Kuro95/strava-vam-extension/issues)

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## 🙏 Thank You!

Every contribution, no matter how small, is valuable and appreciated!
