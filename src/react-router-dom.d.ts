import 'react-router-dom'

declare module 'react-router-dom' {
  import { ComponentProps, ReactElement } from 'react'
  
  export interface LinkProps extends Omit<ComponentProps<'a'>, 'href'> {
    to: string
    replace?: boolean
    state?: any
    reloadDocument?: boolean
    preventScrollReset?: boolean
    relative?: 'route' | 'path'
  }
  
  export function Link(props: LinkProps): ReactElement
}

