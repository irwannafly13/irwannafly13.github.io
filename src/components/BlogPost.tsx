import { Icon } from './Icon'
import { Link } from './Link'
import { formatDate, getPost, neighbours } from '../data/blog'

type Props = {
  slug: string
}

export function BlogPost({ slug }: Props) {
  const post = getPost(slug)
  const { newer, older } = neighbours(slug)

  if (!post) return <PostMissing />

  return (
    <div className="pt-28 pb-16 sm:pt-32">
      <article className="section-shell">
        <header className="reveal is-visible max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
          >
            <Icon name="arrow-left" className="size-4" />
            All posts
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-400 dark:text-ink-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl">{post.title}</h1>

          <p className="mt-5 text-lg leading-relaxed text-ink-500 dark:text-ink-400">
            {post.summary}
          </p>

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-ink-200 px-2 py-0.5 font-mono text-xs text-ink-500 dark:border-white/10 dark:text-ink-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <hr className="my-10 border-ink-200 dark:border-white/10" />

        {/* Compiled from this repository's own Markdown at build time — see
            plugins/markdown.ts. Never render anything here that came from
            outside the repo. */}
        <div
          className="prose reveal is-visible"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {(newer || older) && (
          <nav
            aria-label="More posts"
            className="mt-16 grid gap-4 border-t border-ink-200 pt-8 sm:grid-cols-2 dark:border-white/10"
          >
            {newer ? <Neighbour post={newer} direction="newer" /> : <span />}
            {older && <Neighbour post={older} direction="older" />}
          </nav>
        )}
      </article>
    </div>
  )
}

function Neighbour({
  post,
  direction,
}: {
  post: { slug: string; title: string }
  direction: 'newer' | 'older'
}) {
  const newer = direction === 'newer'

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`card group px-5 py-4 transition-colors hover:border-accent-400/60 dark:hover:border-accent-400/40 ${
        newer ? '' : 'sm:text-right'
      }`}
    >
      <span
        className={`flex items-center gap-1.5 font-mono text-xs text-ink-400 dark:text-ink-500 ${
          newer ? '' : 'sm:justify-end'
        }`}
      >
        {newer && <Icon name="arrow-left" className="size-3.5" />}
        {newer ? 'Newer' : 'Older'}
        {!newer && <Icon name="chevron-right" className="size-3.5" />}
      </span>
      <span className="mt-1.5 block font-semibold text-ink-900 group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-400">
        {post.title}
      </span>
    </Link>
  )
}

function PostMissing() {
  return (
    <div className="pt-32 pb-24">
      <div className="section-shell max-w-xl text-center">
        <p className="font-mono text-xs font-medium tracking-[0.2em] text-accent-600 uppercase dark:text-accent-400">
          404
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">No post at that address</h1>
        <p className="mt-4 text-base leading-relaxed">
          It may have been renamed — the filename is the URL, so a rename moves
          the post.
        </p>
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-900"
        >
          <Icon name="arrow-left" className="size-4" />
          All posts
        </Link>
      </div>
    </div>
  )
}
