import { Icon } from './Icon'
import { Section } from './Section'
import { asset } from '../lib/asset'
import { projects } from '../data/profile'

export function Projects() {
  // Featured cards first, original order preserved within each bucket.
  const ordered = [...projects].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  )

  return (
    <Section
      id="projects"
      eyebrow="03 — Portfolio"
      title="Things I've built"
      intro="Side projects and work I can talk about publicly."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {ordered.map((project) => (
          <article
            key={project.name}
            className={`card reveal group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-400/60 dark:hover:border-accent-400/40 ${
              project.featured ? 'sm:col-span-2' : ''
            }`}
          >
            {project.image && (
              <img
                src={asset(project.image)}
                alt=""
                loading="lazy"
                className="aspect-[16/7] w-full border-b border-ink-200 object-cover dark:border-white/10"
              />
            )}

            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-base">
                  {project.name}
                  {project.featured && (
                    <span className="ml-2 inline-flex items-center gap-1 align-middle rounded-md bg-accent-500/10 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-accent-600 uppercase dark:text-accent-400">
                      <Icon name="pin" className="size-3" />
                      Featured
                    </span>
                  )}
                </h3>
              </div>

              <p className="text-sm leading-relaxed">{project.blurb}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-lg border border-ink-200 px-2 py-0.5 font-mono text-xs text-ink-500 dark:border-white/10 dark:text-ink-400"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-4 pt-1">
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
                    Live demo
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
