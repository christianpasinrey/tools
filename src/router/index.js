import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { device } from '../composables/useDevice'

// Rutas no soportadas en dispositivos móviles
const mobileUnsupportedRoutes = [
  '/multimedia',           // Toda la sección multimedia
  '/audio-editor',
  '/image-editor',
  '/3d-playground',
  '/svg-editor'
]

// Hashes no soportados en móvil para rutas parcialmente soportadas
const mobileUnsupportedHashes = {
  '/documents': ['#pdf', '#spreadsheet'],
  '/technology': ['#dev', '#api']
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/multimedia',
    name: 'Multimedia',
    component: () => import('../views/Multimedia.vue')
  },
  {
    path: '/audio-editor',
    redirect: '/multimedia#audio'
  },
  {
    path: '/image-editor',
    redirect: '/multimedia#image'
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/Documents.vue')
  },
  {
    path: '/3d-playground',
    redirect: '/multimedia#3d'
  },
  {
    path: '/technology',
    name: 'Technology',
    component: () => import('../views/Technology.vue')
  },
  {
    path: '/dev-tools',
    redirect: '/technology#dev'
  },
  {
    path: '/svg-editor',
    redirect: '/multimedia#svg'
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('../views/Tools.vue')
  },
  {
    path: '/unit-converter',
    redirect: '/tools#converter'
  },
  {
    path: '/color-picker',
    redirect: '/tools#color'
  },
  {
    path: '/cheatsheets',
    name: 'CheatSheets',
    component: () => import('../views/CheatSheets.vue')
  },
  {
    path: '/reference',
    redirect: '/cheatsheets'
  },
  {
    path: '/phone-tester',
    redirect: '/technology#phone'
  },
  {
    path: '/cyber-security',
    redirect: '/technology#security'
  },
  {
    path: '/apps',
    name: 'Apps',
    component: () => import('../views/Apps.vue')
  },
  {
    path: '/location',
    redirect: '/apps#map'
  },
  {
    path: '/map-editor',
    redirect: '/apps#map'
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/reset-account',
    name: 'ResetAccount',
    component: () => import('../views/ResetAccount.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guard para dispositivos móviles
router.beforeEach((to, from, next) => {
  // Solo aplicar en dispositivos móviles
  if (!device.isMobile) {
    next()
    return
  }

  // Verificar si la ruta base no está soportada
  if (mobileUnsupportedRoutes.includes(to.path)) {
    next('/')
    return
  }

  // Verificar si el hash específico no está soportado
  const unsupportedHashes = mobileUnsupportedHashes[to.path]
  if (unsupportedHashes && to.hash && unsupportedHashes.includes(to.hash)) {
    next('/')
    return
  }

  next()
})

export default router
