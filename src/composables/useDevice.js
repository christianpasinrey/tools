import { ref, readonly, onMounted, onUnmounted } from 'vue'

// Breakpoint para considerar móvil (mismo que Tailwind md)
const MOBILE_BREAKPOINT = 768

/**
 * Detección de plataforma móvil
 * Combina userAgent + tamaño de pantalla para mejor compatibilidad
 */
function detectPlatform() {
  // SSR safety check
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isMobileSize: false,
      platform: 'desktop'
    }
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || ''

  // Detección iOS (iPhone, iPad, iPod)
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  // Detección Android
  const isAndroid = /android/i.test(ua)

  // Detección por tamaño de pantalla (para emuladores y responsive)
  const isMobileSize = window.innerWidth < MOBILE_BREAKPOINT

  // Es móvil si el userAgent dice que es móvil O si el tamaño de pantalla es pequeño
  const isMobile = isIOS || isAndroid || isMobileSize

  // Es tablet (pantalla grande pero táctil)
  const isTablet = (isIOS || isAndroid) && (
    Math.min(window.screen.width, window.screen.height) >= 600
  )

  // Es desktop
  const isDesktop = !isMobile

  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    isMobileSize,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : isMobileSize ? 'mobile' : 'desktop'
  }
}

// Estado global singleton
let deviceInfo = detectPlatform()

// Estado reactivo
const platform = ref(deviceInfo.platform)
const isMobile = ref(deviceInfo.isMobile)
const isTablet = ref(deviceInfo.isTablet)
const isDesktop = ref(deviceInfo.isDesktop)
const isIOS = ref(deviceInfo.isIOS)
const isAndroid = ref(deviceInfo.isAndroid)
const isMobileSize = ref(deviceInfo.isMobileSize)

// Listener para cambios de tamaño de ventana
let resizeHandler = null

function updateOnResize() {
  deviceInfo = detectPlatform()
  platform.value = deviceInfo.platform
  isMobile.value = deviceInfo.isMobile
  isTablet.value = deviceInfo.isTablet
  isDesktop.value = deviceInfo.isDesktop
  isMobileSize.value = deviceInfo.isMobileSize
}

// Inicializar listener de resize
if (typeof window !== 'undefined') {
  resizeHandler = () => updateOnResize()
  window.addEventListener('resize', resizeHandler)
}

// Lista de tools no soportadas en móvil (por ID)
const unsupportedToolsOnMobile = [
  'image', 'audio', '3d', 'svg',  // Multimedia completo
  'pdf', 'spreadsheet',           // Documents parcial
  'dev', 'api'                    // Technology parcial
]

// Lista de secciones completamente no soportadas en móvil
const unsupportedSectionsOnMobile = ['multimedia']

/**
 * Composable para detección de dispositivo
 * @returns {Object} Estados reactivos y helpers
 */
export function useDevice() {
  return {
    // Estados reactivos (readonly para evitar mutaciones externas)
    platform: readonly(platform),
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isIOS: readonly(isIOS),
    isAndroid: readonly(isAndroid),
    isMobileSize: readonly(isMobileSize),

    /**
     * Verifica si una herramienta es soportada en la plataforma actual
     * @param {string} toolId - ID de la herramienta
     * @returns {boolean}
     */
    isToolSupported: (toolId) => {
      // En desktop todo es soportado
      if (isDesktop.value) return true
      // En móvil, verificar contra lista de tools no soportadas
      return !unsupportedToolsOnMobile.includes(toolId)
    },

    /**
     * Verifica si una sección completa es soportada
     * @param {string} section - Nombre de la sección
     * @returns {boolean}
     */
    isSectionSupported: (section) => {
      if (isDesktop.value) return true
      return !unsupportedSectionsOnMobile.includes(section)
    }
  }
}

/**
 * Exportar valores estáticos para uso fuera de componentes Vue
 * (útil para router guards)
 */
export const device = {
  ...deviceInfo,

  /**
   * Verifica si una herramienta es soportada (versión estática)
   * @param {string} toolId - ID de la herramienta
   * @returns {boolean}
   */
  isToolSupported: (toolId) => {
    if (deviceInfo.isDesktop) return true
    return !unsupportedToolsOnMobile.includes(toolId)
  },

  /**
   * Verifica si una sección es soportada (versión estática)
   * @param {string} section - Nombre de la sección
   * @returns {boolean}
   */
  isSectionSupported: (section) => {
    if (deviceInfo.isDesktop) return true
    return !unsupportedSectionsOnMobile.includes(section)
  }
}

// Listas exportadas para uso en otros módulos
export const UNSUPPORTED_TOOLS_MOBILE = unsupportedToolsOnMobile
export const UNSUPPORTED_SECTIONS_MOBILE = unsupportedSectionsOnMobile
