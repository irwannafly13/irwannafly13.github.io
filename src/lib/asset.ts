/**
 * Resolves a path in public/ against the deployed base path, so links keep
 * working whether the site is served from the domain root or a subdirectory.
 */
export function asset(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:')) return path
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
