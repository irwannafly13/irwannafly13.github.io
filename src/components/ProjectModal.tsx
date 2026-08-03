import { useCallback, useEffect, useId, useState } from 'react'
import { Icon } from './Icon'
import { asset } from '../lib/asset'
import type { Project } from '../data/profile'

/**
 * Full project detail over a dimmed backdrop, with the documentation shots in
 * a pager. Closes on Escape or a backdrop click; arrow keys move between shots.
 */
export function ProjectModal({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const shots = project.docs ?? []
  const [index, setIndex] = useState(0)
  const titleId = useId()
  const pageable = shots.length > 1

  const step = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + shots.length) % shots.length)
    },
    [shots.length],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (!pageable) return
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, step, pageable])

  // Stop the page behind the modal scrolling along with it.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  /* Bigger than the usual edge chevrons, floated clear of the image on a
     blurred disc, and they grow on hover — the reference site's arrows sit
     flat against the artwork and are easy to miss. */
  const arrow =
    'absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-ink-950/55 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:border-accent-400 hover:bg-accent-500 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-0'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900">
        <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4 dark:border-white/10">
          <h3 id={titleId} className="text-lg">
            {project.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon name="close" className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <ul className="mb-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-lg border border-ink-200 px-2 py-0.5 font-mono text-xs text-ink-500 dark:border-white/10 dark:text-ink-400"
              >
                {tag}
              </li>
            ))}
          </ul>

          <p className="text-sm leading-relaxed">{project.blurb}</p>

          <hr className="my-5 border-ink-200 dark:border-white/10" />

          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-ink-50 dark:bg-white/5">
            {shots.length > 0 ? (
              /* Stacked and crossfaded, same as the cards. */
              shots.map((shot, i) => (
                <img
                  key={shot}
                  src={asset(shot)}
                  alt={
                    i === index
                      ? `${project.name} documentation ${i + 1} of ${shots.length}`
                      : ''
                  }
                  aria-hidden={i !== index}
                  className={`absolute inset-0 size-full object-contain transition-opacity duration-500 ease-out ${
                    i === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Icon name="image" className="size-10 text-ink-300 dark:text-ink-600" />
                <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
                  No documentation yet
                </p>
                <p className="max-w-md font-mono text-xs text-ink-400 dark:text-ink-500">
                  Drop the files in public/projects/ and list them under docs on
                  this project in profile.ts
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!pageable}
              aria-label="Previous document"
              className={`${arrow} left-3`}
            >
              <Icon name="chevron-left" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={!pageable}
              aria-label="Next document"
              className={`${arrow} right-3`}
            >
              <Icon name="chevron-right" className="size-5" />
            </button>

            {pageable && (
              <span className="absolute top-3 right-3 rounded-full bg-ink-950/60 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-md">
                {index + 1} / {shots.length}
              </span>
            )}
          </div>

          {pageable && (
            <div className="mt-3 flex justify-center gap-2">
              {shots.map((shot, i) => (
                <button
                  key={shot}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to document ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? 'w-6 bg-accent-500'
                      : 'w-1.5 bg-ink-300 hover:bg-ink-400 dark:bg-ink-700 dark:hover:bg-ink-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-4 border-t border-ink-200 px-5 py-4 dark:border-white/10">
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent-600 dark:text-ink-200 dark:hover:text-accent-400"
            >
              <Icon name="github" className="size-4" />
              Source
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent-600 dark:text-ink-200 dark:hover:text-accent-400"
            >
              <Icon name="arrow-up-right" className="size-4" />
              Visit website
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-white/15 dark:text-ink-200 dark:hover:bg-white/5"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
