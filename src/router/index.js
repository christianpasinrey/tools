import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/audio-editor',
    name: 'AudioEditor',
    component: () => import('../views/AudioEditor.vue')
  },
  {
    path: '/image-editor',
    name: 'ImageEditor',
    component: () => import('../views/ImageEditor.vue')
  },
  {
    path: '/pdf-editor',
    name: 'PdfEditor',
    component: () => import('../views/PdfEditor.vue')
  },
  {
    path: '/3d-playground',
    name: '3DPlayground',
    component: () => import('../views/3DPlayground.vue')
  },
  {
    path: '/dev-tools',
    name: 'DevTools',
    component: () => import('../views/DevTools.vue')
  },
  {
    path: '/svg-editor',
    name: 'SvgEditor',
    component: () => import('../views/SvgEditor.vue')
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
