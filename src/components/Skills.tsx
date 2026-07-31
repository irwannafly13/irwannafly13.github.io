import { Icon } from './Icon'
import { Section } from './Section'
import { skills } from '../data/profile'

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="01 — Skills"
      title="What I work with"
      intro="The tools I reach for most often, grouped by where they sit in the stack."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group) => (
          <article
            key={group.title}
            className="card reveal p-5 transition-colors hover:border-accent-400/60 dark:hover:border-accent-400/40"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <Icon name={group.icon} />
              </span>
              <h3 className="text-base">{group.title}</h3>
            </div>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 font-mono text-xs text-ink-600 dark:border-white/10 dark:text-ink-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}
