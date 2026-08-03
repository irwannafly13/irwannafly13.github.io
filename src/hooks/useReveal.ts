import { useEffect } from 'react'

/**
 * Adds .is-visible to every .reveal element once it scrolls into view.
 * Elements are only revealed once — no re-hiding on scroll back up.
 */
export function useReveal() {
  useEffect(() => {
    const collect = () =>
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')

    if (!('IntersectionObserver' in window)) {
      collect().forEach((element) => element.classList.add('is-visible'))
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

    const observeAll = () => collect().forEach((element) => observer.observe(element))
    observeAll()

    /* Anything mounted after this point — a filtered list being rebuilt, a
       collapsed panel opening — is a brand new node that the observer above
       has never seen, and .reveal leaves it at opacity 0. So watch for new
       nodes and pick them up. Coalesced to one pass per frame, because the
       hero's typing effect mutates the DOM several times a second. */
    let queued = false
    const mutations = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        observeAll()
      })
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutations.disconnect()
    }
  }, [])
}
