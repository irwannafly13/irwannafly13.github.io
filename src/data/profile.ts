/**
 * ─────────────────────────────────────────────────────────────
 *  The content file. Every section of the site renders from the
 *  objects below, and this is the only place any of it lives.
 * ─────────────────────────────────────────────────────────────
 */

import avatar from '../assets/avatar.png'

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
   * Square company logo, from public/logos/  e.g. "/logos/ibm.png".
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
  /**
   * Documentation screenshots for the panel on the left of the card, paged
   * with the arrows. Put the files in public/projects/ and list them here,
   * e.g. ['/projects/pipeline-1.png', '/projects/pipeline-2.png'].
   * Omit it and the panel shows a placeholder until you add one.
   */
  docs?: string[]
  /**
   * Which group button this project sits under. Must match one of the labels
   * in `projectCategories`. Leave it off and the project only shows under
   * "All".
   */
  category?: string
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
    'I build and maintain the pipelines and cloud platforms that move enterprise data from where it lands to where decisions get made. Nine years across oil and gas, government, telecommunications and finance. as a technical consultant, data engineer and data scientist. delivering systems that go live and stay live',
  /** Small facts shown as a strip under the hero. Keep to 3–4. */
  stats: [
    { value: '9+', label: 'Years in data & cloud' },
    { value: '20+', label: 'Services in production' },
    { value: '40+', label: 'Dashboards delivered' },
    { value: '10+', label: 'Models in production' },
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
   * Your photo, at src/assets/avatar.png. Rendered as a circle at 224px (448px
   * on retina), so square and 500x500 or larger is ideal. null falls back to
   * your initials.
   *
   * Overwrite that file to change the photo. It is imported rather than served
   * from public/ so the build fingerprints it  a new image gets a new URL, and
   * a browser or CDN can never hand back the old one.
   */
  avatarUrl: avatar as string | null,
  email: 'irwan.sinaga@hotmail.com',
}

export const socials: Social[] = [
  { label: 'GitHub', href: 'https://github.com/irwannafly13', icon: 'github' },
  { label: 'Email', href: `mailto:${profile.email}`, icon: 'mail' },
  // Add the real profile URL and uncomment to show the LinkedIn icon.
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
      'Python',
      'Apache Airflow',
      'Apache Flink',
      'Apache Kafka',
      'Databricks',
      'Azure Data Factory',
      'IBM DataStage',
      'SSIS',
      'Talend',
      'Pentaho',
      'Stored Procedures',
      'Shell Scripting',
    ],
  },
  {
    title: 'Databases',
    icon: 'tools',
    items: [
      'PostgreSQL',
      'SQL Server',
      'Oracle',
      'MySQL',
      'IBM DB2',
      'Greenplum',
      'Azure SQL Database',
      'Trino',
      'Presto',
      'Hive / HDFS',
      'BigQuery',
      'MaxCompute',
      'Hologres',
      'DuckDB',
      'Vector databases',
    ],
  },
  {
    title: 'Cloud & Platform',
    icon: 'cloud',
    items: [
      'Alibaba Cloud ECS & Kubernetes (ACK)',
      'Alibaba Cloud E-MapReduce (data lake, Kafka)',
      'Alibaba Cloud RDS & AnalyticDB',
      'Alibaba Cloud OSS & NAS',
      'Alibaba Cloud MaxCompute & Hologres',
      'Alibaba Cloud Elasticsearch',
      'Alibaba Cloud Model Studio & PAI',
      'Alibaba Cloud VPC, VPN & CEN',
      'Cloud Firewall, WAF & Load Balancer',
      'API Gateway & OpenAPI',
      'Cloud Monitor & ActionTrail',
      'Azure Data Lake & Blob Storage',
      'Azure Synapse Analytics',
      'Azure Data Factory',
      'Azure Logic Apps',
      'ExpressRoute / Private Link',
      'AWS EMR',
      'AWS ECS & container services',
      'AWS API Gateway',
    ],
  },
  {
    title: 'DevOps / SRE',
    icon: 'chart',
    items: [
      'Kubernetes',
      'Docker',
      'GitOps',
      'CI/CD',
      'Infrastructure as Code',
      'ArgoCD',
      'Atlantis',
      'FinOps',
      'Grafana',
      'Zabbix',
      'PagerDuty',
      'APM & OPM',
      'Elastic Stack',
      'Alibaba Cloud EAS',
      'Key Vault & secrets management',
      'RBAC',
      'OAuth',
      'Jira',
      'Confluence',
    ],
  },
  {
    title: 'Business Intelligence',
    icon: 'chart',
    items: [
      'Power BI',
      'Tableau',
      'Apache Superset',
      'MicroStrategy',
      'Looker',
      'Power Query',
      'DAX',
      'Row-level security (RLS)',
      'Streamlit',
    ],
  },
  {
    title: 'Languages',
    icon: 'code',
    items: ['Python', 'SQL', 'R', 'TypeScript', 'JavaScript', 'Bash', 'DAX', 'Rush'],
  },
  {
    title: 'Data Science & Machine Learning',
    icon: 'brain',
    items: [
      'Statistical modelling',
      'Forecasting',
      'Scoring models',
      'Anomaly detection',
      'Interpolation & imputation',
      'Deep learning',
      'Computer vision & OCR',
      'Feature stores (Feast)',
    ],
  },
  {
    title: 'Artificial Intelligence',
    icon: 'brain',
    items: [
      'RAG pipelines',
      'Text-to-SQL',
      'AI agents with Dify',
      'Qwen & Model Studio inference',
      'Conversational BI',
      'API key proxy for rate limiting & cost control',
    ],
  },
  {
    title: 'Full-Stack Development',
    icon: 'code',
    items: [
      'React',
      'AngularJS',
      'Vanilla JavaScript',
      'Flask',
      'Django',
      'Flutter',
    ],
  },
]

