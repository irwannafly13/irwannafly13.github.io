/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE. it is the only place your content lives.
 *  Every section of the site renders from the objects below.
 *  Nothing else needs to change to make the site yours.
 * ─────────────────────────────────────────────────────────────
 */

export type Social = {
  label: string
  href: string
  /** Icon key. see src/components/Icon.tsx for available keys. */
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
  /**
   * Square company logo, from public/logos/ — e.g. "/logos/ibm.png".
   * .png with a transparent background looks best; .jpg works too.
   * Falls back to the company's first letter if the file is missing.
   */
  logo?: string
  /** Free text. e.g. "Jan 2023" */
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
  /** Optional links. omit any you don't have. */
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
  role: 'Data & Cloud Engineer',
  /** Rotating words in the hero headline. */
  taglines: [
    'Data Engineering',
    'Cloud Architecture',
    'Machine Learning',
    'Business Intelligence',
  ],
  location: 'Jakarta, Indonesia',
  /** Short pitch. hero paragraph. Keep it to 2–3 sentences. */
  pitch:
    'I build the pipelines and cloud platforms that move enterprise data from where it lands to where decisions get made. Nine years across oil and gas, government, telecommunications and finance. as a technical consultant, data engineer and data scientist. delivering systems that go live and stay live.',
  /** Longer story. About section. Each string is a paragraph. */
  about: [
    'I work at the point where data engineering meets cloud architecture. Most of my days are spent designing integration layers. pulling from DB2, SQL Server, PostgreSQL, Oracle and MySQL through DataStage, SSIS, Talend and Azure Data Factory. and making sure what comes out the other end is something an analyst or a model can actually trust.',
    'Since 2019 I have worked as a Technical Consultant at IBM Indonesia, which means I am usually embedded with a client rather than sitting behind a product. That has taken me through an oil and gas major, the Indonesian Ministry of Health, a national telecommunications operator and a finance company. The problems change, but the pattern rarely does: an on-premises estate that has outgrown itself, and a migration path to the cloud that has to happen without the reporting going dark.',
    'I trained as a statistician at Universitas Padjadjaran, and it still shapes how I approach a problem. I would rather understand the distribution of the data than the shape of the pipeline first. That background is also where the machine learning work comes from: forecasting, interpolating missing signal, and building models that feed dashboards instead of sitting in a notebook.',
  ],
  /** Small facts shown as a strip under the hero. Keep to 3–4. */
  stats: [
    { value: '9+', label: 'Years in data & cloud' },
    { value: '20+', label: 'Apps Deployed' },
    { value: '40+', label: 'Dashboards shipped' },
    { value: '10+', label: 'IBM certifications' },
  ],
  /**
   * Drop your CV at public/resume.pdf and change this to '/resume.pdf' to show
   * the résumé button. null hides it.
   *
   * NOTE: left off deliberately. public/resume.pdf carries a home address and
   * a personal phone number, and this site is public and indexable. Point this
   * at a redacted copy before switching it on.
   */
  resumeUrl: null as string | null,
  /**
   * Your photo, from public/. Rendered as a circle at 224px (448px on retina),
   * so square and 500x500 or larger is ideal. null falls back to your initials.
   */
  avatarUrl: '/avatar.png' as string | null,
  email: 'irwan.sinaga@hotmail.com',
}

export const socials: Social[] = [
  // This one is real. it's your account.
  { label: 'GitHub', href: 'https://github.com/irwannafly13', icon: 'github' },
  { label: 'Email', href: `mailto:${profile.email}`, icon: 'mail' },
  // Add your real profile URL and uncomment:
  // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/...', icon: 'linkedin' },
]

/* ── Skills ───────────────────────────────────────────────── */

/**
 * Group titles and icons are yours to change.
 * Delete a whole group to drop it from the grid.
 */
