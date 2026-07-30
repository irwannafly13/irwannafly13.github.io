import { profile } from '../data/profile'

export function Footer() {
  return (
    <footer className="border-t border-ink-200 py-8 dark:border-white/10">
      <div className="section-shell flex flex-col items-center justify-between gap-3 text-sm text-ink-400 sm:flex-row dark:text-ink-500">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </footer>
  )
}
