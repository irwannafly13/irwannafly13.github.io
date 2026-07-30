# Personal Profile Site

A single-page personal site — about, skills, experience and portfolio — built with
Vite + React + TypeScript + Tailwind CSS v4 and deployed to GitHub Pages by a
GitHub Actions workflow.

Dark/light theme with no flash on load, scroll-spy navigation, scroll-reveal
animations, and full mobile support.

## Editing your content

**Everything you'd want to change lives in [`src/data/profile.ts`](src/data/profile.ts).**
No component edits needed — name, pitch, stats, skills, jobs, education,
certifications and projects all render from that one file.

Two things live outside it:

- `index.html` — the `<title>` and the description / Open Graph meta tags.
- `public/` — your résumé (`resume.pdf`), avatar, and project screenshots.

To show the résumé button, put your CV at `public/resume.pdf` and set
`resumeUrl: '/resume.pdf'` in `profile.ts`. Same idea for `avatarUrl` — drop an
image in `public/` and point at it, otherwise your initials are shown.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the built site
npm run lint
```

## Deploying to GitHub Pages

### 1. Create the repository

For a site at `https://<username>.github.io`, the repo **must** be named
`<username>.github.io` and be public:

```bash
gh auth login
gh repo create <username>.github.io --public --source=. --remote=origin
```

Any other repo name also works — the site is then served from
`https://<username>.github.io/<repo>/`, and the workflow sets Vite's `base`
accordingly on its own.

### 2. Push

```bash
git init -b main
git add -A
git commit -m "Initial profile site"
git push -u origin main
```

### 3. Turn on Pages

In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

That's it. Every push to `main` rebuilds and redeploys via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml); the first run
takes a couple of minutes.

### Custom domain

Add a `public/CNAME` file containing just your domain (e.g. `irwansinaga.com`),
point a DNS `CNAME` record at `<username>.github.io`, then set the domain under
Settings → Pages.

## Note on the GitHub profile README

This site is separate from the README that shows on your GitHub profile page.
For that, create a repo named exactly `<username>` (same as your username) with
a `README.md` in it, and link it here.
