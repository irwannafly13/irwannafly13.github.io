/**
 * A very small history router. The site has three routes and no need for the
 * data loaders, nested layouts or lazy boundaries a real router brings, so this
 * stays in the same spirit as the rest of src/lib — one job, no dependencies.
 *
 * Paths in this module are always *app* paths: "/", "/blog", "/blog/:slug",
 * with the deploy base stripped off. Only href() and readPath() know that a
 * base path exists at all.
 */

/** "" at the domain root, "/repo-name" under a project Pages site. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export const ROUTE_CHANGE = 'app:routechange'

/** Turns an app path into something an <a href> can use. */
export function href(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:')) return path
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`
}

/** The current app path, base removed and trailing slash normalised away. */
export function readPath(): string {
  let path = window.location.pathname
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length)
  if (!path.startsWith('/')) path = `/${path}`
  if (path.length > 1) path = path.replace(/\/+$/, '')
  return path || '/'
}

/**
 * Pushes an app path and tells the tree about it. `popstate` only fires for
 * back/forward, so a programmatic navigation has to announce itself.
 */
export function navigate(to: string, options: { replace?: boolean } = {}) {
  const [path, hash = ''] = to.split('#')
  const target = `${href(path || readPath())}${hash ? `#${hash}` : ''}`

  if (target === window.location.pathname + window.location.hash) {
    // Same destination — still honour the hash so a repeat click re-scrolls.
    if (hash) scrollToHash(hash)
    return
  }

  if (options.replace) window.history.replaceState({}, '', target)
  else window.history.pushState({}, '', target)

  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE))
}

/**
 * Scrolls to an element by id. Called after a route render rather than left to
 * the browser, because the target section does not exist yet at the moment the
 * URL changes.
 */
export function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, '')
  if (!id) return

  const target = document.getElementById(id)
  if (!target) return

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** True for a click the router should handle instead of the browser. */
export function isPlainLeftClick(event: React.MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  )
}
