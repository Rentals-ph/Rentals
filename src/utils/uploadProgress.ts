/**
 * Upload progress tracking utility
 */

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

export type ProgressCallback = (progress: UploadProgress) => void

/**
 * Create FormData with progress tracking support
 */
export function createFormDataWithProgress(
  formData: FormData,
  onProgress?: ProgressCallback
): FormData {
  // Note: Native fetch doesn't support progress, but we can track FormData size
  // For real progress tracking, we'd need XMLHttpRequest or a library
  return formData
}

/**
 * Upload with progress using XMLHttpRequest (for better progress tracking)
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  token: string | null,
  onProgress?: ProgressCallback
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        }
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Create a Response-like object that works with response.json()
        const response = {
          ok: true,
          status: xhr.status,
          statusText: xhr.statusText,
          json: async () => {
            try {
              return JSON.parse(xhr.responseText)
            } catch {
              return {}
            }
          },
          text: async () => xhr.responseText,
        } as Response
        
        resolve(response as Response)
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', url)
    
    // Set authorization header if token exists
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.send(formData)
  })
}

