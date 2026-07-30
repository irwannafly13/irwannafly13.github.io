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
  name: 'Irwan Sinaga',
  /** One line under your name in the hero. */
  role: 'Data Engineer',
  /** Rotating words in the hero headline. */
  taglines: [
    'building reliable data pipelines',
    'designing lakehouse architectures',
    'turning raw events into decisions',
  ],
  location: 'Jakarta, Indonesia',
  /** Short pitch — hero paragraph. Keep it to 2–3 sentences. */
  pitch:
    'I design and operate the data platforms that finance teams bet on — batch and streaming pipelines, lakehouse storage, and the modelling layer that makes all of it queryable. I care about correctness, cost, and pipelines that page nobody at 3am.',
  /** Longer story — About section. Each string is a paragraph. */
  about: [
    "I'm a data engineer working in financial services, where the data has to be right the first time. Most of my day is spent on ingestion, transformation and the unglamorous reliability work that keeps a platform trustworthy: schema contracts, idempotent loads, backfills that don't corrupt history.",
    'Before specialising in data I worked closer to application development, which still shapes how I build — versioned code, tests, code review and CI for pipelines, not just for services.',
    "Outside of work I read about distributed systems, tinker with self-hosted tooling, and slowly grow the list of side projects below.",
  ],
  /** Small facts shown as a strip under the hero. Keep to 3–4. */
  stats: [
    { value: '5+', label: 'Years in data' },
    { value: '20+', label: 'Pipelines in production' },
    { value: 'PB-scale', label: 'Lakehouse managed' },
  ],
  /**
   * Drop your CV at public/resume.pdf and change this to '/resume.pdf' to show
   * the résumé button. null hides it.
   */
  resumeUrl: null as string | null,
  /** Path inside public/ — set to null to fall back to your initials. */
  avatarUrl: null as string | null,
  email: 'irwan.sinaga@bfi.co.id',
}

export const socials: Social[] = [
  { label: 'GitHub', href: 'https://github.com/irwannafly13', icon: 'github' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/irwan-sinaga',
    icon: 'linkedin',
  },
  { label: 'Email', href: `mailto:${profile.email}`, icon: 'mail' },
]

/* ── Skills ───────────────────────────────────────────────── */

export const skills: SkillGroup[] = [
  {
    title: 'Data Engineering',
    icon: 'database',
    items: [
      'Apache Spark',
      'Apache Airflow',
      'dbt',
      'Kafka',
      'Delta Lake / Iceberg',
      'Change Data Capture',
    ],
  },
  {
    title: 'Languages',
    icon: 'code',
    items: ['Python', 'SQL', 'Scala', 'Bash', 'TypeScript'],
  },
  {
    title: 'Storage & Warehouse',
    icon: 'chart',
    items: ['BigQuery', 'PostgreSQL', 'Oracle', 'ClickHouse', 'Redis'],
  },
  {
    title: 'Cloud & Platform',
    icon: 'cloud',
    items: ['Google Cloud', 'AWS', 'Docker', 'Kubernetes', 'Terraform'],
  },
  {
    title: 'Tooling',
    icon: 'tools',
    items: ['Git', 'GitHub Actions', 'Grafana', 'Great Expectations', 'Linux'],
  },
  {
    title: 'Ways of Working',
    icon: 'brain',
    items: [
      'Data modelling',
      'Cost optimisation',
      'Incident response',
      'Mentoring',
      'Stakeholder comms',
    ],
  },
]

/* ── Experience ───────────────────────────────────────────── */

export const experience: Job[] = [
  {
    role: 'Data Engineer',
    company: 'BFI Finance',
    location: 'Jakarta, Indonesia',
    start: '2023',
    end: 'Present',
    summary:
      'Own the ingestion and transformation layer of the analytics platform serving risk, collections and finance.',
    highlights: [
      'Migrated batch ETL onto a lakehouse architecture, cutting daily processing time roughly in half.',
      'Built CDC pipelines from core banking systems into the warehouse with sub-hour freshness.',
      'Introduced automated data-quality checks that catch schema drift before it reaches dashboards.',
    ],
    stack: ['Spark', 'Airflow', 'dbt', 'Kafka', 'Python', 'SQL'],
  },
  {
    role: 'Data Analyst',
    company: 'Previous Company',
    location: 'Jakarta, Indonesia',
    start: '2020',
    end: '2023',
    summary:
      'Built reporting and self-service models for commercial and operations teams.',
    highlights: [
      'Consolidated fragmented spreadsheets into a single governed reporting layer.',
      'Automated recurring manual reports, freeing several analyst-days per month.',
    ],
    stack: ['SQL', 'Python', 'Power BI', 'PostgreSQL'],
  },
]

export const education: Education[] = [
  {
    school: 'Your University',
    credential: 'B.Sc. in Computer Science',
    period: '2016 — 2020',
    detail: 'Focus on databases and distributed systems.',
  },
]

export const certifications: Certification[] = [
  {
    name: 'Professional Data Engineer',
    issuer: 'Google Cloud',
    year: '2024',
    href: undefined,
  },
]

/* ── Portfolio ────────────────────────────────────────────── */

export const projects: Project[] = [
  {
    name: 'Lakehouse Starter',
    blurb:
      'Opinionated template for a Spark + Iceberg lakehouse: medallion layout, dbt models, and Airflow DAGs wired together with a single make target.',
    tags: ['Spark', 'Iceberg', 'dbt', 'Airflow'],
    repo: 'https://github.com/irwannafly13',
    featured: true,
  },
  {
    name: 'Streaming CDC Demo',
    blurb:
      'End-to-end change-data-capture playground — Debezium into Kafka into a warehouse, with exactly-once semantics and a replay story.',
    tags: ['Kafka', 'Debezium', 'Python'],
    repo: 'https://github.com/irwannafly13',
  },
  {
    name: 'Data Quality Toolkit',
    blurb:
      'Lightweight expectation framework that runs inside existing pipelines and posts failures straight to Slack instead of a dashboard nobody opens.',
    tags: ['Python', 'Great Expectations', 'Slack API'],
    repo: 'https://github.com/irwannafly13',
  },
  {
    name: 'This Website',
    blurb:
      'A static React site that builds from one TypeScript data file and deploys itself to GitHub Pages on every push.',
    tags: ['React', 'TypeScript', 'Tailwind', 'GitHub Actions'],
    repo: 'https://github.com/irwannafly13',
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
