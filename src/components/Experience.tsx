import { useState } from 'react'
import { Section } from './Section'
import { asset } from '../lib/asset'
import { experience } from '../data/profile'
import type { Job } from '../data/profile'

/**
 * Square logo tile, LinkedIn-style. The white plate is kept in both themes
 * because company marks are almost always drawn for a light background.
 * Falls back to the company initial when there is no logo, or when the file
 * is missing — so a not-yet-added logo degrades to a letter instead of a
 * broken-image icon.
 */
function CompanyLogo({ job }: { job: Job }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-white/15">
      {job.logo && !failed ? (
        <img
          src={asset(job.logo)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-contain"
        />
      ) : (
        <span className="text-xl font-semibold text-ink-400">
          {job.company.charAt(0)}
        </span>
      )}
    </div>
  )
}

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="03 — Experience"
      title="Where I've worked"
      intro="Roles in reverse-chronological order, with the work I'm proudest of in each."
    >
      <ol className="relative space-y-10 border-l border-ink-200 pl-8 dark:border-white/10">
        {experience.map((job) => (
          <li key={`${job.company}-${job.start}`} className="reveal relative">
            {/* Sits level with the middle of the logo tile. */}
            <span
              aria-hidden
              className={`absolute top-[1.375rem] -left-[2.15rem] size-3 rounded-full ring-4 ring-white dark:ring-ink-950 ${
                job.end === 'Present' ? 'bg-accent-500' : 'bg-ink-300 dark:bg-ink-600'
              }`}
            />

            <div className="flex gap-4">
              <CompanyLogo job={job} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg">
                    {job.role}
                    <span className="text-accent-600 dark:text-accent-400">
                      {' '}
                      @ {job.company}
                    </span>
                  </h3>
                  <p className="font-mono text-xs text-ink-400 dark:text-ink-500">
                    {job.start} — {job.end}
                  </p>
                </div>

                {job.location && (
                  <p className="mt-1 text-sm text-ink-400 dark:text-ink-500">
                    {job.location}
                  </p>
                )}

                <p className="mt-3 text-base leading-relaxed">{job.summary}</p>

                <ul className="mt-4 space-y-2">
                  {job.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-sm leading-relaxed">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-500/70"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {job.stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
