import { useEffect, useState } from 'react'
import { ROUTE_CHANGE, readPath, scrollToHash } from '../lib/router'

export type Route =
  | { name: 'home' }
  | { name: 'blog' }
  | { name: 'post'; slug: string }
  | { name: 'notFound'; path: string }

function match(path: string): Route {
  if (path === '/') return { name: 'home' }
  if (path === '/blog') return { name: 'blog' }

  const post = path.match(/^\/blog\/([^/]+)$/)
  if (post) return { name: 'post', slug: decodeURIComponent(post[1]) }

  return { name: 'notFound', path }
}

/**
 * Tracks the current route and handles the scrolling that comes with a change:
 * a hash goes to that section, anything else starts at the top. Both wait a
 * frame so the new page is actually in the DOM first.
 */
export function useRoute(): Route {
  const [path, setPath] = useState(readPath)

  useEffect(() => {
    const sync = () => setPath(readPath())

    window.addEventListener('popstate', sync)
    window.addEventListener(ROUTE_CHANGE, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(ROUTE_CHANGE, sync)
    }
  }, [])

  useEffect(() => {
    const { hash } = window.location

    requestAnimationFrame(() => {
      if (hash) scrollToHash(hash)
      else window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }, [path])

  return match(path)
}
