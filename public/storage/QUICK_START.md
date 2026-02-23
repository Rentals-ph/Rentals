# Storage System Quick Start Guide

The storage system is fully implemented and ready to use! This guide shows you how to get started quickly.

## ✅ What's Already Set Up

- ✅ Storage utility functions (`src/utils/storage.ts`)
- ✅ Image resolver utilities (`src/utils/imageResolver.ts`)
- ✅ Image upload utilities (`src/utils/imageUpload.ts`)
- ✅ Image compression utilities (`src/utils/imageCompression.ts`)
- ✅ Upload progress tracking (`src/utils/uploadProgress.ts`)
- ✅ Reusable ImageUploader component (`src/components/common/ImageUploader.tsx`)
- ✅ Storage directory structure (`public/storage/images/`)

## 🚀 Quick Examples

### 1. Display an Image

```typescript
import { resolvePropertyImage } from '@/utils/imageResolver'

// In your component
const imageUrl = resolvePropertyImage(property.image, property.id)

<img src={imageUrl} alt="Property" />
```

### 2. Upload a Property Image

```typescript
import ImageUploader from '@/components/common/ImageUploader'

<ImageUploader
  entityType="properties"
  entityId={propertyId}
  imageType="main"
  apiEndpoint="/api/properties/upload-image"
  token={authToken}
  onUploadComplete={(result) => {
    console.log('Uploaded to:', result.path)
    // Save result.path to your database
  }}
/>
```

### 3. Upload User Avatar

```typescript
<ImageUploader
  entityType="users"
  entityId={userId}
  imageType="avatar"
  apiEndpoint="/api/users/upload-avatar"
  token={authToken}
  currentImage={user.avatar}
/>
```

### 4. Upload Multiple Gallery Images

```typescript
<ImageUploader
  entityType="properties"
  entityId={propertyId}
  imageType="gallery"
  multiple={true}
  maxFiles={10}
  apiEndpoint="/api/properties/upload-gallery"
  token={authToken}
  onUploadComplete={(results) => {
    // results is an array of ImageUploadResult
    results.forEach(result => {
      console.log('Gallery image:', result.path)
    })
  }}
/>
```

### 5. Get Storage Path (Without Uploading)

```typescript
import { StoragePaths, getImageUrl } from '@/utils/storage'

// Generate paths
const avatarPath = StoragePaths.userAvatar(1)
// '/storage/images/users/1/avatar.jpg'

const propertyPath = StoragePaths.propertyMain(101)
// '/storage/images/properties/101/main.jpg'

// With CDN
const cdnUrl = getImageUrl(avatarPath, 'https://cdn.example.com')
// 'https://cdn.example.com/storage/images/users/1/avatar.jpg'
```

## 📁 Directory Structure

All images are stored in:
```
public/storage/images/
├── users/
│   └── {userId}/
│       └── avatar.jpg
├── properties/
│   └── {propertyId}/
│       ├── main.jpg
│       └── gallery-1.jpg
├── agents/
│   └── {agentId}/
│       └── avatar.jpg
├── posts/
│   └── {postId}/
│       └── featured.jpg
└── testimonials/
    └── {testimonialId}/
        └── avatar.jpg
```

## 🔧 Available Utilities

### Storage Paths
- `StoragePaths.userAvatar(userId, filename?)`
- `StoragePaths.propertyMain(propertyId, filename?)`
- `StoragePaths.propertyGallery(propertyId, index, filename?)`
- `StoragePaths.agentAvatar(agentId, filename?)`
- `StoragePaths.testimonialAvatar(testimonialId, filename?)`
- `getStoragePath(entityType, entityId, filename)`

### Image Resolution
- `resolvePropertyImage(image, propertyId?, options?)`
- `resolveAvatarImage(image, userId?, options?)`
- `resolveAgentAvatar(image, agentId?, options?)`
- `resolveTestimonialAvatar(image, testimonialId?, options?)`
- `resolveImageUrl(image, options?)`

### Image Upload
- `uploadImage(file, options, apiEndpoint, token?)`
- `uploadImages(files, options, apiEndpoint, token?)`
- `uploadPropertyMainImage(file, propertyId, apiEndpoint, token?, onProgress?)`
- `uploadPropertyGallery(files, propertyId, apiEndpoint, token?, onProgress?)`
- `uploadUserAvatar(file, userId, apiEndpoint, token?, onProgress?)`
- `uploadAgentAvatar(file, agentId, apiEndpoint, token?, onProgress?)`

### Helpers
- `getImageUrl(path, baseUrl?)` - Get full URL (with optional CDN)
- `isStoragePath(path)` - Check if path follows storage structure
- `parseStoragePath(path)` - Extract entity info from path
- `generateUniqueFilename(originalFilename, prefix?)` - Generate unique filename
- `isValidImageFilename(filename)` - Validate image file type

## 📝 Best Practices

1. **Always use the storage utilities** - Don't hardcode paths
2. **Use ImageUploader component** - It handles compression, progress, and errors
3. **Use image resolvers** - They handle fallbacks and placeholders automatically
4. **Compress images** - Enabled by default in upload utilities
5. **Handle errors** - Always provide error callbacks

## 🔗 More Information

- See `public/storage/README.md` for detailed documentation
- See `public/storage/EXAMPLES.md` for more code examples
- See `src/components/common/ImageUploader.example.tsx` for component examples

## 🎯 Common Use Cases

### Property Listing Page
```typescript
import { resolvePropertyImage } from '@/utils/imageResolver'

<img 
  src={resolvePropertyImage(property.image, property.id)} 
  alt={property.title}
/>
```

### User Profile Page
```typescript
import { resolveAvatarImage } from '@/utils/imageResolver'

<img 
  src={resolveAvatarImage(user.avatar, user.id)} 
  alt={user.name}
  className="rounded-full"
/>
```

### Property Upload Form
```typescript
import ImageUploader from '@/components/common/ImageUploader'

<ImageUploader
  entityType="properties"
  entityId={newPropertyId}
  imageType="main"
  apiEndpoint="/api/properties/upload-image"
  token={token}
  onUploadComplete={(result) => {
    // Update property with image path
    updateProperty(newPropertyId, { image: result.path })
  }}
/>
```

---

**The storage system is production-ready!** 🎉

