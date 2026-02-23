/// <reference types="react" />
/// <reference types="react-dom" />

import 'react'
import type { ReactNode } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
    
    interface Element extends ReactNode {}
  }
}

