import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { markdown } from './plugins/markdown.ts'

// For a user site (<username>.github.io) the base is "/".
// For a project repo (github.com/<username>/<repo>) set BASE_PATH=/<repo>/
// The deploy workflow passes this in automatically.
const base = process.env.BASE_PATH ?? '/'

/**
 * GitHub Pages has no rewrite rules, so a direct hit on /blog/some-post asks it
 * for a file that was never built and it serves 404.html. Shipping a copy of
 * index.html under that name boots the app instead, and the router reads the
 * original path straight off location — Pages keeps the requested URL in the
 * address bar rather than redirecting. The response still carries a 404 status,
 * which crawlers notice but browsers do not.
 */
function pagesSpaFallback(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'pages-spa-fallback',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    closeBundle() {
      const outDir = resolve(config.root, config.build.outDir)
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [markdown(), react(), tailwindcss(), pagesSpaFallback()],
})
