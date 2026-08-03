import { useId, useState } from 'react'
import { Icon } from './Icon'
import { Section } from './Section'
import { skills } from '../data/profile'
import type { SkillGroup } from '../data/profile'

/** One group. Collapsed on load; the title row is the toggle. */
function SkillCard({ group }: { group: SkillGroup }) {
  const [open, setOpen] = useState(false)
  const panelId = `${useId()}-items`

  return (
    <article className="card reveal transition-colors hover:border-accent-400/60 dark:hover:border-accent-400/40">
      <h3 className="text-base">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 rounded-2xl p-5 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
            <Icon name={group.icon} />
          </span>
          <span className="flex-1">{group.title}</span>
          <Icon
            name="chevron-down"
            className={`size-4 shrink-0 text-ink-400 transition-transform dark:text-ink-500 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </h3>

      {/* Hidden rather than unmounted, so in-page search still finds the tags.
          The open panel is a fixed height and scrolls, which keeps every card
          the same size no matter how uneven the groups are. */}
      <div
        id={panelId}
        hidden={!open}
        className="scroll-slim h-44 overflow-y-auto px-5 pb-5"
      >
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
      </div>
    </article>
  )
}

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="01 — Skills"
      title="What I work with"
      intro="The tools I reach for most often, grouped by where they sit in the stack. Open a group to see the list."
    >
      {/* items-start so a collapsed card doesn't stretch to match an open
          neighbour in the same row. */}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group) => (
          <SkillCard key={group.title} group={group} />
        ))}
      </div>
    </Section>
  )
}
