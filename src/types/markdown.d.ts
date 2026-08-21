/**
 * What `plugins/markdown.ts` compiles every post in src/content/posts into.
 * The plugin runs at build time, so `marked` never reaches the browser — an
 * imported .md file is already finished HTML plus its frontmatter.
 */
declare module '*.md' {
  const post: {
    /** The filename without its extension. This is the post's URL. */
    slug: string
    title: string
    /** ISO date, YYYY-MM-DD. Sorted on, so keep it parseable. */
    date: string
    summary: string
    tags: string[]
    /** Drafts are compiled but never listed or routed to. */
    draft: boolean
    readingMinutes: number
    html: string
  }
  export default post
}
