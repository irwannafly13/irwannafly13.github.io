import { readFileSync } from 'node:fs'
import { marked } from 'marked'
import type { Plugin } from 'vite'

/**
 * The shape a `.md` import resolves to. Kept in step with src/types/markdown.d.ts,
 * which is what the app actually type-checks against.
 */
export type CompiledPost = {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  draft: boolean
  readingMinutes: number
  html: string
}

/** Words per minute used for the reading estimate. Deliberately unhurried. */
const WPM = 200

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/**
 * A deliberately small YAML subset: one `key: value` per line, with optional
 * quotes, plus `[a, b, c]` inline arrays and true/false. That covers every
 * field a post needs and saves shipping a YAML parser. Anything fancier in a
 * post's frontmatter is a silent no-op, so keep to the documented fields.
 */
function parseFrontmatter(raw: string): Record<string, string | string[] | boolean> {
  const out: Record<string, string | string[] | boolean> = {}

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf(':')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (!key) continue

    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      continue
    }

    if (value === 'true' || value === 'false') {
      out[key] = value === 'true'
      continue
    }

    value = value.replace(/^['"]|['"]$/g, '')
    out[key] = value
  }

  return out
}

/** Strips code fences, tags and punctuation so the count is roughly prose. */
function readingMinutes(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')

  const words = prose.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WPM))
}

/**
 * Compiles `src/content/posts/*.md` to a module at build time, so `marked`
 * stays a devDependency and the browser only ever receives finished HTML.
 * The filename (minus the extension) is the post's slug and therefore its URL.
 */
export function markdown(): Plugin {
  return {
    name: 'profile-markdown',
    enforce: 'pre',

    transform(_code, id) {
      const [file] = id.split('?')
      if (!file.endsWith('.md')) return null

      // Read from disk rather than trusting `_code`: another plugin may have
      // already mangled it, and the frontmatter has to survive intact.
      const raw = readFileSync(file, 'utf8')
      const match = raw.match(FRONTMATTER)
      const meta = match ? parseFrontmatter(match[1]) : {}
      const body = match ? raw.slice(match[0].length) : raw

      const slug = file.split('/').pop()!.replace(/\.md$/, '')

      if (!meta.title) {
        this.warn(`${slug}.md has no "title" in its frontmatter`)
      }

      const post: CompiledPost = {
        slug,
        title: typeof meta.title === 'string' ? meta.title : slug,
        date: typeof meta.date === 'string' ? meta.date : '',
        summary: typeof meta.summary === 'string' ? meta.summary : '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        draft: meta.draft === true,
        readingMinutes: readingMinutes(body),
        html: marked.parse(body, { async: false, gfm: true, breaks: false }),
      }

      return {
        code: `export default ${JSON.stringify(post)}`,
        map: null,
      }
    },
  }
}
