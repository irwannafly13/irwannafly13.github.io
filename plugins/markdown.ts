import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { marked } from 'marked'
import type { Plugin, ResolvedConfig } from 'vite'

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
  /** Root-relative path in public/, e.g. /blog/my-post/cover.jpg. '' if none. */
  cover: string
  coverAlt: string
  readingMinutes: number
  html: string
}

/** Words per minute used for the reading estimate. Deliberately unhurried. */
const WPM = 200

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** What counts as a picture when a folder is scanned for a post's cover. */
const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)$/i

/**
 * A post's picture lives in public/blog/<slug>/, so the folder holds the cover
 * and whatever else the body references. `cover: /blog/…` in the frontmatter
 * wins. Otherwise the folder is scanned: a file named cover.<ext> is taken
 * first, and failing that a folder holding exactly one picture uses it — drop
 * a png in and the post has a cover, whatever it is called. A folder with
 * several pictures and no cover.<ext> is ambiguous, so nothing is guessed and
 * the post needs a `cover:` line.
 */
function findCover(root: string, slug: string, declared: string): string {
  if (declared) return declared

  const folder = resolve(root, 'public/blog', slug)
  if (!existsSync(folder)) return ''

  const images = readdirSync(folder)
    .filter((name) => IMAGE.test(name))
    .sort()
  const named = images.find((name) => /^cover\./i.test(name))
  const picked = named ?? (images.length === 1 ? images[0] : undefined)

  return picked ? `/blog/${slug}/${picked}` : ''
}

/**
 * Rewrites root-relative src/href in the compiled HTML to sit under the
 * deployed base path — the same job src/lib/asset.ts does for the React tree,
 * done here because a post's body is already HTML by the time it ships. A post
 * therefore writes `![…](/blog/my-post/diagram.png)` and it works from a
 * subdirectory too. Protocol-relative and absolute URLs are untouched.
 */
function withBase(html: string, base: string): string {
  const prefix = base.replace(/\/$/, '')
  if (!prefix) return html
  return html.replace(/(\s(?:src|href)=")\/(?!\/)/g, `$1${prefix}/`)
}

/**
 * A deliberately small YAML subset: one `key: value` per line, with optional
 * quotes, plus `[a, b, c]` inline arrays and true/false. That covers every
 * field a post needs and saves shipping a YAML parser. Anything fancier in a
 * post's frontmatter is a silent no-op, so keep to the documented fields.
 */
function parseFrontmatter(
  raw: string,
): Record<string, string | string[] | boolean> {
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
  let config: ResolvedConfig

  return {
    name: 'profile-markdown',
    enforce: 'pre',

    configResolved(resolved) {
      config = resolved
    },

    /**
     * A post is compiled once and then cached in the module graph, so adding a
     * picture to public/blog/<slug>/ would otherwise not show up until the dev
     * server restarted — the file lands, the page reloads, and the stale
     * module is served again. Invalidating that post's module makes the drop
     * take effect on the next reload.
     */
    configureServer(server) {
      const pictures = resolve(config.root, 'public/blog')
      server.watcher.add(pictures)

      const invalidate = (file: string) => {
        if (!file.startsWith(pictures)) return

        const slug = relative(pictures, file).split(sep)[0]
        const post = resolve(config.root, `src/content/posts/${slug}.md`)
        const module = server.moduleGraph.getModuleById(post)
        if (!module) return

        server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
    },

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
        cover: findCover(
          config.root,
          slug,
          typeof meta.cover === 'string' ? meta.cover : '',
        ),
        coverAlt: typeof meta.coverAlt === 'string' ? meta.coverAlt : '',
        readingMinutes: readingMinutes(body),
        html: withBase(
          marked.parse(body, { async: false, gfm: true, breaks: false }),
          config.base,
        ),
      }

      return {
        code: `export default ${JSON.stringify(post)}`,
        map: null,
      }
    },
  }
}
