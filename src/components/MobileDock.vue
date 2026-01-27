<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MobileDockSubmenu from './MobileDockSubmenu.vue'

const route = useRoute()
const router = useRouter()

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

    <!-- Toggle Button -->
    <button
      class="dock-toggle"
      @click.stop="toggleDock"
      :class="{ active: isExpanded }"
    >
      <svg
        class="toggle-icon"
        :class="{ rotated: isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          v-if="!isExpanded"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M4 6h16M4 12h16M4 18h16"
        />
        <path
          v-else
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

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

<style scoped>
.mobile-dock {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.mobile-dock.expanded {
  align-items: flex-start;
}

/* Toggle Button */
.dock-toggle {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);
  z-index: 2;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  order: 1;
}

.dock-toggle::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 50%;
  transition: all 0.35s ease;
}

.dock-toggle:active {
  transform: scale(0.95);
}

/* When expanded: move toggle below as full-width tab */
.dock-toggle.active {
  order: 2;
  width: 100%;
  height: 32px;
  border-radius: 0 0 14px 14px;
  margin-top: -1px;
  border-top-color: transparent;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 -1px 1px rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.15);
  color: rgba(255, 255, 255, 0.5);
}

.dock-toggle.active::before {
  opacity: 0;
}

.dock-toggle.active svg {
  width: 18px;
  height: 18px;
}

.toggle-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

/* Expandable Items Container */
.dock-items {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  order: 1;

  /* Hidden by default */
  max-width: 0;
  max-height: 0;
  padding: 0;
  opacity: 0;
  overflow: hidden;
  transform: scale(0.9) translateY(10px);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;

  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px rgba(255, 255, 255, 0.08);
}

.dock-items.visible {
  max-width: 500px;
  max-height: 60px;
  padding: 8px 12px;
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
  border-radius: 14px 14px 0 0;
  border-bottom-color: transparent;
}

/* Dock Item */
.dock-item {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);

  /* Stagger animation */
  opacity: 0;
  transform: scale(0.8) translateX(-10px);
}

.dock-item::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 50%;
}

.dock-items.visible .dock-item {
  opacity: 1;
  transform: scale(1) translateX(0);
  transition-delay: var(--delay, 0ms);
}

.dock-item:active {
  transform: scale(0.92);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
}

.dock-item.is-active {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--tool-color);
}

.dock-item.submenu-open {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.dock-item svg,
.dock-toggle svg {
  filter:
    drop-shadow(0 0 1px rgba(0, 0, 0, 0.6))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
}

/* Submenu indicator dot */
.submenu-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.dock-item.is-active .submenu-indicator {
  background: var(--tool-color);
}

/* Separator */
.dock-separator {
  width: 1px;
  height: 28px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.2) 80%,
    transparent
  );
  margin: 0 4px;
  flex-shrink: 0;

  opacity: 0;
}

.dock-items.visible .dock-separator {
  opacity: 1;
  transition-delay: 50ms;
}
</style>
