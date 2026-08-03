import { useState } from 'react'
import { Icon } from './Icon'
import { Section } from './Section'
import { ProjectModal } from './ProjectModal'
import { asset } from '../lib/asset'
import { projects, projectCategories } from '../data/profile'
import type { Project } from '../data/profile'

const ALL = 'All'
const groups = [ALL, ...projectCategories]

/* Same treatment as the modal arrows, one size down. */
const arrow =
  'absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-ink-950/55 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:border-accent-400 hover:bg-accent-500 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none active:scale-95'

/**
 * Picture-first tile: the shot fills the card and everything else sits over it
 * on a translucent panel. Description is deliberately absent — it lives in the
 * modal behind "Read more".
 */
function ProjectCard({
  project,
  onOpen,
}: {
  project: Project
  onOpen: () => void
}) {
  const shots = project.docs ?? []
  const [index, setIndex] = useState(0)
  const pageable = shots.length > 1

  const step = (delta: number) =>
    setIndex((i) => (i + delta + shots.length) % shots.length)

  return (
    <article className="card reveal group relative aspect-[4/3] overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-400/60 dark:hover:border-accent-400/40">
      {shots.length > 0 ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${project.name}`}
          className="size-full cursor-pointer bg-ink-50 dark:bg-white/5"
        >
          {/* All shots stay mounted and stacked; paging just crossfades the
              opacity. Swapping one <img> src would flash white while the next
              file decoded. */}
          {shots.map((shot, i) => (
            <img
              key={shot}
              src={asset(shot)}
              alt=""
              loading="lazy"
              aria-hidden={i !== index}
              className={`absolute inset-0 size-full object-contain transition-opacity duration-500 ease-out ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </button>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-ink-50 text-center dark:bg-white/5">
          <Icon name="image" className="size-9 text-ink-300 dark:text-ink-600" />
          <p className="font-mono text-xs text-ink-400 dark:text-ink-600">No docs yet</p>
        </div>
      )}

      {pageable && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous image"
            className={`${arrow} left-3`}
          >
            <Icon name="chevron-left" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next image"
            className={`${arrow} right-3`}
          >
            <Icon name="chevron-right" className="size-4" />
          </button>
          <span className="absolute top-3 right-3 rounded-full bg-ink-950/60 px-2 py-0.5 font-mono text-xs text-white backdrop-blur-md">
            {index + 1} / {shots.length}
          </span>
        </>
      )}

      {/* 95% panel — nearly solid, so the title stays legible over any shot. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/95 p-4 backdrop-blur-md dark:bg-ink-950/95">
        <h3 className="text-base">
          {project.name}
          {project.featured && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent-500/10 px-2 py-0.5 align-middle text-[0.65rem] font-medium tracking-wide text-accent-600 uppercase dark:text-accent-400">
              <Icon name="pin" className="size-3" />
              Featured
            </span>
          )}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-xl border border-ink-200 px-3 py-1 text-sm font-medium text-ink-700 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-ink-200 dark:hover:border-accent-400 dark:hover:text-accent-400"
          >
            Read more
          </button>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-ink-200 px-3 py-1 text-sm font-medium text-ink-700 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-ink-200 dark:hover:border-accent-400 dark:hover:text-accent-400"
            >
              Visit website
            </a>
          )}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.name} source`}
              className="ml-auto text-ink-500 transition-colors hover:text-accent-600 dark:text-ink-400 dark:hover:text-accent-400"
            >
              <Icon name="github" className="size-5" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function Projects() {
  const [group, setGroup] = useState<string>(ALL)
  const [open, setOpen] = useState<Project | null>(null)

  // Featured cards first, original order preserved within each bucket.
  const ordered = [...projects]
    .filter((project) => group === ALL || project.category === group)
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))

  return (
    <Section
      id="projects"
      eyebrow="03 — Portfolio"
      title="Things I've built"
      intro="Side projects and work I can talk about publicly. Open one to read the detail and page through its documentation."
    >
      {/* Horizontal scroll rather than wrapping, so the row stays one line on
          a phone however many groups end up here. */}
      <div
        role="tablist"
        aria-label="Filter projects by group"
        className="scroll-slim -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {groups.map((name) => {
          const active = name === group
          const count =
            name === ALL
              ? projects.length
              : projects.filter((project) => project.category === name).length

          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setGroup(name)}
              className={`shrink-0 rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                  : 'border-ink-200 text-ink-600 hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-ink-300 dark:hover:border-accent-400 dark:hover:text-accent-400'
              }`}
            >
              {name}
              <span className="ml-2 font-mono text-xs opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {ordered.length === 0 && (
        <p className="card reveal p-8 text-center text-sm text-ink-500 dark:text-ink-400">
          Nothing in “{group}” yet. Set{' '}
          <code className="font-mono text-xs">category: '{group}'</code> on a
          project in profile.ts to file it here.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {ordered.map((project) => (
          <ProjectCard
            key={project.name}
            project={project}
            onOpen={() => setOpen(project)}
          />
        ))}
      </div>

      {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
    </Section>
  )
}
