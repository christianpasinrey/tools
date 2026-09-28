import { ref } from 'vue'

const hasWindow = typeof window !== 'undefined'

/** Hash actual de la URL (con #). Fuente para saber qué herramienta de la sección está activa. */
export const currentHash = ref(hasWindow ? window.location.hash : '')

if (hasWindow) {
  const sync = () => { currentHash.value = window.location.hash }
  window.addEventListener('hashchange', sync)
  window.addEventListener('popstate', sync)
}

/** Cambia el hash sin añadir historial y sin perder el estado de vue-router. */
export function replaceSectionHash(hash) {
  const url = `${window.location.pathname}${window.location.search}#${hash}`
  window.history.replaceState(window.history.state, '', url)
  currentHash.value = `#${hash}`
}

/**
 * Navega a una herramienta de sección. En la misma sección el hash del router puede estar
 * desfasado (las pestañas usan replaceState), así que se fuerza el push y se avisa con hashchange.
 */
export async function goToSectionTool(router, path, hash) {
  const sameSection = router.currentRoute.value.path === path
  await router.push({ path, hash: hash ? `#${hash}` : '', force: sameSection })
  if (sameSection) window.dispatchEvent(new HashChangeEvent('hashchange'))
}
