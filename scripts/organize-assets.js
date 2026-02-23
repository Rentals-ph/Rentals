#!/usr/bin/env node

/**
 * Asset Organization Script
 * 
 * This script organizes all assets from the root assets folder into
 * categorized subdirectories based on the asset-manifest.json file.
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../public/assets');
const manifestPath = path.join(assetsDir, 'asset-manifest.json');

// Read the manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Track moved files
const movedFiles = [];
const missingFiles = [];

/**
 * Extract directory path from asset path
 */
function getDirectoryFromPath(assetPath) {
  const parts = assetPath.split('/');
  // Remove '/assets' and filename, return the directory path
  return parts.slice(0, -1).join('/');
}

/**
 * Move a file from source to destination
 */
function moveFile(sourcePath, destPath) {
  const sourceFullPath = path.join(assetsDir, sourcePath);
  const destFullPath = path.join(assetsDir, destPath);
  const destDir = path.dirname(destFullPath);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Check if source file exists
  if (!fs.existsSync(sourceFullPath)) {
    missingFiles.push({ source: sourcePath, dest: destPath });
    return false;
  }

  // Move the file
  try {
    fs.renameSync(sourceFullPath, destFullPath);
    movedFiles.push({ source: sourcePath, dest: destPath });
    return true;
  } catch (error) {
    console.error(`Error moving ${sourcePath} to ${destPath}:`, error.message);
    return false;
  }
}

/**
 * Process all assets in the manifest
 */
function organizeAssets() {
  console.log('Starting asset organization...\n');

  // Process each category
  Object.entries(manifest.assets).forEach(([category, assets]) => {
    if (typeof assets === 'object' && assets !== null) {
      Object.values(assets).forEach((asset) => {
        if (asset && asset.path && asset.originalName) {
          // Remove leading slash from asset.path if present
          const currentPath = asset.path.replace(/^\/assets\//, '');
          const newPath = asset.path.replace('/assets/', '');
          // Only move if paths are different
          if (currentPath !== newPath) {
            moveFile(currentPath, newPath);
          }
        }
      });
    }
  });

  // Print summary
  console.log(`\n✅ Organization complete!`);
  console.log(`   Moved ${movedFiles.length} files`);
  
  if (missingFiles.length > 0) {
    console.log(`\n⚠️  Warning: ${missingFiles.length} files were not found:`);
    missingFiles.forEach(({ source, dest }) => {
      console.log(`   - ${source} (expected at ${dest})`);
    });
  }

  console.log(`\n📁 Files organized into:`);
  console.log(`   - logos/`);
  console.log(`   - icons/`);
  console.log(`   - images/placeholders/`);
  console.log(`   - images/blog/`);
  console.log(`   - images/testimonials/`);
  console.log(`   - images/about/`);
  console.log(`   - backgrounds/`);
  console.log(`   - decorative/`);
  console.log(`   - vectors/`);
  console.log(`   - partners/`);
  console.log(`   - groups/`);
  console.log(`   - frames/`);
}

// Run the script
organizeAssets();