/* ── Experience ───────────────────────────────────────────── */

export const experience: Job[] = [
  {
    role: 'Big Data & DevOps Engineer',
    company: 'BFI Finance',
    logo: '/logos/bfi.png',
    location: 'Tangerang, Indonesia',
    start: 'Dec 2022',
    end: 'Present',
    summary:
      'Maintain the enterprise data platform on Alibaba Cloud end to end  the lake and streaming layer, the Kubernetes estate the services run on, the monitoring that wakes someone when it breaks, and the FinOps practice that keeps the bill defensible.',

    highlights: [
      'Built and operate the self-managed data platform on Kubernetes: Airflow for orchestration, Kafka via the Strimzi operator for streaming, Superset for self-service analytics and DataHub as the data catalogue.',
      'Delivered an AI chat platform for the business teams  a Flask application combining RAG, text-to-SQL over AnalyticDB and hosted LLM inference, so analysts can ask questions of the warehouse in plain language.',
      'Established the FinOps practice for Alibaba Cloud and Google Cloud: a cost management dashboard with statistical anomaly detection, automated validation of cloud invoices, and reporting that attributes spend back to the teams creating it.',
      'Automated the operational routines the platform used to absorb by hand  cost anomaly alerting, user and permission management, and data lake housekeeping.',
      'Run Kubernetes deployments for the APIs, applications and microservices the wider engineering group ships, including build and release pipelines.',
      'Initiate and maintain observability across the estate: Zabbix on Kubernetes for APM and OPM metrics, integrated with PagerDuty for on-call routing  now used by the IT production team as well.',
      'Build and maintain the E-MapReduce data lake and managed Kafka service, with Apache Ranger enforcing table and column-level access, authenticated through OAuth against Windows AD.',
      'Build and maintain the relational and analytical database layer: RDS for PostgreSQL and MySQL, AnalyticDB and vector databases supporting the AI workloads.',
      'Administer the Alibaba Cloud estate  ECS, Kubernetes, OSS, NAS, PAI, Flink, DataWorks, Hologres, MaxCompute, Elasticsearch, Load Balancer, API Gateway, WAF, KMS and Cloud Firewall.',
      'Designed and maintain the network layer: VPC, VPN and CEN, including site-to-site connectivity from on-premises to Alibaba Cloud and from Google Cloud to Alibaba Cloud.',
      'Partner with teams across BFI on cross-functional initiatives that touch the Enterprise Data platform, from requirements through to production handover.',
      'Build and manage the Infrastructure as Code and GitOps workflow behind the platform',
    ],

    stack: [
      'Alibaba Cloud',
      'Kubernetes',
      'Airflow',
      'Kafka / Strimzi',
      'Flink',
      'Trino',
      'Superset',
      'DataHub',
      'Zabbix / PagerDuty',
      'Python',
      'Power BI',
      'FinOps',
    ],
  },
  {
    role: 'Data Center Sub Section Head',
    company: 'Wings Group',
    logo: '/logos/wings.svg',
    location: 'Jakarta, Indonesia',
    start: 'Aug 2022',
    end: 'Dec 2022',
    summary:
      'Led the maintenance and enhancement of the enterprise Big Data platform and developed datamarts to support business intelligence and data-driven decision-making.',

    highlights: [
      'Managed and maintained the Greenplum Big Data platform, ensuring high availability and performance for stakeholders across Wings Group.',
      'Designed and developed business intelligence datamarts using multiple database technologies.',
      'Supervised and mentored Data Engineers within the Data Center team.',
      'Optimized Big Data pipelines to improve processing efficiency, reduce execution time, and increase system reliability.',
      'Collaborated with cross-functional teams to support enterprise data initiatives and analytics projects.',
      'Prepared and presented regular operational and project reports to the Data Center Manager and IT Manager.'
    ],

    stack: [
      'Big Data',
      'Greenplum',
      'PostgreSQL',
      'MicroStrategy',
      'Bash',
      'Machine Learning'
    ]
  },
  {
    role: 'Technical Consultant',
    company: 'IBM Indonesia',
    logo: '/logos/ibm.svg',
    location: 'Jakarta, Indonesia',
    start: 'Oct 2019',
    end: 'Aug 2022',
    summary:
      'Embedded with IBM clients across oil and gas, government, telecommunications and finance, owning data integration architecture, the migration path to Azure, and the reporting layer that sits on top of it.',
    highlights: [
      'Designed and delivered a new integration architecture that cut ETL run time from an on-premises data lake into Azure Data Lake for an oil and gas major, spanning SSIS, SQL Server, Azure Synapse, Azure Data Factory and cloud-based SSAS.',
      'Built and maintained an API that lets on-premises SSIS jobs trigger Azure Data Factory pipelines, then hardened the connection with ExpressRoute and Azure Private Link so the call never crossed the public internet.',
      'Developed the Corporate Command Center dashboard for Indonesia’s Covid-19 response with the Ministry of Health, transforming data in DB2 via stored procedures and DataStage and surfacing it in Tableau.',
      'Shipped Procurement, Domestic Gas, Human Resource, Risk Matrix and Project Progress dashboards end to end in Power BI Pro and Report Server, modelling in SSAS Tabular with Power Query and DAX.',
      'Migrated and integrated data warehouse and data lake layers for a finance client, rebuilding ETL in stored procedures, functions and shell scripts across DB2, PostgreSQL and flat-file sources into a new database environment.',
      'Reduced data availability time on automated jobs for a telecommunications operator by tuning DataStage, Talend, Hive, HDFS and shell-script workloads.',
      'Built unstructured-data ingestion with Azure Logic Apps, capturing blob metadata for images, video, PDFs and documents, then triggering Azure Data Factory to land it in Azure SQL Database.',
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
    logo: '/logos/nti.jpg',
    location: 'Jakarta, Indonesia',
    start: 'Jan 2019',
    end: 'Oct 2019',
    summary:
      'Owned the automated modelling layer behind a telecommunications client’s corporate dashboard, from the raw usage records through to the figures executives read.',
    highlights: [
      'Built and maintained an automated model that interpolates noise across hourly, daily, weekly and monthly series, closing the gaps left by late-arriving records before they reached the dashboard.',
      'Produced a new subscriber scoring table consumed directly by the corporate dashboard, developed in R against SQL Server and PostgreSQL.',
      'Automated the retraining and refresh cycle so the scores stayed current without manual intervention.',
    ],
    stack: ['R', 'SQL Server', 'PostgreSQL', 'Statistical Modelling'],
  },
  {
    role: 'Database Developer',
    company: 'Tarsus Indonesia (Infrastructure Asia)',
    logo: '/logos/tarsus.jpg',
    location: 'Jakarta, Indonesia',
    start: 'May 2017',
    end: 'Jan 2019',
    summary:
      'Ran the CRM data layer for an international events business the databases behind the sales floor, and the people entering data into them.',
    highlights: [
      'Developed and maintained the ACT CRM database on MySQL alongside the Infosalon registration RDBMS.',
      'Supervised telemarketing staff on validation of new sales data, keeping the record set clean at the point of entry rather than cleaning it afterwards.',
      'Delivered the visitor and exhibitor summary data the marketing division planned each event against.',
    ],
    stack: ['MySQL', 'ACT CRM', 'Infosalon'],
  },
]

export const education: Education[] = [
  {
    school: 'Universitas Padjadjaran',
    credential: 'Bachelor’s Degree, Statistics',
    period: '2012 – 2016',
  },
]

export const certifications: Certification[] = [
  { name: 'Big Data 101', issuer: 'IBM', year: '2021' },
  { name: 'DataOps', issuer: 'IBM', year: '2021' },
  { name: 'Microsoft Power BI', issuer: 'IBM', year: '2022' },
  { name: 'Cloud Data Engineer', issuer: 'Alibaba Cloud', year: '2024' },
]

/* ── Portfolio ────────────────────────────────────────────── */

/**
 * The group buttons above the portfolio grid, in the order they appear.
 *
 * Rename one and you must set the matching `category` on every project below,
 * or those projects fall into the automatic "Other" group instead.
 */
export const projectCategories = [
  'Data Platform',
  'Analytics & BI',
  'AI & Machine Learning',
  'Self Managed Services',
  'Open Source',
] as const

export const projects: Project[] = [
  {
    name: 'Cloud-Native Big Data Platform',
    category: 'Data Platform',
    featured: true,
    docs: ['/projects/datalake/dl1.png', '/projects/datalake/dl2.png'],
    blurb:
      'The platform the rest of this list hangs off. Object storage as the landing zone, Kafka for streaming ingest, Trino for federated query across the lake, Airflow for orchestration and a catalogue over the top  every component running on Kubernetes and declared as code, so an environment can be rebuilt from the repository rather than from somebody’s memory. Designing it was the easy half; the work was making the pieces behave as one platform with a single access model, one scheduler and one place to look when something breaks.',
    tags: ['Kubernetes', 'Object Storage', 'Kafka', 'Trino', 'Airflow', 'GitOps'],
  },
  {
    name: 'Streaming Platform with Kafka and Flink',
    category: 'Data Platform',
    featured: true,
    docs: ['/projects/kafka/kafkax.png'],
    blurb:
      'The real-time path through the platform. Source systems publish to Kafka, Flink jobs handle the transformation and enrichment in flight, and the results land in Hologres where the reporting layer can query them immediately. It exists because a nightly batch is the wrong answer to questions that are asked during the working day  the same data now arrives in seconds rather than hours, with the batch pipelines left to do what they are genuinely better at.',
    tags: ['Kafka', 'Flink', 'Hologres', 'Streaming', 'Kubernetes'],
  },
  {
    name: 'Managed RDS Estate for Application Teams',
    category: 'Data Platform',
    featured: true,
    docs: ['/projects/rds/rds.png'],
    blurb:
      'Ten-plus relational databases behind the company’s applications, provisioned and run as one estate rather than as ten separate favours. PostgreSQL and MySQL on RDS with AnalyticDB and vector databases alongside them, each with backup and retention policy set at creation, monitoring wired in from day one, and access granted by role. A new application gets a database that is already observable, already backed up and already governed, instead of one someone has to remember to look after later.',
    tags: [
      'Alibaba Cloud RDS',
      'PostgreSQL',
      'MySQL',
      'AnalyticDB',
      'VectorDB',
      'Backup & HA',
    ],
  },
  {
    name: 'On-Premises to Azure Data Platform Migration',
    category: 'Data Platform',
    featured: true,
    docs: ['/projects/azure/azure1.png'],
    blurb:
      'A new integration architecture for an oil and gas major, moving the ETL workload off an on-premises data lake and onto Azure. SSIS and SQL Server stayed where they were; Azure Synapse, Data Factory and cloud-based SSAS took the heavy lifting. The interesting part was the seam between them: an API that lets on-premises SSIS trigger ADF pipelines, routed over ExpressRoute and Private Link so the call never touches the public internet. Run time on the ETL came down, and the on-premises estate kept working throughout the cutover.',
    tags: [
      'Azure Synapse',
      'Azure Data Factory',
      'SSIS',
      'SSAS',
      'ExpressRoute',
      'Private Link',
    ],
  },
  {
    name: 'Covid-19 Corporate Command Center',
    category: 'Analytics & BI',
    featured: true,
    docs: ['/projects/covid/covid.jpg'],
    blurb:
      'The national situation dashboard built with Indonesia’s Ministry of Health during the pandemic response. Data was shaped in DB2 through stored procedures and DataStage, then surfaced in Tableau for daily operational reporting  the numbers decision-makers read each morning, so the refresh had to land on time every day rather than most days.',
    tags: ['Tableau', 'DB2', 'IBM DataStage', 'Public Sector'],
  },
  {
    name: 'Cloud Cost Management Dashboard',
    category: 'Analytics & BI',
    docs: ['/projects/cost/cost1.jpg'],
    blurb:
      'A self-managed answer to “why is the cloud bill this shape?”. Billing and usage are pulled through the provider’s OpenAPI on a scheduled Airflow job, landed in RDS and modelled in Power BI, broken down by account, service and environment. Forecasting projects the month end from spend so far, and anomaly detection flags the unusual line item in the same week it happens rather than when the invoice arrives.',
    tags: ['OpenAPI', 'Airflow', 'RDS', 'Power BI', 'Forecasting'],
  },
  {
    name: 'FinOps Foundation',
    category: 'Analytics & BI',
    docs: ['/projects/cost/fins.jpg'],
    blurb:
      'The practice around the numbers, not just the dashboard. An operational framework that puts engineering, finance and business on one set of figures: spend attributed back to the teams that create it, automated routines that surface idle and oversized resources, and a reporting cadence that makes cloud cost a decision teams take rather than a bill they receive.',
    tags: ['FinOps', 'Automation', 'Power BI', 'Governance'],
  },
  {
    name: 'Data Lake Operations Dashboard',
    category: 'Analytics & BI',
    docs: ['/projects/datalake/dl-dashboard.jpg'],
    blurb:
      'The view the data operations team works from: what landed and what failed overnight, how much storage each zone holds, and how lifecycle rules are moving data between tiers as it ages. Built so a stalled feed or a zone growing faster than it should is visible on the dashboard, not discovered by a stakeholder.',
    tags: ['Airflow', 'RDS', 'Power BI', 'Data Lifecycle'],
  },
  {
    name: 'Car Damage Detection',
    category: 'AI & Machine Learning',
    docs: ['/projects/cardd/cardd1.png'],
    blurb:
      'A computer-vision model that finds and classifies damage on photographs of vehicles  dents, scratches, broken glass  so an assessment can start from an image instead of a physical inspection. Trained on labelled car imagery with a deep-learning backbone, then evaluated on how it behaves with the awkward cases: bad light, reflections and part of the car out of frame.',
    tags: ['Python', 'Deep Learning', 'Computer Vision'],
  },
  {
    name: 'Hourly Data Interpolation with K-Means',
    category: 'AI & Machine Learning',
    docs: ['/projects/kmeans/kmeans.png'],
    blurb:
      'Telecommunications usage data arrives late, out of order and occasionally not at all, which leaves holes in the hourly series a dashboard reads as zeroes. This model clusters each series by its own behaviour and fills the gaps from the profile of the cluster it belongs to, rather than from a flat average that flattens the peaks. Running across hourly, daily, weekly and monthly grains, it removed the manual correction pass that used to sit between the pipeline and the report.',
    tags: ['R', 'K-Means', 'Interpolation', 'Time Series'],
  },
  {
    name: 'Conversational BI with Qwen',
    category: 'AI & Machine Learning',
    docs: ['/projects/ai-chat/ai.jpg'],
    blurb:
      'A chat interface onto the warehouse, so a business user can ask for a figure instead of requesting a report and waiting. An agent built on the Qwen models translates the question into SQL against AnalyticDB, runs it under the asker’s own permissions and returns the answer with the query it used  the last part being what makes it trustworthy rather than merely impressive. Served from a Flask application, with RAG over the data dictionary so the model knows what the columns actually mean.',
    tags: ['Qwen', 'Text-to-SQL', 'RAG', 'Flask', 'AnalyticDB'],
  },
  {
    name: 'Internal AI Assistant on Qwen',
    category: 'AI & Machine Learning',
    docs: ['/projects/ai-chat/ai.jpg'],
    blurb:
      'A general-purpose assistant for internal teams, grounded in company documentation through a RAG pipeline so answers cite an internal source rather than the model’s recollection. Agent flows are composed in Dify, inference runs on hosted Qwen models, and every call passes through an API key proxy that enforces rate limits and routes traffic  which keeps one enthusiastic team from consuming the quota, and keeps the monthly cost predictable.',
    tags: ['Qwen', 'Dify', 'RAG', 'API Proxy', 'Model Studio'],
  },
  {
    name: 'Product Recommendations from Market Basket Analysis',
    category: 'AI & Machine Learning',
    docs: ['/projects/market/market_basket_analysis.png'],
    blurb:
      'Association rule mining over transaction history, turned into something the business can use: which products are bought together, how strong the pattern really is once support, confidence and lift are accounted for, and which of those rules are worth putting in front of a customer. The modelling is the short part  most of the work was filtering the statistically true but commercially useless rules out before they reached a recommendation.',
    tags: ['Python', 'Association Rules', 'Apriori', 'Recommendation'],
  },
  {
    name: 'Telco Score',
    category: 'AI & Machine Learning',
    docs: ['/projects/scoring/images.png'],
    blurb:
      'A scoring model over telecommunications subscriber data, turning raw usage records into a single number the business can rank and act on. Modelled in Python and served behind a small Flask endpoint, so the reporting layer requests scores directly instead of waiting for a batch table to be rebuilt.',
    tags: ['Python', 'Flask', 'Modelling', 'Scoring'],
  },
  {
    name: 'JupyterHub Data Science Workbench',
    category: 'Self Managed Services',
    docs: ['/projects/jhub/jhub.png'],
    blurb:
      'A shared notebook environment for analysts and data scientists, self-hosted on Kubernetes. Each user gets an isolated server on demand, signed in through OAuth against the corporate directory, with a persistent volume so work survives a restart and per-profile resource limits so one runaway notebook can’t take the cluster with it.',
    tags: ['Kubernetes', 'OAuth', 'PVC', 'RDS'],
  },
  {
    name: 'Superset on Kubernetes',
    category: 'Self Managed Services',
    docs: ['/projects/superset/superset.jpg'],
    blurb:
      'Self-hosted Superset wired straight to Trino, so analysts can slice the lake without an extract landing in a spreadsheet first. Metadata sits in RDS, the deployment is versioned alongside the rest of the platform, and roles are mapped so each team reaches only the data it owns.',
    tags: ['Kubernetes', 'Superset', 'Trino', 'RDS'],
  },
  {
    name: 'Airbyte Data Integration Platform',
    category: 'Self Managed Services',
    docs: ['/projects/airbyte/airbyte.png'],
    blurb:
      'Self-hosted Airbyte on Kubernetes, syncing source systems into the platform through configurable connections instead of a drawer full of hand-written extract scripts. Connections and schedules are declared with the deployment, job state and history live in RDS, and a new source is a configuration change rather than a new codebase to maintain.',
    tags: ['Kubernetes', 'Airbyte', 'Google SDK', 'RDS'],
  },
  {
    name: 'Kafka Cluster with Strimzi',
    category: 'Self Managed Services',
    docs: ['/projects/kafka/strimzi.png'],
    blurb:
      'The streaming backbone: a Kafka cluster run by the Strimzi operator, where brokers, topics and users are Kubernetes manifests rolled out through CI/CD rather than configured by hand on a broker. Persistent volumes for the logs, an API gateway and load balancer in front for producers outside the cluster, and a rolling upgrade path that doesn’t take the topic offline.',
    tags: [
      'Kubernetes',
      'Kafka',
      'Strimzi Operator',
      'PVC',
      'API Gateway',
      'Load Balancer',
      'CI/CD',
    ],
  },
  {
    name: 'Airflow on Kubernetes',
    category: 'Self Managed Services',
    docs: ['/projects/airflow/airflow.png'],
    blurb:
      'The platform’s scheduler, self-hosted rather than bought. DAGs are delivered from git, each task runs in its own pod so a heavy job can’t starve the rest of the queue, and images are built and promoted through CI/CD  which makes a pipeline change a pull request with a review on it.',
    tags: ['Airflow', 'Kubernetes', 'Docker', 'DAG', 'GitOps'],
  },
  {
    name: 'DataHub Data Catalog',
    category: 'Self Managed Services',
    docs: ['/projects/datahub/datahub.png'],
    blurb:
      'DataHub on Kubernetes as the catalogue: datasets, owners, schemas and column-level lineage in one searchable place. Ingestion runs through the REST and Kafka interfaces as pipelines execute, so the catalogue reflects what the platform actually did rather than what a spreadsheet said it would do  and "what breaks if I change this column?" becomes a question with an answer.',
    tags: ['DataHub', 'Kubernetes', 'Docker', 'Kafka', 'GitOps', 'Lineage'],
  },
  {
    name: 'Zabbix Monitoring with PagerDuty',
    category: 'Self Managed Services',
    docs: ['/projects/zabbix/zabbix.jpg'],
    blurb:
      'Infrastructure monitoring on Kubernetes, integrated with Google APIs and PagerDuty so an alert reaches whoever is actually on call through a rota, instead of landing in a shared inbox overnight. Templates and triggers are set per host group and delivered through the REST API, which keeps the monitoring definition as reproducible as the thing it watches.',
    tags: ['Zabbix', 'Kubernetes', 'PagerDuty', 'REST API'],
  },
  {
    name: 'Grafana for APM and OPM',
    category: 'Self Managed Services',
    docs: ['/projects/grafana/grafana.png'],
    blurb:
      'One pane of glass for application and operational performance. Grafana on Kubernetes with a dashboard per service, alert rules living next to the panels they fire on, and a shared library so every team reads latency, throughput and saturation the same way  which matters most in the middle of an incident.',
    tags: ['Grafana', 'Kubernetes', 'APM', 'OPM'],
  },
  {
    name: 'EMR Data Lake on Alibaba Cloud',
    category: 'Self Managed Services',
    docs: ['/projects/datalake/dl3.png'],
    blurb:
      'The lake underneath the platform: an E-MapReduce cluster on Alibaba Cloud running HDFS on ECS, with Trino for interactive query and Apache Ranger holding the access policy. Permissions are defined once at table and column level and enforced centrally, so a new query engine inherits the rules instead of introducing its own.',
    tags: ['Alibaba Cloud', 'E-MapReduce', 'HDFS', 'Trino', 'ECS', 'Ranger'],
  },
  {
    name: 'EMR Lakehouse on Alibaba Cloud',
    category: 'Self Managed Services',
    docs: ['/projects/datalake/dl3.png'],
    blurb:
      'The layer that turns the lake into something transactional. Open table formats over object storage give the warehouse behaviours the raw lake never had  schema evolution, time travel and updates that don’t mean rewriting a partition by hand  while the data stays in open files that any engine can read. Trino serves interactive query, Hologres serves the reporting layer, and neither owns the data.',
    tags: [
      'Alibaba Cloud',
      'E-MapReduce',
      'Lakehouse',
      'Object Storage',
      'Trino',
      'Hologres',
    ],
  },
  {
    name: 'inomaly',
    category: 'Open Source',
    docs: ['/projects/inomaly/inomaly.png'],
    blurb:
      'An R package for anomaly detection, published as a personal project and installable straight from the repository. It packages the checks I kept rewriting from scratch on each engagement into one place, so flagging the points a series shouldn’t contain is a function call rather than a script copied between projects.',
    tags: ['R', 'Anomaly Detection', 'Package'],
    repo: 'https://github.com/irwannafly/inomaly',
  },
  {
    name: 'Association Rule Mining in R',
    category: 'Open Source',
    docs: ['/projects/arule/arule.png'],
    blurb:
      'Market-basket analysis on transactional data: mining which items get bought together and ranking the rules by support, confidence and lift. Written up as a worked example with the R code and the interpretation side by side, because the modelling is the short part  reading a rule back as something a merchandiser can act on is the rest of it.',
    tags: ['R', 'Data Mining', 'Association Rules'],
    demo: 'https://irwannafly.blogspot.com/2019/01/how-to-know-customer-needs-from.html',
  },
]

/* ── Navigation ───────────────────────────────────────────── */

export const sections = [
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
] as const
