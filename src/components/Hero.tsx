import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { asset } from '../lib/asset'
import { profile, socials } from '../data/profile'

/** Cycles the hero taglines with a typing/deleting effect. */
function useTypewriter(words: string[]) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(words[0])
      return
    }

    const word = words[index % words.length]
    const done = !deleting && text === word
    const cleared = deleting && text === ''

    const delay = done ? 1800 : cleared ? 300 : deleting ? 35 : 65

    const timer = setTimeout(() => {
      if (done) return setDeleting(true)
      if (cleared) {
        setDeleting(false)
        return setIndex((current) => (current + 1) % words.length)
      }
      setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)

    return () => clearTimeout(timer)
  }, [text, deleting, index, words])

  return text
}

/**
 * Full class names, not interpolated fragments — Tailwind only ships classes
 * it can find as complete strings in the source.
 */
const STAT_COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function Hero() {
  const typed = useTypewriter(profile.taglines)
  const statColumns = STAT_COLUMNS[profile.stats.length] ?? 'sm:grid-cols-3'

  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-4 sm:pt-24 sm:pb-6">
      {/* Ambient background wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl dark:bg-accent-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,white_85%)] dark:bg-[radial-gradient(circle_at_center,transparent_35%,var(--color-ink-950)_85%)]" />
      </div>

      <div className="section-shell">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:gap-14">
          {/* Centred while the column is stacked; from sm up the row's own
              alignment takes over. */}
          <div className="reveal is-visible shrink-0 self-center sm:self-auto">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-full bg-linear-to-tr from-accent-500/30 to-transparent blur-xl"
              />
              {profile.avatarUrl ? (
                <div className="relative size-40 sm:size-56">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-ink-950"
                  />
                  {/* The mask lives on the wrapper, not the image: a transform on
                      the image would scale its own mask along with it. The wrapper
                      is 111% tall and bottom-aligned, which is what puts the crown
                      of the head 5% of the diameter above the circle. */}
                  <div className="avatar-cutout absolute inset-x-0 bottom-0 h-[111%]">
                    <img
                      /* Already a built URL, base path included. Don't re-resolve. */
                      src={profile.avatarUrl}
                      alt={profile.name}
                      width={224}
                      height={249}
                      /* Scaling about the crown of the head keeps that 5% overhang
                         fixed while the rest of the portrait grows downward. */
                      className="size-full origin-[50%_5.38%] scale-110 object-contain object-bottom"
                    />
                  </div>
                  {/* The photo fades to near-black (#0d0f12) at the hem rather
                      than to transparent, so the circle behind it is pinned to
                      ink-950 (#0e1015) to match. Both layers stay that colour in
                      light mode too — theming them would leave the dark hem
                      sitting on a pale circle, which is what made the avatar
                      read differently between the two themes. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-linear-to-t from-ink-950 from-10% to-transparent to-45%"
                  />
                </div>
              ) : (
                <div className="relative grid size-40 place-items-center rounded-full bg-linear-to-br from-accent-500 to-accent-700 font-mono text-5xl font-semibold text-white ring-1 ring-white/20 sm:size-56 sm:text-6xl">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div className="reveal is-visible min-w-0 flex-1">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Open to opportunities · {profile.location}
            </p>

            <h1 className="text-center text-4xl leading-[1.1] sm:text-left sm:text-5xl lg:text-6xl">
              {profile.name}
            </h1>

            <p className="mt-4 font-mono text-base text-accent-600 sm:text-lg dark:text-accent-400">
              {profile.role}
              <span className="text-ink-400 dark:text-ink-500"> — </span>
              <span>{typed}</span>
              <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-accent-500 align-middle text-transparent select-none">
                |
              </span>
            </p>

            <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              {profile.pitch}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-900"
              >
                View portfolio
                <Icon name="arrow-up-right" className="size-4" />
              </a>
              {profile.resumeUrl && (
                <a
                  href={asset(profile.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-white/15 dark:text-ink-200 dark:hover:bg-white/5"
                >
                  <Icon name="download" className="size-4" />
                  Résumé
                </a>
              )}
              <div className="flex items-center gap-1 sm:ml-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid size-10 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Icon name={social.icon} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {profile.stats.length > 0 && (
          <dl
            className={`reveal is-visible mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 dark:border-white/10 dark:bg-white/10 ${statColumns}`}
          >
            {profile.stats.map((stat) => (
              <div key={stat.label} className="bg-white px-6 py-5 dark:bg-ink-950">
                <dt className="text-xs tracking-wide text-ink-500 uppercase dark:text-ink-400">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
