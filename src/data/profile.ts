/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE — it is the only place your content lives.
 *  Every section of the site renders from the objects below.
 *  Nothing else needs to change to make the site yours.
 * ─────────────────────────────────────────────────────────────
 */

export type Social = {
  label: string
  href: string
  /** Icon key — see src/components/Icon.tsx for available keys. */
  icon: 'github' | 'linkedin' | 'mail' | 'x' | 'globe' | 'instagram'
}

export type SkillGroup = {
  title: string
  /** Icon key rendered next to the group title. */
  icon: 'database' | 'code' | 'cloud' | 'chart' | 'tools' | 'brain'
  items: string[]
}

export type Job = {
  role: string
  company: string
  location?: string
  /** Free text — e.g. "Jan 2023" */
  start: string
  /** Use "Present" for the current role. */
  end: string
  summary: string
  highlights: string[]
  stack: string[]
}

export type Project = {
  name: string
  blurb: string
  tags: string[]
  /** Optional links — omit any you don't have. */
  repo?: string
  demo?: string
  /** Optional image path, e.g. "/projects/pipeline.png" (put files in public/). */
  image?: string
  /** Pins the card to the top of the grid. */
  featured?: boolean
}

export type Education = {
  school: string
  credential: string
  period: string
  detail?: string
}

export type Certification = {
  name: string
  issuer: string
  year: string
  href?: string
}

/* ── Identity ─────────────────────────────────────────────── */

export const profile = {
  /** Used for the <title>, meta tags and the footer. */
  name: 'Your Name',
  /** One line under your name in the hero. */
  role: 'Your Role',
  /** Rotating words in the hero headline. */
  taglines: [
    'placeholder tagline one',
    'placeholder tagline two',
    'placeholder tagline three',
  ],
  location: 'City, Country',
  /** Short pitch — hero paragraph. Keep it to 2–3 sentences. */
  pitch:
    'Placeholder pitch. Two or three sentences on what you do and what you care about — this is the first thing a visitor reads, so make it specific rather than generic.',
  /** Longer story — About section. Each string is a paragraph. */
  about: [
    'Placeholder paragraph one. Describe the work you actually do day to day: the problems you pick up, the kind of systems you build, and what you optimise for.',
    'Placeholder paragraph two. Useful for background — where you came from before this role, and how that still shapes the way you work.',
    'Placeholder paragraph three. Optional: interests outside work, what you are learning, or what you would like to be hired to do next.',
  ],
  /**
   * Small facts shown as a strip under the hero. 3 is the sweet spot; 1–4 all
   * lay out correctly. Delete the whole array to hide the strip.
   */
  stats: [
    { value: '00+', label: 'Stat one' },
    { value: '00+', label: 'Stat two' },
    { value: '00+', label: 'Stat three' },
  ],
  /**
   * Drop your CV at public/resume.pdf and change this to '/resume.pdf' to show
   * the résumé button. null hides it.
   */
  resumeUrl: null as string | null,
  /**
   * Your photo. Save it as public/avatar.jpg (square, 500x500 or larger) and
   * change this to '/avatar.jpg'. null falls back to your initials.
   */
  avatarUrl: null as string | null,
  email: 'you@example.com',
}

export const socials: Social[] = [
  // This one is real — it's your account.
  { label: 'GitHub', href: 'https://github.com/irwannafly13', icon: 'github' },
  { label: 'Email', href: `mailto:${profile.email}`, icon: 'mail' },
  // Add your real profile URL and uncomment:
  // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/...', icon: 'linkedin' },
]

/* ── Skills ───────────────────────────────────────────────── */

/**
 * Group titles and icons are yours to change; the items are placeholders.
 * Delete a whole group to drop it from the grid.
 */
export const skills: SkillGroup[] = [
  {
    title: 'Skill Group One',
    icon: 'database',
    items: ['Skill', 'Skill', 'Skill', 'Skill', 'Skill'],
  },
  {
    title: 'Languages',
    icon: 'code',
    items: ['Skill', 'Skill', 'Skill', 'Skill'],
  },
  {
    title: 'Skill Group Three',
    icon: 'chart',
    items: ['Skill', 'Skill', 'Skill', 'Skill'],
  },
  {
    title: 'Cloud & Platform',
    icon: 'cloud',
    items: ['Skill', 'Skill', 'Skill', 'Skill'],
  },
  {
    title: 'Tooling',
    icon: 'tools',
    items: ['Skill', 'Skill', 'Skill', 'Skill'],
  },
  {
    title: 'Ways of Working',
    icon: 'brain',
    items: ['Skill', 'Skill', 'Skill', 'Skill'],
  },
]

/* ── Experience ───────────────────────────────────────────── */

export const experience: Job[] = [
  {
    role: 'Job Title',
    company: 'Company Name',
    location: 'City, Country',
    start: 'YYYY',
    end: 'Present',
    summary:
      'One-line summary of what you owned in this role — the scope, not the task list.',
    highlights: [
      'Placeholder achievement. Lead with the outcome, then how you got there.',
      'Placeholder achievement. Put a number on it wherever you honestly can.',
      'Placeholder achievement. Three or four per role is plenty.',
    ],
    stack: ['Tool', 'Tool', 'Tool', 'Tool'],
  },
  {
    role: 'Previous Job Title',
    company: 'Previous Company Name',
    location: 'City, Country',
    start: 'YYYY',
    end: 'YYYY',
    summary: 'One-line summary of this earlier role.',
    highlights: [
      'Placeholder achievement.',
      'Placeholder achievement.',
    ],
    stack: ['Tool', 'Tool', 'Tool'],
  },
]

export const education: Education[] = [
  {
    school: 'University Name',
    credential: 'Degree, Field of Study',
    period: 'YYYY — YYYY',
    detail: 'Optional line — focus area, thesis, or honours.',
  },
]

export const certifications: Certification[] = [
  {
    name: 'Certification Name',
    issuer: 'Issuing Body',
    year: 'YYYY',
    // Add the credential URL to make the card clickable.
    href: undefined,
  },
]

/* ── Portfolio ────────────────────────────────────────────── */

export const projects: Project[] = [
  {
    name: 'Featured Project',
    blurb:
      'Placeholder description. What the project does, who it is for, and the one interesting technical decision behind it. The featured card spans the full width.',
    tags: ['Tag', 'Tag', 'Tag'],
    // repo: 'https://github.com/irwannafly13/repo-name',
    // demo: 'https://example.com',
    featured: true,
  },
  {
    name: 'Project Two',
    blurb: 'Placeholder description. Two sentences is usually enough.',
    tags: ['Tag', 'Tag'],
    // repo: 'https://github.com/irwannafly13/repo-name',
  },
  {
    name: 'Project Three',
    blurb: 'Placeholder description.',
    tags: ['Tag', 'Tag'],
    // repo: 'https://github.com/irwannafly13/repo-name',
  },
  {
    name: 'This Website',
    blurb:
      'A static React site that builds from one TypeScript data file and deploys itself to GitHub Pages on every push.',
    tags: ['React', 'TypeScript', 'Tailwind', 'GitHub Actions'],
    repo: 'https://github.com/irwannafly13/irwannafly13.github.io',
  },
]

/* ── Navigation ───────────────────────────────────────────── */

export const sections = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
] as const
