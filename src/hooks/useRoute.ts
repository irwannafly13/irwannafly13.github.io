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

type Location = { path: string; hash: string }

function readLocation(): Location {
  return { path: readPath(), hash: window.location.hash }
}

/**
 * Tracks the current location and handles the scrolling that comes with a
 * change: a hash goes to that section, anything else starts at the top. Both
 * wait a frame so the new page is actually in the DOM first.
 */
export function useRoute(): Route {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const sync = () => setLocation(readLocation())

    window.addEventListener('popstate', sync)
    window.addEventListener(ROUTE_CHANGE, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(ROUTE_CHANGE, sync)
    }
  }, [])

  /*
   * Depends on the whole location object, and readLocation() deliberately
   * returns a fresh one per navigation, so this runs even when the path is
   * unchanged. Storing the path alone was a bug: going to "/#skills" while
   * already on "/" set the same string, React bailed out of the update, and
   * the scroll never happened until a second click took navigate()'s
   * same-destination branch instead.
   */
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    /*
     * Effects run after the commit, so the target is normally in the DOM
     * already and this scrolls straight away. Deferring the whole thing to
     * requestAnimationFrame was a mistake: a hash-only change repaints
     * nothing, so the frame — and the scroll with it — could be left waiting
     * until something else happened to trigger one. The retry covers the case
     * where the section genuinely is not mounted yet.
     */
    if (scrollToHash(location.hash)) return

    const frame = requestAnimationFrame(() => scrollToHash(location.hash))
    return () => cancelAnimationFrame(frame)
  }, [location])

  return match(location.path)
}
