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
    path: '/gif-maker',
    name: 'GifMaker',
    component: () => import('../views/GifMaker.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
