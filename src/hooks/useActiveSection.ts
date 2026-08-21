import { useEffect, useState } from 'react'

/**
 * Returns the id of the section currently closest to the top of the viewport,
 * used to highlight the matching link in the nav.
 *
 * `enabled` is not just an optimisation. The sections only exist on the
 * profile route, and leaving it unmounts them — an observer set up once at
 * mount would keep watching detached nodes and the highlight would never
 * update again after a trip to the blog. Toggling this re-runs the effect and
 * re-observes whatever is in the DOM now.
 */
export function useActiveSection(ids: readonly string[], enabled = true) {
  const [active, setActive] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    if (!enabled) return

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActive(visible[0].target.id)
      },
      // Focus on a band near the top of the viewport so the highlight
      // changes as a section's heading reaches the header.
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [ids, enabled])

  return active
}