export const skills: SkillGroup[] = [
  {
    title: 'Data Engineering',
    icon: 'database',
    items: [
      'IBM DataStage',
      'SSIS',
      'Talend',
      'Azure Data Factory',
      'Stored Procedures',
      'Shell Scripting',
      'ETL / ELT design',
    ],
  },
  {
    title: 'Databases',
    icon: 'tools',
    items: [
      'IBM DB2',
      'SQL Server',
      'PostgreSQL',
      'Oracle',
      'MySQL',
      'Azure SQL Database',
      'Hive / HDFS',
    ],
  },
  {
    title: 'Cloud & Platform',
    icon: 'cloud',
    items: [
      'Azure Data Lake',
      'Azure Synapse Analytics',
      'Azure Data Factory',
      'Azure Logic Apps',
      'Azure Blob Storage',
      'ExpressRoute / Private Link',
    ],
  },
  {
    title: 'Business Intelligence',
    icon: 'chart',
    items: [
      'Power BI Pro',
      'Power BI Report Server',
      'Tableau',
      'SSAS Tabular',
      'Power Query',
      'DAX',
    ],
  },
  {
    title: 'Languages',
    icon: 'code',
    items: ['SQL', 'Python', 'R', 'Bash'],
  },
  {
    title: 'Data Science & ML',
    icon: 'brain',
    items: [
      'Forecasting',
      'Interpolation & imputation',
      'Anomaly detection',
      'Azure ML Studio',
      'R-Studio',
      'Statistical modelling',
    ],
  },
]

/* ── Experience ───────────────────────────────────────────── */

export const experience: Job[] = [
  {
    role: 'Technical Consultant',
    company: 'IBM Indonesia',
    logo: '/logos/ibm.png',
    location: 'Jakarta, Indonesia',
    start: 'Oct 2019',
    end: 'Present',
    summary:
      'Embedded with IBM clients across oil and gas, government, telecommunications and finance. owning data integration architecture, the migration path to Azure, and the reporting layer that sits on top of it.',
    highlights: [
      'Designed and delivered a new integration architecture that cut ETL run time from an on-premises data lake into Azure Data Lake for an oil and gas major, spanning SSIS, SQL Server, Azure Synapse, Azure Data Factory and cloud-based SSAS.',
      'Built and maintained an API that lets on-premises SSIS jobs trigger Azure Data Factory pipelines, then hardened the connection with ExpressRoute and Azure Private Link so the call never crossed the public internet.',
      'Developed the Corporate Command Center dashboard for Indonesia’s Covid-19 response with the Ministry of Health, transforming data in DB2 via stored procedures and DataStage and surfacing it in Tableau.',
      'Shipped Procurement, Domestic Gas, Human Resource, Risk Matrix and Project Progress dashboards end to end in Power BI Pro and Report Server, modelling in SSAS Tabular with Power Query and DAX.',
      'Migrated and integrated data warehouse and data lake layers for a finance client, rebuilding ETL in stored procedures, functions and shell scripts across DB2, PostgreSQL and flat-file sources into a new database environment.',
      'Reduced data availability time on automated jobs for a telecommunications operator by tuning DataStage, Talend, Hive, HDFS and shell-script workloads.',
      'Built unstructured-data ingestion with Azure Logic Apps. capturing blob metadata for images, video, PDFs and documents, then triggering Azure Data Factory to land it in Azure SQL Database.',
    ],
    stack: [
      'Azure Data Factory',
      'Azure Synapse',
      'Azure Data Lake',
      'Azure Logic Apps',
      'SSIS',
      'SSAS',
      'IBM DataStage',
      'Talend',
      'DB2',
      'Power BI',
      'Tableau',
      'Hive / HDFS',
    ],
  },
  {
    role: 'Data Scientist',
    company: 'Neural Technologies Indonesia',
    logo: '/logos/neural-technologies.png',
    location: 'Jakarta, Indonesia',
    start: 'Jan 2019',
    end: 'Oct 2019',
    summary:
      'Owned the automated modelling layer behind a telecommunications client’s corporate dashboard.',
    highlights: [
      'Built and maintained an automated model that interpolates noise in hourly, daily, weekly and monthly data, closing the gaps left by late-arriving records.',
      'Produced a new scoring table consumed directly by the corporate dashboard, built on R-Studio against SQL Server and PostgreSQL.',
    ],
    stack: ['R-Studio', 'SQL Server', 'PostgreSQL', 'Machine Learning'],
  },
  {
    role: 'Database Developer',
    company: 'Tarsus Indonesia (Infrastructure Asia)',
    logo: '/logos/tarsus.png',
    location: 'Jakarta, Indonesia',
    start: 'May 2017',
    end: 'Jan 2019',
    summary:
      'Ran the CRM data layer for an events business, and the people who fed it.',
    highlights: [
      'Developed and maintained the ACT CRM database on MySQL and the Infosalon RDBMS.',
      'Supervised telemarketing staff on new sales data validation, keeping the record set clean at the point of entry.',
      'Delivered visitor and exhibitor summary data that the marketing division planned against.',
    ],
    stack: ['MySQL', 'ACT CRM', 'Infosalon'],
  },
]

