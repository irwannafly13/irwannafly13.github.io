import { useEffect } from 'react'
import { profile } from '../data/profile'

/**
 * The title in index.html is what the profile page should keep, so it is
 * captured once at load and restored whenever a route has nothing to add.
 */
const DEFAULT_TITLE = typeof document === 'undefined' ? '' : document.title

/** Keeps <title> in step with the route, since nothing else re-renders <head>. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${profile.name}` : DEFAULT_TITLE
  }, [title])
}
