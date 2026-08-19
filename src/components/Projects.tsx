import { useId, useState } from 'react'
import { Icon } from './Icon'
import { Section } from './Section'
import { ProjectModal } from './ProjectModal'
import { asset } from '../lib/asset'
import { projects, projectCategories } from '../data/profile'
import type { IconName } from './Icon'
import type { Project } from '../data/profile'

/** Anything whose category isn't one of the known groups lands here. */
const OTHER = 'Other'

/** Falls back to the generic icon for any category added later. */
const GROUP_ICONS: Record<string, IconName> = {
  'Data Platform': 'database',
  'Analytics & BI': 'chart',
  'AI & Machine Learning': 'brain',
  'Self Managed Services': 'tools',
  'Open Source': 'github',
  'Learning & Enablement': 'book',
}

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
    /* Fixed height, not an aspect ratio: every card is identical whatever the
       shot's dimensions are, and it no longer changes with column width. */
    /* No .reveal here: the card mounts inside a collapsed panel, so it would
       sit at opacity 0 until it happened to cross the viewport again. The
       group card around it does the fade in instead. */
    <article className="card group relative h-80 overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-400/60 dark:hover:border-accent-400/40">
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
              className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-500 ease-out ${
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

      {/* 90% panel — the shot shows through a little, and the blur keeps the
          title legible over whatever is behind it. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/90 p-4 backdrop-blur-md dark:bg-ink-950/90">
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

        {project.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-lg border border-ink-200 px-2 py-0.5 font-mono text-[0.7rem] text-ink-500 dark:border-white/10 dark:text-ink-400"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null)
  /* One group at a time: picking another closes whatever was open, so the
     cards below always belong to exactly one button. Clicking the open one
     again closes it. */
  const [expanded, setExpanded] = useState<string | null>(null)
  const baseId = useId()
  const panelId = (name: string) => `${baseId}-${name.replace(/\W+/g, '-')}`

  const toggle = (name: string) =>
    setExpanded((current) => (current === name ? null : name))

  // Featured cards first, original order preserved within each bucket.
  const bucket = (name: string) =>
    [...projects]
      .filter((project) =>
        name === OTHER
          ? !projectCategories.includes(project.category as never)
          : project.category === name,
      )
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))

  /* Only shown when something actually falls outside the known categories —
     without it, a project with a typo'd category would silently vanish. */
  const groups = [...projectCategories, ...(bucket(OTHER).length > 0 ? [OTHER] : [])]

  return (
    <Section
      id="projects"
      eyebrow="03 — Portfolio"
      title="Things I've built"
    >
      {/* All the group buttons sit in one row at the top; opening one drops its
          cards into the area underneath rather than pushing the other buttons
          down the page. */}
      <div className="reveal mb-6 flex flex-wrap gap-2">
        {groups.map((name) => {
          const isOpen = expanded === name

          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              aria-expanded={isOpen}
              aria-controls={panelId(name)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                isOpen
                  ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                  : 'border-ink-200 text-ink-600 hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-ink-300 dark:hover:border-accent-400 dark:hover:text-accent-400'
              }`}
            >
              <Icon name={GROUP_ICONS[name] ?? 'image'} className="size-4" />
              {name}
              <span className="font-mono text-xs opacity-60">
                {bucket(name).length}
              </span>
              <Icon
                name="chevron-down"
                className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )
        })}
      </div>

      {expanded === null ? (
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Pick a group above to see the projects in it.
        </p>
      ) : (
        <div id={panelId(expanded)}>
          <h3 className="mb-3 flex items-center gap-2 text-sm tracking-wide text-ink-500 uppercase dark:text-ink-400">
            <Icon name={GROUP_ICONS[expanded] ?? 'image'} className="size-4" />
            {expanded}
          </h3>
          {bucket(expanded).length === 0 ? (
            <p className="card p-8 text-center text-sm text-ink-500 dark:text-ink-400">
              Nothing in this group yet. Set{' '}
              <code className="font-mono text-xs">category: '{expanded}'</code>{' '}
              on a project in profile.ts to file it here.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {bucket(expanded).map((project) => (
                <ProjectCard
                  key={project.name}
                  project={project}
                  onOpen={() => setOpen(project)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
    </Section>
  )
}
