import { useEffect } from 'react'

/**
 * Adds .is-visible to every .reveal element once it scrolls into view.
 * Elements are only revealed once — no re-hiding on scroll back up.
 */
export function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')

    if (!('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}
