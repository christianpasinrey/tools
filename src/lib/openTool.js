import { toHref } from '@/config/catalog'
import { setPendingLaunch, LAUNCH_EVENT } from './pendingLaunch'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

async function navigate(router, to) {
  const before = router.currentRoute.value
  await router.push(to)
  const after = router.currentRoute.value
  // router.push usa pushState: las secciones escuchan hashchange para cambiar de pestaña
  if (before.path === after.path && before.hash !== after.hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  window.dispatchEvent(new Event(LAUNCH_EVENT))
}

export async function openTool(router, entry, { file = null, sourceEl = null, recordVisit = null } = {}) {
  recordVisit?.(entry.id)
  if (entry.launch) setPendingLaunch(entry.launch, file)
  const to = toHref(entry)

  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    await navigate(router, to)
    return
  }

  const main = document.getElementById('app-main')
  if (sourceEl) sourceEl.style.viewTransitionName = 'tool-open'
  const transition = document.startViewTransition(async () => {
    if (sourceEl) sourceEl.style.viewTransitionName = ''
    await navigate(router, to)
    main?.style.setProperty('view-transition-name', 'tool-open')
  })
  try {
    await transition.finished
  } finally {
    main?.style.removeProperty('view-transition-name')
  }
}
