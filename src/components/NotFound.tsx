import { Icon } from './Icon'
import { Link } from './Link'

type Props = {
  path: string
}

export function NotFound({ path }: Props) {
  return (
    <div className="pt-32 pb-24">
      <div className="section-shell max-w-xl text-center">
        <p className="font-mono text-xs font-medium tracking-[0.2em] text-accent-600 uppercase dark:text-accent-400">
          404
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Nothing at this address</h1>
        <p className="mt-4 text-base leading-relaxed">
          <code className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-sm dark:bg-white/10">
            {path}
          </code>{' '}
          does not match any page on this site.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-900"
          >
            <Icon name="arrow-left" className="size-4" />
            Back to the profile
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-white/15 dark:text-ink-200 dark:hover:bg-white/5"
          >
            <Icon name="pen" className="size-4" />
            Read the blog
          </Link>
        </div>
      </div>
    </div>
  )
}
