import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { Link } from './Link'
import { formatDate, posts, tags } from '../data/blog'
import { profile } from '../data/profile'

const ALL = 'All'

export function BlogIndex() {
  const [tag, setTag] = useState(ALL)

  const visible = useMemo(
    () => (tag === ALL ? posts : posts.filter((post) => post.tags.includes(tag))),
    [tag],
  )

  return (
    <div className="pt-28 pb-16 sm:pt-32">
      <div className="section-shell">
        <header className="reveal is-visible max-w-2xl">
          <p className="mb-3 font-mono text-xs font-medium tracking-[0.2em] text-accent-600 uppercase dark:text-accent-400">
            Writing
          </p>
          <h1 className="text-4xl sm:text-5xl">Notes from the platform</h1>
          <p className="mt-4 text-base leading-relaxed sm:text-lg">
            Working notes on data platforms, streaming and the parts of the job
            that only show up once something is in production. Written by{' '}
            {profile.name}.
          </p>
        </header>

        {tags.length > 0 && (
          <div className="reveal is-visible mt-10 flex flex-wrap gap-2">
            {[ALL, ...tags].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTag(name)}
                aria-pressed={tag === name}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tag === name
                    ? 'border-accent-400 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-900 dark:border-white/10 dark:text-ink-400 dark:hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="mt-12 text-base text-ink-500 dark:text-ink-400">
            Nothing published under that tag yet.
          </p>
        ) : (
          <ol className="mt-10 flex flex-col gap-4">
            {visible.map((post) => (
              <li key={post.slug}>
                {/* The whole card is the link. The tag row below sits outside
                    it, so those buttons stay independently clickable. */}
                <article className="reveal card group relative px-6 py-6 transition-colors hover:border-accent-400/60 sm:px-8 sm:py-7 dark:hover:border-accent-400/40">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-400 dark:text-ink-500">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span aria-hidden>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>

                  <h2 className="mt-2 text-xl sm:text-2xl">
                    <Link
                      to={`/blog/${post.slug}`}
                      /* Stretched so the click target is the whole card, while
                         the accessible name stays just the title. */
                      className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent-600 dark:group-hover:text-accent-400"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-3 max-w-2xl text-base leading-relaxed">
                    {post.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {post.tags.map((name) => (
                      <span
                        key={name}
                        className="rounded-md border border-ink-200 px-2 py-0.5 font-mono text-xs text-ink-500 dark:border-white/10 dark:text-ink-400"
                      >
                        {name}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent-600 dark:text-accent-400">
                      Read
                      <Icon
                        name="arrow-up-right"
                        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
