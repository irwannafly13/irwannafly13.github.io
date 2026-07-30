import type { ReactNode } from 'react'

type Props = {
  id: string
  eyebrow: string
  title: string
  intro?: string
  children: ReactNode
}

export function Section({ id, eyebrow, title, intro, children }: Props) {
  // Padding stacks between adjacent sections, so the visible gap is double this.
  return (
    <section id={id} className="scroll-mt-24 py-12 sm:py-16">
      <div className="section-shell">
        <header className="reveal mb-9 max-w-2xl">
          <p className="mb-3 font-mono text-xs font-medium tracking-[0.2em] text-accent-600 uppercase dark:text-accent-400">
            {eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-base leading-relaxed">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}
