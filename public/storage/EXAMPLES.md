# Storage Usage Examples

## Basic Usage

### Getting Image Paths

```typescript
import { StoragePaths, getStoragePath, getImageUrl } from '@/utils/storage'

// User avatar
const userAvatar = StoragePaths.userAvatar(1)
// Returns: '/storage/images/users/1/avatar.jpg'

// Property main image
const propertyMain = StoragePaths.propertyMain(101)
// Returns: '/storage/images/properties/101/main.jpg'

// Property gallery image (index 1)
const galleryImage = StoragePaths.propertyGallery(101, 1)
// Returns: '/storage/images/properties/101/gallery-1.jpg'

// Custom path
const customPath = getStoragePath('users', 1, 'profile-photo.jpg')
// Returns: '/storage/images/users/1/profile-photo.jpg'
```

### Using in React Components

```typescript
import { StoragePaths, getImageUrl } from '@/utils/storage'
import { ASSETS } from '@/utils/assets'

function PropertyCard({ property }) {
  // Use property image if available, otherwise use placeholder
  const imageUrl = property.image 
    ? getImageUrl(property.image)
    : ASSETS.PLACEHOLDER_PROPERTY_MAIN
  
  return (
    <div className="property-card">
      <img src={imageUrl} alt={property.title} />
      <h3>{property.title}</h3>
    </div>
  )
}
```

### Uploading Images

```typescript
import { StoragePaths, generateUniqueFilename, isValidImageFilename } from '@/utils/storage'
import { compressImage } from '@/utils/imageCompression'

async function uploadPropertyImage(propertyId: number, file: File) {
  // Validate file type
  if (!isValidImageFilename(file.name)) {
    throw new Error('Invalid image file type')
  }
  
  // Compress image before upload
  const compressedFile = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85
  })
  
  // Generate unique filename
  const filename = generateUniqueFilename(compressedFile.name, 'main')
  
  // Get storage path
  const storagePath = StoragePaths.propertyMain(propertyId, filename)
  
  // Upload to API
  const formData = new FormData()
  formData.append('file', compressedFile)
  formData.append('path', storagePath)
  formData.append('property_id', propertyId.toString())
  
  const response = await fetch('/api/properties/upload-image', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('Upload failed')
  }
  
  const data = await response.json()
  return data.path || storagePath
}
```

### Uploading Multiple Gallery Images

```typescript
import { StoragePaths, generateUniqueFilename } from '@/utils/storage'
import { compressImages } from '@/utils/imageCompression'

async function uploadPropertyGallery(propertyId: number, files: File[]) {
  // Compress all images
  const compressedFiles = await compressImages(files)
  
  // Upload each image
  const uploadPromises = compressedFiles.map(async (file, index) => {
    const filename = generateUniqueFilename(file.name, `gallery-${index + 1}`)
    const storagePath = StoragePaths.propertyGallery(propertyId, index + 1, filename)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', storagePath)
    formData.append('property_id', propertyId.toString())
    formData.append('index', (index + 1).toString())
    
    const response = await fetch('/api/properties/upload-gallery', {
      method: 'POST',
      body: formData
    })
    
    return response.json()
  })
  
  return Promise.all(uploadPromises)
}
```

### Parsing Storage Paths

```typescript
import { parseStoragePath, isStoragePath } from '@/utils/storage'

const path = '/storage/images/users/1/avatar.jpg'

// Check if it's a valid storage path
if (isStoragePath(path)) {
  const parsed = parseStoragePath(path)
  // Returns: {
  //   entityType: 'users',
  //   entityId: '1',
  //   filename: 'avatar.jpg'
  // }
  
  console.log(`Entity: ${parsed.entityType}`)
  console.log(`ID: ${parsed.entityId}`)
  console.log(`File: ${parsed.filename}`)
}
```

### Using with CDN

```typescript
import { StoragePaths, getImageUrl } from '@/utils/storage'

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || ''

function getOptimizedImageUrl(path: string, width?: number) {
  const baseUrl = getImageUrl(path, CDN_BASE_URL)
  
  // Add image optimization parameters if using a CDN service
  if (width && CDN_BASE_URL) {
    return `${baseUrl}?w=${width}&q=80`
  }
  
  return baseUrl
}

// Usage
const avatarUrl = getOptimizedImageUrl(
  StoragePaths.userAvatar(1),
  200 // width in pixels
)
```

### Handling Image Errors

```typescript
import { StoragePaths, getImageUrl } from '@/utils/storage'
import { ASSETS } from '@/utils/assets'

function UserAvatar({ userId, userImage }) {
  const avatarPath = userImage 
    ? getImageUrl(userImage)
    : StoragePaths.userAvatar(userId)
  
  return (
    <img
      src={avatarPath}
      alt="User avatar"
      onError={(e) => {
        // Fallback to placeholder if image fails to load
        const target = e.target as HTMLImageElement
        target.src = ASSETS.PLACEHOLDER_PROFILE
      }}
    />
  )
}
```

## Migration Example

If you're migrating existing images to the new structure:

```typescript
// Old structure: /images/properties/property-101.jpg
// New structure: /storage/images/properties/101/main.jpg

function migratePropertyImage(oldPath: string, propertyId: number) {
  // Extract filename from old path
  const filename = oldPath.split('/').pop() || 'main.jpg'
  
  // Generate new path
  const newPath = StoragePaths.propertyMain(propertyId, filename)
  
  // In a real migration, you would:
  // 1. Copy file from old location to new location
  // 2. Update database record
  // 3. Delete old file
  
  return newPath
}
```

