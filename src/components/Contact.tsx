import { Icon } from './Icon'
import { profile, socials } from '../data/profile'

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal card relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl"
          />

          <div className="relative">
            <p className="mb-3 font-mono text-xs font-medium tracking-[0.2em] text-accent-600 uppercase dark:text-accent-400">
              05 — Contact
            </p>
            <h2 className="text-3xl sm:text-4xl">Let's build something</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed">
              Open to data platform work, consulting and interesting problems. The
              fastest way to reach me is email.
            </p>

            <a
              href={`mailto:${profile.email}`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-6 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-900"
            >
              <Icon name="mail" className="size-4" />
              {profile.email}
            </a>

            <div className="mt-8 flex items-center justify-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid size-10 place-items-center rounded-xl border border-ink-200 text-ink-500 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-white/10 dark:text-ink-400 dark:hover:text-accent-400"
                >
                  <Icon name={social.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
