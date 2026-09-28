import { useDevice } from '@/composables/useDevice'
import { setPendingLaunch, LAUNCH_EVENT } from './pendingLaunch'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

async function navigate(router, entry, file) {
  const { path, hash } = entry.route
  // Las secciones cambian de pestaña con history.replaceState, así que el hash que
  // recuerda el router puede estar desfasado: en la misma sección se fuerza el push
  // y se avisa con hashchange para que la sección lea el hash real.
  const sameSection = router.currentRoute.value.path === path
  await router.push({ path, hash: hash ? `#${hash}` : '', force: sameSection })
  if (sameSection) window.dispatchEvent(new HashChangeEvent('hashchange'))

  // La entrega se deja al llegar (la caducidad cuenta desde que la herramienta ha
  // cargado) y solo si la navegación no acabó en otra ruta.
  if (entry.launch && router.currentRoute.value.path === path) setPendingLaunch(entry.launch, file)
  window.dispatchEvent(new Event(LAUNCH_EVENT))
}

export async function openTool(router, entry, { file = null, sourceEl = null, recordVisit = null } = {}) {
  if (useDevice().isMobile.value && entry.mobile === false) return
  recordVisit?.(entry.id)

  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    await navigate(router, entry, file)
    return
  }

  const main = document.getElementById('app-main')
  if (sourceEl) sourceEl.style.viewTransitionName = 'tool-open'
  const transition = document.startViewTransition(async () => {
    if (sourceEl) sourceEl.style.viewTransitionName = ''
    await navigate(router, entry, file)
    main?.style.setProperty('view-transition-name', 'tool-open')
  })
  try {
    await transition.finished
  } finally {
    main?.style.removeProperty('view-transition-name')
  }
}

