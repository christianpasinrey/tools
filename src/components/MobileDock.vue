<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import MobileDockSubmenu from './MobileDockSubmenu.vue'
import { useAuth } from '../composables/useAuth'
import { useAppCrypto } from '../composables/useAppCrypto'
import { useCloudSync } from '../composables/useCloudSync'
import AuthForm from './common/AuthForm.vue'
import SyncStatusPanel from './common/SyncStatusPanel.vue'

const route = useRoute()
const router = useRouter()

// Dark mode
const isDark = useDark()
const toggleDark = useToggle(isDark)

// Auth & Sync
const auth = useAuth()
const crypto = useAppCrypto()
const cloudSync = useCloudSync()
const showSyncPanel = ref(false)

// Sync status
const syncStatusClass = computed(() => {
  if (!auth.isAuthenticated.value) return 'text-neutral-400'
  if (crypto.isLocked.value) return 'text-amber-400'
  if (cloudSync.syncStatus.value === 'syncing') return 'text-blue-400'
  if (cloudSync.syncStatus.value === 'error') return 'text-red-400'
  if (cloudSync.pendingChanges.value.length > 0) return 'text-amber-400'
  return 'text-emerald-400'
})

// Expanded state
const isExpanded = ref(false)

// Tools configuration (mobile only)
const tools = [
  {
    path: '/documents',
    name: 'Documentos',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#ef4444',
    hasSubmenu: true,
    submenuTitle: 'Documentos',
    submenuItems: [
      {
        path: '/documents#markdown',
        name: 'Markdown Editor',
        description: 'Editor MD con preview en vivo',
        icon: 'M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zm8.56-1.98V8.81h-1.93v6.38h4.55v-1.98h-2.62z',
        color: '#3b82f6'
      }
    ]
  },
  {
    path: '/technology',
    name: 'Technology',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: '#06b6d4',
    hasSubmenu: true,
    submenuTitle: 'Technology',
    submenuItems: [
      {
        path: '/technology#phone',
        name: 'Phone Tester',
        description: 'Prueba llamadas SIP WebRTC',
        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
        color: '#10b981'
      },
      {
        path: '/technology#security',
        name: 'Cyber Security',
        description: 'JWT, Base64, Hash y más',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        color: '#ef4444'
      }
    ]
  },
  {
    path: '/tools',
    name: 'Tools',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: '#10b981',
    hasSubmenu: true,
    submenuTitle: 'Tools',
    submenuItems: [
      {
        path: '/tools#converter',
        name: 'Unit Converter',
        description: 'Longitud, peso, temperatura, tiempo, monedas',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        color: '#10b981'
      },
      {
        path: '/tools#color',
        name: 'Color Picker',
        description: 'Paletas de colores, gradientes',
        icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
        color: '#ec4899'
      }
    ]
  },
  {
    path: '/apps',
    name: 'Apps',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    color: '#6366f1',
    hasSubmenu: true,
    submenuTitle: 'Apps',
    submenuItems: [
      {
        path: '/apps#map',
        name: 'Map Editor',
        description: 'Mapas interactivos',
        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
        color: '#2563eb'
      },
      {
        path: '/apps#todo',
        name: 'TODO Kanban',
        description: 'Tablero de tareas',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        color: '#6366f1'
      },
      {
        path: '/apps#invoice',
        name: 'Facturas',
        description: 'Generador de facturas',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: '#10b981'
      }
    ]
  },
  {
    path: '/cheatsheets',
    name: 'Reference',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#f59e0b',
    hasSubmenu: false
  }
]

// Submenu state
const activeSubmenuIndex = ref(-1)

const activeSubmenu = computed(() => {
  if (activeSubmenuIndex.value === -1) return null
  return tools[activeSubmenuIndex.value]
})

const toggleDock = () => {
  if (isExpanded.value) {
    isExpanded.value = false
    activeSubmenuIndex.value = -1
  } else {
    isExpanded.value = true
  }
}

