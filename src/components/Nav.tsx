import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { useActiveSection } from '../hooks/useActiveSection'
import { profile, sections } from '../data/profile'
import type { Theme } from '../hooks/useTheme'

const sectionIds = sections.map((section) => section.id)

type Props = {
  theme: Theme
  onToggleTheme: () => void
}

export function Nav({ theme, onToggleTheme }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection(sectionIds)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Don't leave the mobile sheet open behind a resize to desktop.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setMenuOpen(false)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen
          ? 'border-b border-ink-200/80 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/85'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="section-shell flex h-16 items-center justify-between gap-4">
        <a
          href="#top"
          className="flex items-center gap-2.5 font-semibold text-ink-900 dark:text-white"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-accent-500 to-accent-700 font-mono text-xs text-white">
            {initials}
          </span>
          <span className="hidden text-sm sm:inline">{profile.name}</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active === section.id
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              }`}
            >
              {section.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 md:hidden dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="section-shell pb-4 md:hidden">
          <div className="flex flex-col">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active === section.id
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-ink-600 dark:text-ink-300'
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