export const education: Education[] = [
  {
    school: 'Universitas Padjadjaran',
    credential: 'Bachelor’s Degree, Statistics',
    period: '2012. 2016',
  },
]

export const certifications: Certification[] = [
  { name: 'IBM Big Data 101', issuer: 'IBM', year: '2021' },
  { name: 'IBM DataOps', issuer: 'IBM', year: '2021' },
  { name: 'Microsoft PowerBI', issuer: 'IBM', year: '2022' },
  { name: 'Alibaba Cloud Data Engineer', issuer: 'Alibaba CLoud', year: '2024' },
]

/* ── Portfolio ────────────────────────────────────────────── */

export const projects: Project[] = [
  {
    name: 'On-Premises to Azure Data Platform Migration',
    blurb:
      'A new integration architecture for an oil and gas major, moving the ETL workload off an on-premises data lake and onto Azure. SSIS and SQL Server stayed where they were; Azure Synapse, Data Factory and cloud-based SSAS took the heavy lifting. The interesting part was the seam between them. an API that lets on-premises SSIS trigger ADF pipelines, routed over ExpressRoute and Private Link so the call never touches the public internet.',
    tags: [
      'Azure Synapse',
      'Azure Data Factory',
      'SSIS',
      'SSAS',
      'ExpressRoute',
      'Private Link',
    ],
    featured: true,
  },
  {
    name: 'inomaly',
    blurb:
      'An R package for anomaly detection, published as a personal project and installable straight from the repo.',
    tags: ['R', 'Anomaly Detection', 'Package'],
    repo: 'https://github.com/irwannafly/inomaly',
  },
  {
    name: 'Association Rule Mining in R',
    blurb:
      'Correlation and association-rule mining over transactional data, written up as a worked example in R.',
    tags: ['R', 'Data Mining', 'Association Rules'],
    repo: 'https://github.com/irwannafly/arule-mining-using-r',
  },
  {
    name: 'Covid-19 Corporate Command Center',
    blurb:
      'A national situation dashboard built with the Indonesian Ministry of Health. Data was shaped in DB2 through stored procedures and DataStage, then surfaced in Tableau for daily operational reporting.',
    tags: ['Tableau', 'DB2', 'IBM DataStage', 'Public Sector'],
  },
  {
    name: 'Unstructured Data Ingestion Pipeline',
    blurb:
      'Azure Logic Apps that watch Blob Container and Data Lake for images, video, PDFs and documents, capture the metadata. filename, size, type, URL. and hand off to Data Factory to land it in Azure SQL Database.',
    tags: ['Azure Logic Apps', 'Azure Blob Storage', 'Azure Data Factory'],
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
