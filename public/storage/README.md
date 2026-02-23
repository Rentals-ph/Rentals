# Storage Directory Structure

This directory follows a professional and scalable image storage structure inspired by Laravel's storage system.

## Directory Structure

```
public/
├── storage/
│   ├── images/
│   │   ├── users/
│   │   │   ├── 1/
│   │   │   │   ├── avatar.jpg
│   │   │   │   └── profile-banner.jpg
│   │   │   ├── 2/
│   │   │   │   └── avatar.jpg
│   │   │   └── 15/
│   │   │       └── avatar.jpg
│   │   ├── properties/
│   │   │   ├── 101/
│   │   │   │   ├── main.jpg
│   │   │   │   ├── gallery-1.jpg
│   │   │   │   └── gallery-2.jpg
│   │   │   ├── 102/
│   │   │   │   └── main.jpg
│   │   │   └── 103/
│   │   │       ├── main.jpg
│   │   │       └── thumbnail.jpg
│   │   ├── posts/
│   │   │   ├── 50/
│   │   │   │   └── featured.jpg
│   │   │   ├── 51/
│   │   │   │   ├── featured.jpg
│   │   │   │   └── thumbnail.jpg
│   │   │   └── 52/
│   │   │       └── cover.jpg
│   │   ├── agents/
│   │   │   ├── 1/
│   │   │   │   ├── avatar.jpg
│   │   │   │   └── banner.jpg
│   │   │   └── 2/
│   │   │       └── avatar.jpg
│   │   └── testimonials/
│   │       ├── 1/
│   │       │   └── avatar.jpg
│   │       └── 2/
│   │           └── avatar.jpg
```

## Benefits

1. **Scalability**: Each entity has its own directory, making it easy to manage thousands of images
2. **Organization**: Clear separation by entity type (users, properties, posts, etc.)
3. **Cleanup**: Easy to delete all images for a specific entity when it's removed
4. **Performance**: Better for CDN caching and file system organization
5. **Professional**: Industry-standard structure used by frameworks like Laravel

## Usage

### Using the Storage Utility

Import the storage utilities from `@/utils/storage`:

```typescript
import { StoragePaths, getStoragePath, getImageUrl } from '@/utils/storage'

// Get user avatar path
const avatarPath = StoragePaths.userAvatar(1) // '/storage/images/users/1/avatar.jpg'

// Get property main image
const propertyImage = StoragePaths.propertyMain(101) // '/storage/images/properties/101/main.jpg'

// Get property gallery image
const galleryImage = StoragePaths.propertyGallery(101, 1) // '/storage/images/properties/101/gallery-1.jpg'

// Custom path
const customPath = getStoragePath('users', 1, 'custom-photo.jpg')
// '/storage/images/users/1/custom-photo.jpg'

// Get full URL (useful for API responses or CDN)
const imageUrl = getImageUrl(avatarPath, 'https://cdn.example.com')
// 'https://cdn.example.com/storage/images/users/1/avatar.jpg'
```

### In React Components

```typescript
import { StoragePaths, getImageUrl } from '@/utils/storage'

function UserProfile({ userId, userImage }) {
  // Use storage path if image is stored locally
  const avatarPath = userImage 
    ? getImageUrl(userImage) 
    : StoragePaths.userAvatar(userId)
  
  return <img src={avatarPath} alt="User avatar" />
}
```

### When Uploading Images

```typescript
import { StoragePaths, generateUniqueFilename } from '@/utils/storage'

async function uploadUserAvatar(userId: number, file: File) {
  // Generate unique filename
  const filename = generateUniqueFilename(file.name, 'avatar')
  
  // Get storage path
  const storagePath = StoragePaths.userAvatar(userId, filename)
  
  // Upload to your API
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', storagePath)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  return storagePath
}
```

## File Naming Conventions

### Users
- `avatar.jpg` - User profile picture
- `profile-banner.jpg` - Profile banner/cover image
- `cover.jpg` - Alternative cover image

### Properties
- `main.jpg` - Main property image
- `gallery-1.jpg`, `gallery-2.jpg`, etc. - Gallery images
- `thumbnail.jpg` - Thumbnail version
- `featured.jpg` - Featured image

### Posts
- `featured.jpg` - Featured post image
- `thumbnail.jpg` - Post thumbnail
- `cover.jpg` - Post cover image

### Agents
- `avatar.jpg` - Agent profile picture
- `banner.jpg` - Agent banner image

### Testimonials
- `avatar.jpg` - Testimonial author photo

## Best Practices

1. **Always use the storage utility functions** - Don't hardcode paths
2. **Generate unique filenames** - Use `generateUniqueFilename()` to avoid conflicts
3. **Validate file types** - Use `isValidImageFilename()` before saving
4. **Clean up on delete** - When deleting an entity, remove its entire directory
5. **Use consistent naming** - Follow the naming conventions above

## Migration from Old Structure

If you're migrating from an old image storage structure:

1. Identify all user-uploaded images (not static assets)
2. Move them to the appropriate `storage/images/{entity-type}/{id}/` directory
3. Update database records to use the new paths
4. Update code to use the storage utility functions

## Static Assets vs User-Uploaded Content

- **Static Assets** (`public/assets/`): Logos, icons, backgrounds, decorative elements
  - These are part of the application codebase
  - Managed via asset manifest system
  
- **User-Uploaded Content** (`public/storage/images/`): User avatars, property photos, blog images
  - These are uploaded by users or generated dynamically
  - Managed via storage utility functions
  - Not committed to git (except directory structure)

## API Integration

When your backend API stores images, it should:
1. Accept the storage path from the frontend
2. Store the file at that path
3. Return the same path in API responses
4. Handle cleanup when entities are deleted

Example API response:
```json
{
  "id": 1,
  "name": "John Doe",
  "avatar": "/storage/images/users/1/avatar.jpg"
}
```

## Notes

- The `.gitkeep` files ensure empty directories are tracked in git
- Actual image files are ignored by `.gitignore`
- In production, consider using a CDN for better performance
- For large applications, consider implementing image optimization/compression

