import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Skills } from './components/Skills'
import { Experience } from './components/Experience'
import { Projects } from './components/Projects'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { BlogIndex } from './components/BlogIndex'
import { BlogPost } from './components/BlogPost'
import { NotFound } from './components/NotFound'
import { getPost } from './data/blog'
import { useReveal } from './hooks/useReveal'
import { useRoute } from './hooks/useRoute'
import { useTheme } from './hooks/useTheme'
import { useDocumentTitle } from './hooks/useDocumentTitle'

/** The tab title per route. Undefined keeps the one set in index.html. */
function titleFor(route: ReturnType<typeof useRoute>): string | undefined {
  switch (route.name) {
    case 'blog':
      return 'Blog'
    case 'post':
      return getPost(route.slug)?.title ?? 'Blog'
    case 'notFound':
      return 'Not found'
    default:
      return undefined
  }
}

export default function App() {
  const { theme, toggle } = useTheme()
  const route = useRoute()
  useReveal()
  useDocumentTitle(titleFor(route))

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-white dark:focus:text-ink-900"
      >
        Skip to content
      </a>

      <Nav
        theme={theme}
        onToggleTheme={toggle}
        onHome={route.name === 'home'}
        onBlog={route.name === 'blog' || route.name === 'post'}
      />

      <main id="main">
        {route.name === 'home' && (
          <>
            <Hero />
            <Skills />
            <Experience />
            <Projects />
            <Contact />
          </>
        )}
        {route.name === 'blog' && <BlogIndex />}
        {route.name === 'post' && <BlogPost slug={route.slug} />}
        {route.name === 'notFound' && <NotFound path={route.path} />}
      </main>

      <Footer />
    </>
  )
}
