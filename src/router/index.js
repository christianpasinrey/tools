import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

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
    path: '/unit-converter',
    name: 'UnitConverter',
    component: () => import('../views/UnitConverter.vue')
  },
  {
    path: '/color-picker',
    name: 'ColorPicker',
    component: () => import('../views/ColorPicker.vue')
  },
  {
    path: '/cheatsheets',
    name: 'CheatSheets',
    component: () => import('../views/CheatSheets.vue')
  },
  {
    path: '/phone-tester',
    redirect: '/technology#phone'
  },
  {
    path: '/cyber-security',
    redirect: '/technology#security'
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

export default router
