/**
 * Image compression utility to reduce file size before upload
 * This significantly speeds up upload times and reduces bandwidth usage
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 2,
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Check if compressed size is acceptable
            const sizeMB = blob.size / (1024 * 1024)
            if (sizeMB > opts.maxSizeMB) {
              // Try again with lower quality
              canvas.toBlob(
                (lowerQualityBlob) => {
                  if (!lowerQualityBlob) {
                    reject(new Error('Failed to compress image'))
                    return
                  }
                  // Ensure filename has .jpg extension to match JPEG MIME type
                  const filename = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
                  const compressedFile = new File(
                    [lowerQualityBlob],
                    filename,
                    { type: 'image/jpeg' }
                  )
                  resolve(compressedFile)
                },
                'image/jpeg',
                Math.max(0.5, opts.quality - 0.2)
              )
            } else {
              // Ensure filename has .jpg extension to match JPEG MIME type
              const filename = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
              const compressedFile = new File(
                [blob],
                filename,
                { type: 'image/jpeg' }
              )
              resolve(compressedFile)
            }
          },
          'image/jpeg', // Always compress to JPEG for consistency
          opts.quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map(file => compressImage(file, options))
  return Promise.all(compressionPromises)
}

/**
 * Create a thumbnail for preview (much smaller than original)
 */
export async function createThumbnail(file: File, size: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate thumbnail dimensions
        const ratio = Math.min(size / width, size / height)
        width = width * ratio
        height = height * ratio

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

