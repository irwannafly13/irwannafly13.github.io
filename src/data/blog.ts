/**
 * The blog's index. Posts are Markdown files in src/content/posts — drop a new
 * .md in there and it appears here; there is no list to keep in step. The
 * filename is the slug and therefore the URL, so rename with care once a post
 * is published.
 *
 * See src/content/posts/README.md for the frontmatter fields.
 */

export type Post = {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  draft: boolean
  readingMinutes: number
  html: string
}

/* eager: every post is bundled at build time. There are no network requests
   and no loading states anywhere in the blog. */
const modules = import.meta.glob<{ default: Post }>('../content/posts/*.md', {
  eager: true,
})

/** Newest first. Drafts never leave the working tree. */
export const posts: Post[] = Object.values(modules)
  .map((module) => module.default)
  .filter((post) => !post.draft)
  .sort((a, b) => b.date.localeCompare(a.date))

/** Every tag in use, most-used first, then alphabetically to break ties. */
export const tags: string[] = (() => {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
})()

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}

/**
 * The posts either side of this one, in reading order. Newer first matches the
 * index, so "previous" is the older post — the one you would read next.
 */
export function neighbours(slug: string): { newer?: Post; older?: Post } {
  const index = posts.findIndex((post) => post.slug === slug)
  if (index === -1) return {}
  return { newer: posts[index - 1], older: posts[index + 1] }
}

/** "21 August 2026" — spelled out, because a blog is not a spreadsheet. */
export function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