const handleToolClick = (tool, index) => {
  if (tool.hasSubmenu) {
    activeSubmenuIndex.value = activeSubmenuIndex.value === index ? -1 : index
  } else {
    router.push(tool.path)
    isExpanded.value = false
  }
}

const handleSubmenuItemClick = () => {
  activeSubmenuIndex.value = -1
  isExpanded.value = false
}

const closeSubmenu = () => {
  activeSubmenuIndex.value = -1
}

const navigateToSection = (index) => {
  activeSubmenuIndex.value = index
}

const goHome = () => {
  router.push('/')
  isExpanded.value = false
}

// Close when clicking outside
const handleClickOutside = (e) => {
  const dock = document.querySelector('.mobile-dock')
  const submenu = document.querySelector('.mobile-dock-submenu')

  const clickedInDock = dock && dock.contains(e.target)
  const clickedInSubmenu = submenu && submenu.contains(e.target)

  if (!clickedInDock && !clickedInSubmenu) {
    isExpanded.value = false
    activeSubmenuIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const isActive = (path) => {
  return route.path === path || route.fullPath.startsWith(path)
}
</script>

<template>
  <div class="mobile-dock" :class="{ expanded: isExpanded }">
    <!-- Submenu Panel -->
    <MobileDockSubmenu
      :visible="activeSubmenuIndex !== -1 && activeSubmenu?.hasSubmenu"
      :title="activeSubmenu?.submenuTitle || ''"
      :items="activeSubmenu?.submenuItems || []"
      :color="activeSubmenu?.color || '#22c55e'"
      :all-sections="tools"
      :current-index="activeSubmenuIndex"
      @item-click="handleSubmenuItemClick"
      @close="closeSubmenu"
      @navigate-section="navigateToSection"
    />

    <!-- Toggle Button (when collapsed) -->
    <button
      v-if="!isExpanded"
      class="dock-toggle"
      @click.stop="toggleDock"
    >
      <svg class="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Bottom bar with 3 buttons (when expanded) -->
    <div v-else class="dock-bottom-bar">
      <!-- Close -->
      <button class="dock-bottom-btn" @click.stop="toggleDock">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="dock-bottom-divider"></div>
      <!-- Theme toggle -->
      <button class="dock-bottom-btn" @click.stop="toggleDark()">
        <svg v-if="isDark" class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
      <div class="dock-bottom-divider"></div>
      <!-- Sync -->
      <button class="dock-bottom-btn" :class="syncStatusClass" @click.stop="showSyncPanel = !showSyncPanel">
        <svg class="w-4 h-4" :class="{ 'animate-pulse': cloudSync.syncStatus.value === 'syncing' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </button>
    </div>

    <!-- Sync Panel -->
    <Transition name="sync-slide">
      <div v-if="showSyncPanel && isExpanded" class="dock-sync-panel">
        <AuthForm v-if="!auth.isAuthenticated.value" />
        <SyncStatusPanel v-else />
      </div>
    </Transition>

    <!-- Expandable Content -->
    <div class="dock-items" :class="{ visible: isExpanded }">
      <!-- Home Button -->
      <button
        class="dock-item"
        :class="{ 'is-active': route.path === '/' }"
        @click.stop="goHome"
        style="--tool-color: #22c55e"
      >
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      <!-- Separator -->
      <div class="dock-separator"></div>

      <!-- Tool Items -->
      <button
        v-for="(tool, index) in tools"
        :key="tool.path"
        class="dock-item"
        :class="{
          'is-active': isActive(tool.path),
          'submenu-open': activeSubmenuIndex === index
        }"
        :style="{ '--tool-color': tool.color, '--delay': `${index * 30}ms` }"
        @click.stop="handleToolClick(tool, index)"
      >
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
        </svg>
        <!-- Submenu indicator -->
        <div v-if="tool.hasSubmenu" class="submenu-indicator"></div>
      </button>
    </div>
  </div>
</template>

