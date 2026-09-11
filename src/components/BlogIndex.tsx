import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { Link } from './Link'
import { formatDate, posts } from '../data/blog'
import { asset } from '../lib/asset'

/**
 * True when every word of the query appears somewhere in the title or tags.
 * Word-wise so "trino groups" still finds "Trino resource groups on Postgres"
 * and a post tagged "trino"; case and surrounding whitespace never matter.
 */
function matches(post: { title: string; tags: string[] }, query: string) {
  const haystack = [post.title, ...post.tags].join(' ').toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export function BlogIndex() {
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () => (query.trim() ? posts.filter((post) => matches(post, query)) : posts),
    [query],
  )

  return (
    <div className="pt-28 pb-16 sm:pt-32">
      <div className="section-shell">
        {/* One box searches titles and tags alike; there is no separate tag
            filter, so typing a tag's name is how you narrow to it. */}
        <label className="reveal is-visible relative ml-auto block max-w-md">
          <span className="sr-only">Search posts by title or tag</span>
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400 dark:text-ink-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or tag…"
            autoComplete="off"
            className="card w-full py-3 pr-11 pl-12 [&::-webkit-search-cancel-button]:hidden text-base text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none dark:text-white dark:placeholder:text-ink-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:text-ink-900 dark:text-ink-500 dark:hover:text-white"
            >
              <Icon name="close" className="size-4" />
            </button>
          )}
        </label>

        {visible.length === 0 ? (
          <p className="mt-12 text-base text-ink-500 dark:text-ink-400">
            Nothing matches that search yet.
          </p>
        ) : (
          <ol className="mt-10 flex flex-col gap-4">
            {visible.map((post) => (
              <li key={post.slug}>
                {/* The whole card is the link. */}
                <article className="reveal card group relative flex flex-col gap-5 px-6 py-6 transition-colors hover:border-accent-400/60 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-7 dark:hover:border-accent-400/40">
                  {post.cover && (
                    /* Preview of the same picture the post opens with, sitting
                       left of the text and centred against it. Fixed box so a
                       tall shot and a wide one leave the cards the same shape,
                       with the crop taken from the middle of the picture; the
                       article's own stretched link covers it, which is why it
                       is not a link itself. */
                    <div className="shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50 sm:w-48 lg:w-56 dark:border-white/10 dark:bg-white/5">
                      <img
                        src={asset(post.cover)}
                        alt=""
                        loading="lazy"
                        className="h-48 w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:h-36 lg:h-40"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-400 dark:text-ink-500">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span aria-hidden>·</span>
                      <span>{post.readingMinutes} min read</span>
                    </div>

                    <h2 className="mt-2 text-xl sm:text-2xl">
                      <Link
                        to={`/blog/${post.slug}`}
                        /* Stretched so the click target is the whole card,
                           while the accessible name stays just the title. */
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
