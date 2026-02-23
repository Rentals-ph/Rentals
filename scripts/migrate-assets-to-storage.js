#!/usr/bin/env node

/**
 * Migration Script: Move images from assets to storage structure
 * 
 * This script:
 * 1. Analyzes images in /public/assets/images/
 * 2. Identifies which should be moved to storage (testimonials, blog posts)
 * 3. Moves them to appropriate storage directories
 * 4. Tracks where they're referenced in the codebase
 * 5. Creates a migration report
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ASSETS_DIR = path.join(__dirname, '../public/assets/images')
const STORAGE_DIR = path.join(__dirname, '../public/storage/images')
const PROJECT_ROOT = path.join(__dirname, '..')

// Mapping of testimonial names to IDs (based on common usage)
const TESTIMONIAL_IDS = {
  'elaine': 1,
  'javie': 2,
  'rica': 3,
}

// Blog image IDs (placeholder IDs - these should match actual blog post IDs if available)
const BLOG_IMAGE_IDS = {
  'blog-main.png': 1,
  'blog-image.png': 2,
  'blog-image2.png': 3,
}

// Track migration
const migrationLog = {
  moved: [],
  skipped: [],
  references: {},
  errors: [],
}

/**
 * Find all references to a file path in the codebase
 */
function findReferences(filePath) {
  const relativePath = filePath.replace(PROJECT_ROOT, '').replace(/\\/g, '/')
  const fileName = path.basename(filePath)
  const references = []

  try {
    // Search for references using grep
    const searchPatterns = [
      fileName,
      relativePath,
      path.basename(filePath, path.extname(filePath)),
    ]

    searchPatterns.forEach(pattern => {
      try {
        const result = execSync(
          `grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" "${PROJECT_ROOT}/src" "${PROJECT_ROOT}/public" 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: PROJECT_ROOT }
        )
        
        if (result.trim()) {
          result.split('\n').forEach(line => {
            if (line.trim() && !line.includes('node_modules')) {
              const [file, ...rest] = line.split(':')
              if (file && rest.length > 0) {
                references.push({
                  file: file.replace(PROJECT_ROOT, '').trim(),
                  line: rest.join(':').trim(),
                })
              }
            }
          })
        }
      } catch (e) {
        // Ignore grep errors
      }
    })
  } catch (error) {
    console.warn(`Error finding references for ${filePath}:`, error.message)
  }

  return references
}

/**
 * Move testimonial image to storage
 */
function moveTestimonialImage(fileName, sourcePath) {
  // Extract testimonial name from filename
  const nameMatch = fileName.match(/(elaine|javie|rica)/i)
  if (!nameMatch) {
    migrationLog.skipped.push({
      file: fileName,
      reason: 'Could not determine testimonial ID',
      path: sourcePath,
    })
    return false
  }

  const testimonialName = nameMatch[1].toLowerCase()
  const testimonialId = TESTIMONIAL_IDS[testimonialName]
  
  if (!testimonialId) {
    migrationLog.skipped.push({
      file: fileName,
      reason: `Unknown testimonial name: ${testimonialName}`,
      path: sourcePath,
    })
    return false
  }

  // Create destination directory
  const destDir = path.join(STORAGE_DIR, 'testimonials', testimonialId.toString())
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Determine new filename
  const ext = path.extname(fileName)
  const newFileName = fileName.includes('-10') ? `avatar-10${ext}` : `avatar${ext}`
  const destPath = path.join(destDir, newFileName)

  try {
    // Copy file (don't delete original yet - we'll do that after verification)
    fs.copyFileSync(sourcePath, destPath)
    
    migrationLog.moved.push({
      from: sourcePath.replace(PROJECT_ROOT, ''),
      to: destPath.replace(PROJECT_ROOT, ''),
      type: 'testimonial',
      entityId: testimonialId,
      fileName: newFileName,
    })

    // Find references
    const references = findReferences(sourcePath)
    if (references.length > 0) {
      migrationLog.references[sourcePath] = references
    }

    return true
  } catch (error) {
    migrationLog.errors.push({
      file: fileName,
      error: error.message,
      path: sourcePath,
    })
    return false
  }
}

/**
 * Move blog image to storage
 */
function moveBlogImage(fileName, sourcePath) {
  const blogId = BLOG_IMAGE_IDS[fileName]
  
  if (!blogId) {
    migrationLog.skipped.push({
      file: fileName,
      reason: 'Unknown blog image ID mapping',
      path: sourcePath,
    })
    return false
  }

  // Create destination directory
  const destDir = path.join(STORAGE_DIR, 'posts', blogId.toString())
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Determine new filename
  const ext = path.extname(fileName)
  const newFileName = fileName === 'blog-main.png' ? 'featured.png' : `featured${ext}`
  const destPath = path.join(destDir, newFileName)

  try {
    // Copy file
    fs.copyFileSync(sourcePath, destPath)
    
    migrationLog.moved.push({
      from: sourcePath.replace(PROJECT_ROOT, ''),
      to: destPath.replace(PROJECT_ROOT, ''),
      type: 'post',
      entityId: blogId,
      fileName: newFileName,
    })

    // Find references
    const references = findReferences(sourcePath)
    if (references.length > 0) {
      migrationLog.references[sourcePath] = references
    }

    return true
  } catch (error) {
    migrationLog.errors.push({
      file: fileName,
      error: error.message,
      path: sourcePath,
    })
    return false
  }
}

/**
 * Main migration function
 */
function migrateImages() {
  console.log('🔍 Analyzing images in assets directory...\n')

  // Process testimonials
  const testimonialsDir = path.join(ASSETS_DIR, 'testimonials')
  if (fs.existsSync(testimonialsDir)) {
    console.log('📁 Processing testimonial images...')
    const testimonialFiles = fs.readdirSync(testimonialsDir)
    
    testimonialFiles.forEach(file => {
      if (file === 'testimonial-person.png') {
        // This is a placeholder, keep it in assets
        migrationLog.skipped.push({
          file,
          reason: 'Placeholder image - should remain in assets',
          path: path.join(testimonialsDir, file),
        })
        return
      }

      const filePath = path.join(testimonialsDir, file)
      if (fs.statSync(filePath).isFile()) {
        moveTestimonialImage(file, filePath)
      }
    })
  }

  // Process blog images
  const blogDir = path.join(ASSETS_DIR, 'blog')
  if (fs.existsSync(blogDir)) {
    console.log('📁 Processing blog images...')
    const blogFiles = fs.readdirSync(blogDir)
    
    blogFiles.forEach(file => {
      const filePath = path.join(blogDir, file)
      if (fs.statSync(filePath).isFile()) {
        moveBlogImage(file, filePath)
      }
    })
  }

  // Generate report
  console.log('\n✅ Migration complete!\n')
  generateReport()
}

/**
 * Generate migration report
 */
function generateReport() {
  const reportPath = path.join(PROJECT_ROOT, 'ASSET_MIGRATION_REPORT.md')
  
  let report = `# Asset Migration Report

Generated: ${new Date().toISOString()}

## Summary

- **Moved**: ${migrationLog.moved.length} files
- **Skipped**: ${migrationLog.skipped.length} files
- **Errors**: ${migrationLog.errors.length} files

## Moved Files

`

  migrationLog.moved.forEach(item => {
    report += `### ${item.type} - ID ${item.entityId}\n`
    report += `- **From**: \`${item.from}\`\n`
    report += `- **To**: \`${item.to}\`\n`
    report += `- **New Filename**: \`${item.fileName}\`\n\n`
  })

  if (migrationLog.skipped.length > 0) {
    report += `## Skipped Files\n\n`
    migrationLog.skipped.forEach(item => {
      report += `- **${item.file}**: ${item.reason}\n`
    })
    report += '\n'
  }

  if (migrationLog.errors.length > 0) {
    report += `## Errors\n\n`
    migrationLog.errors.forEach(item => {
      report += `- **${item.file}**: ${item.error}\n`
    })
    report += '\n'
  }

  if (Object.keys(migrationLog.references).length > 0) {
    report += `## File References\n\n`
    report += `The following files reference the moved images and may need to be updated:\n\n`
    
    Object.entries(migrationLog.references).forEach(([oldPath, refs]) => {
      const movedItem = migrationLog.moved.find(m => m.from === oldPath.replace(PROJECT_ROOT, ''))
      if (movedItem) {
        report += `### \`${oldPath.replace(PROJECT_ROOT, '')}\`\n`
        report += `**New Path**: \`${movedItem.to}\`\n\n`
        report += `**References**:\n`
        refs.forEach(ref => {
          report += `- \`${ref.file}\`: ${ref.line.substring(0, 100)}...\n`
        })
        report += '\n'
      }
    })
  }

  report += `## Next Steps

1. Review the moved files and verify they're in the correct locations
2. Update code references to use the new storage paths
3. Update asset-manifest.json if needed
4. Test the application to ensure images load correctly
5. Once verified, you can delete the original files from /public/assets/images/

## Storage Path Format

The new paths follow the storage structure:
- Testimonials: \`/storage/images/testimonials/{id}/avatar.png\`
- Blog Posts: \`/storage/images/posts/{id}/featured.png\`

Use the storage utilities to access these images:
- \`StoragePaths.testimonialAvatar(id)\`
- \`StoragePaths.postFeatured(id)\`
`

  fs.writeFileSync(reportPath, report)
  console.log(`📄 Report generated: ${reportPath}`)
  console.log(`\n📊 Summary:`)
  console.log(`   - Moved: ${migrationLog.moved.length} files`)
  console.log(`   - Skipped: ${migrationLog.skipped.length} files`)
  console.log(`   - Errors: ${migrationLog.errors.length} files`)
}

// Run migration
if (require.main === module) {
  migrateImages()
}

module.exports = { migrateImages, migrationLog }

