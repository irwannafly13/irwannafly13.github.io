import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Link } from './Link'
import { useActiveSection } from '../hooks/useActiveSection'
import { sections } from '../data/profile'
import type { Theme } from '../hooks/useTheme'

const sectionIds = sections.map((section) => section.id)

type Props = {
  theme: Theme
  onToggleTheme: () => void
  /** The profile page owns the section anchors; other routes link back to them. */
  onHome: boolean
  /** Highlights the blog button while any /blog route is open. */
  onBlog: boolean
}

export function Nav({ theme, onToggleTheme, onHome, onBlog }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const observed = useActiveSection(sectionIds, onHome)

  // Off the profile page there is no section under the header to track, and
  // the observer's fallback would light up the first link for no reason.
  const active = onHome ? observed : ''

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen
          ? 'border-b border-ink-200/80 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/85'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="section-shell flex h-16 items-center justify-between gap-4">
        <div className="hidden items-center gap-1 md:flex">
          {sections.map((section) => (
            <Link
              key={section.id}
              to={`/#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active === section.id
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              }`}
            >
              {section.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Sits after Contact and reads as a destination rather than an
              anchor, because it is one — the blog is its own page. */}
          <Link
            to="/blog"
            aria-current={onBlog ? 'page' : undefined}
            className={`mr-1 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              onBlog
                ? 'border-accent-400 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                : 'border-ink-200 text-ink-600 hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-ink-300 dark:hover:border-accent-400/60 dark:hover:text-accent-400'
            }`}
          >
            <Icon name="pen" className="size-4" />
            Blog
          </Link>

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
              <Link
                key={section.id}
                to={`/#${section.id}`}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active === section.id
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-ink-600 dark:text-ink-300'
                }`}
              >
                {section.label}
              </Link>
            ))}
            <Link
              to="/blog"
              onClick={() => setMenuOpen(false)}
              className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                onBlog
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-ink-600 dark:text-ink-300'
              }`}
            >
              <Icon name="pen" className="size-4" />
              Blog
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
