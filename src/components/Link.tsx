import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { href, isPlainLeftClick, navigate } from '../lib/router'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** An app path such as "/blog", "/blog/slug" or "/#experience". */
  to: string
  children: ReactNode
}

/**
 * An anchor that routes in-app. It stays a real <a> with a real href, so
 * middle-click, cmd-click, "open in new tab" and crawlers all behave normally —
 * only a plain left click is intercepted.
 */
export function Link({ to, children, onClick, ...rest }: Props) {
  return (
    <a
      href={href(to)}
      onClick={(event) => {
        onClick?.(event)
        if (!isPlainLeftClick(event)) return
        event.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
