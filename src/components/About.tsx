import { Section } from './Section'
import { certifications, education, profile } from '../data/profile'

export function About() {
  return (
    <Section id="about" eyebrow="01 — About" title="Who I am">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="reveal space-y-4 text-base leading-relaxed">
          {profile.about.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <div className="reveal space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
              Education
            </h3>
            <ul className="space-y-4">
              {education.map((item) => (
                <li key={item.school} className="card p-4">
                  <p className="font-medium text-ink-900 dark:text-white">
                    {item.credential}
                  </p>
                  <p className="mt-0.5 text-sm">{item.school}</p>
                  <p className="mt-1 font-mono text-xs text-ink-400 dark:text-ink-500">
                    {item.period}
                  </p>
                  {item.detail && <p className="mt-2 text-sm">{item.detail}</p>}
                </li>
              ))}
            </ul>
          </div>

          {certifications.length > 0 && (
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
                Certifications
              </h3>
              <ul className="space-y-3">
                {certifications.map((item) => {
                  const body = (
                    <>
                      <p className="font-medium text-ink-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-sm">
                        {item.issuer} · {item.year}
                      </p>
                    </>
                  )
                  return (
                    <li key={item.name} className="card p-4">
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noreferrer">
                          {body}
                        </a>
                      ) : (
                        body
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
