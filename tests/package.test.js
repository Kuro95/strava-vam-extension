/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

describe('Package Structure Tests', () => {
  let zipFile;

  beforeAll(() => {
    // Ensure dist directory exists and is built
    if (!fs.existsSync(distDir)) {
      throw new Error('dist directory not found. Run npm run build first.');
    }

    // Find the ZIP file
    const files = fs.readdirSync(distDir);
    const zipFiles = files.filter(f => f.endsWith('.zip'));
    
    if (zipFiles.length === 0) {
      throw new Error('No ZIP file found. Run npm run package first.');
    }

    zipFile = path.join(distDir, zipFiles[0]);
  });

  test('manifest.json exists in dist', () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  test('manifest.json is valid JSON', () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('manifest.json has required fields', () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest).toHaveProperty('manifest_version');
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('version');
    expect(manifest).toHaveProperty('description');
  });

  test('ZIP file exists in dist', () => {
    expect(fs.existsSync(zipFile)).toBe(true);
  });

  test('ZIP file contains manifest.json at root', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    // Check for manifest.json at root (not in a subdirectory)
    const manifestPattern = /^\s+\d+\s+[\d-]+\s+[\d:]+\s+manifest\.json\s*$/m;
    expect(manifestPattern.test(output)).toBe(true);
  });

  test('ZIP file does not contain manifest.json in subdirectory', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    // Check that there's no manifest.json with a path separator before it
    const subdirManifestPattern = /\S+\/manifest\.json/;
    expect(subdirManifestPattern.test(output)).toBe(false);
  });

  test('ZIP file contains required extension files', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    const requiredFiles = [
      'background.js',
      'content.js',
      'popup.html',
      'popup.js',
      'options.html',
      'options.js',
      'styles.css'
    ];

    requiredFiles.forEach(file => {
      expect(output).toContain(file);
    });
  });

  test('ZIP file contains icons directory', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    expect(output).toContain('icons/');
  });

  test('ZIP file contains required icon files', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    const requiredIcons = [
      'icon16.png',
      'icon48.png',
      'icon128.png'
    ];

    requiredIcons.forEach(icon => {
      expect(output).toContain(icon);
    });
  });

  test('ZIP file does not contain unnecessary files', () => {
    const output = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf8' });
    
    // These files should not be in the package
    const unnecessaryFiles = [
      '.git',
      '.gitignore',
      'node_modules',
      'package.json',
      'package-lock.json',
      'VERSION.txt',
      '.DS_Store'
    ];

    unnecessaryFiles.forEach(file => {
      expect(output).not.toContain(file);
    });
  });

  test('extracted manifest matches dist manifest', () => {
    const tempDir = fs.mkdtempSync(path.join('/tmp', 'test-'));
    
    try {
      execSync(`unzip -q "${zipFile}" -d "${tempDir}"`);
      
      const distManifest = JSON.parse(
        fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8')
      );
      const zipManifest = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'manifest.json'), 'utf8')
      );

      expect(zipManifest.version).toBe(distManifest.version);
      expect(zipManifest.name).toBe(distManifest.name);
      expect(zipManifest.manifest_version).toBe(distManifest.manifest_version);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
