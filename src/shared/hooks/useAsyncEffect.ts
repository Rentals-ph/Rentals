import { useEffect, useRef } from 'react'

/**
 * Hook to run async functions in useEffect
 * Prevents memory leaks by tracking if component is still mounted
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps?: React.DependencyList
) {
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const cleanupPromise = effect()

    return () => {
      isMountedRef.current = false
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function' && isMountedRef.current) {
          cleanup()
        }
      })
    }
  }, deps)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
}

