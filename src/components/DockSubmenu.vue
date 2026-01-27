<script setup>
import { ref, computed, watch } from 'vue'
import BentoGrid from './BentoGrid.vue'
import { useDevice } from '../composables/useDevice'

const { isMobile } = useDevice()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
    // Each item: { path, name, icon, color, description?, children? }
  },
  color: {
    type: String,
    default: '#22c55e'
  },
  layout: {
    type: [String, Array],
    default: 'auto'
  },
  columns: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['mouseenter', 'mouseleave', 'item-click', 'close'])

// State for nested navigation
const selectedCategory = ref(null)

// Reset when submenu closes
watch(() => props.visible, (visible) => {
  if (!visible) {
    selectedCategory.value = null
  }
})

// Current items to display
const currentItems = computed(() => {
  if (selectedCategory.value) {
    return selectedCategory.value.children || []
  }
  return props.items
})

// Current title
const currentTitle = computed(() => {
  if (selectedCategory.value) {
    return selectedCategory.value.name
  }
  return props.title
})

// Current color
const currentColor = computed(() => {
  if (selectedCategory.value) {
    return selectedCategory.value.color || props.color
  }
  return props.color
})

// Check if submenu has nested navigation (items with children)
const hasNestedItems = computed(() => {
  return props.items.some(item => item.children && item.children.length > 0)
})

const handleMouseEnter = () => {
  emit('mouseenter')
}

const handleMouseLeave = () => {
  emit('mouseleave')
}

const handleItemClick = ({ item }) => {
  // If item has children, show them instead of navigating
  if (item.children && item.children.length > 0) {
    selectedCategory.value = item
    return
  }
  emit('item-click', item)
}

const goBack = () => {
  selectedCategory.value = null
}

// Handle mobile item click
const handleMobileItemClick = (e, item) => {
  // Si tiene children, mostrar subcategoría
  if (item.children && item.children.length > 0) {
    e.preventDefault()
    selectedCategory.value = item
    return
  }
  // Si tiene path, cerrar el menú después de navegar
  if (item.path) {
    emit('close')
  }
  emit('item-click', { item })
}
</script>

<template>
  <!-- Desktop: Floating submenu -->
  <Transition v-if="!isMobile" name="submenu">
    <div
      v-if="visible"
      class="dock-submenu"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Liquid Glass Layers -->
      <div class="submenu-glass-filter"></div>
      <div class="submenu-glass-overlay"></div>
      <div class="submenu-glass-specular"></div>

      <!-- Content -->
      <div class="submenu-content" :class="{ 'has-nested': hasNestedItems }">
        <!-- Title with back button -->
        <div v-if="currentTitle" class="submenu-header">
          <button
            v-if="selectedCategory"
            class="submenu-back"
            @click="goBack"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="submenu-title" :style="{ color: currentColor }">
            {{ currentTitle }}
          </div>
        </div>

        <!-- Default slot for custom content -->
        <slot>
          <Transition name="fade" mode="out-in">
            <BentoGrid
              :key="selectedCategory?.name || 'root'"
              :items="currentItems"
              :color="currentColor"
              :layout="selectedCategory ? 'auto' : layout"
              :columns="selectedCategory ? 3 : columns"
              @item-click="handleItemClick"
            />
          </Transition>
        </slot>
      </div>

      <!-- Arrow pointing down to dock -->
      <div class="submenu-arrow" :style="{ borderTopColor: 'rgba(30, 30, 30, 0.95)' }"></div>
    </div>
  </Transition>

  <!-- Mobile: Fullscreen panel -->
  <Transition v-else name="mobile-submenu">
    <div
      v-if="visible"
      class="mobile-submenu-overlay"
      @click.self="emit('close')"
    >
      <div class="mobile-submenu-panel">
        <!-- Header -->
        <div class="mobile-submenu-header">
          <button
            v-if="selectedCategory"
            class="mobile-back-btn"
            @click="goBack"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div v-else class="mobile-back-btn-placeholder"></div>
          <div class="mobile-submenu-title" :style="{ color: currentColor }">
            {{ currentTitle }}
          </div>
          <button
            class="mobile-close-btn"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content: Lista vertical para móvil -->
        <div class="mobile-submenu-content">
          <Transition name="fade" mode="out-in">
            <div :key="selectedCategory?.name || 'root'" class="mobile-items-list">
              <component
                :is="item.path ? 'router-link' : 'div'"
                v-for="(item, index) in currentItems"
                :key="item.path || item.name || index"
                :to="item.path || undefined"
                class="mobile-menu-item"
                :style="{ '--item-color': item.color || currentColor }"
                @click="handleMobileItemClick($event, item)"
              >
                <!-- Icon -->
                <div class="mobile-item-icon">
                  <svg v-if="item.icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
                  </svg>
                  <div v-else class="mobile-item-dot"></div>
                </div>

                <!-- Content -->
                <div class="mobile-item-content">
                  <span class="mobile-item-name">{{ item.name }}</span>
                  <span v-if="item.description" class="mobile-item-desc">{{ item.description }}</span>
                </div>

                <!-- Chevron for categories with children -->
                <svg v-if="item.children" class="mobile-item-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </component>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dock-submenu {
  position: absolute;
  bottom: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  border-radius: 20px;
  z-index: 50;
}

/* Liquid Glass Layers */
.submenu-glass-filter {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  z-index: 1;
}

.submenu-glass-overlay {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 2;
}

.submenu-glass-specular {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.03) 100%
  );
  box-shadow:
    inset 1px 1px 2px rgba(255, 255, 255, 0.3),
    inset 2px 2px 8px rgba(255, 255, 255, 0.1),
    inset -1px -1px 4px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 3;
}

.submenu-glass-specular::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 12px;
  right: 50%;
  height: 16px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(4px);
  opacity: 0.8;
}

/* Content layer */
.submenu-content {
  position: relative;
  padding: 16px;
  z-index: 4;
}

/* Tamaño mínimo solo para submenus con navegación anidada (cheatsheets) */
/* = tamaño de la vista de categorías (12 items small en 3 cols) */
/* BentoGrid 380px + padding 32px = 412px */
/* 4 filas × 52px + 3 gaps × 8px + header 44px + padding 32px = 308px */
.submenu-content.has-nested {
  min-width: 412px;
  min-height: 308px;
}

/* Header with back button */
.submenu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}

/* Back button */
.submenu-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.submenu-back:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Title */
.submenu-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 8px;
}

/* Fade transition for content */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Down arrow pointing to dock */
.submenu-arrow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(30, 30, 30, 0.95);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Transitions */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.95);
}

/* ===== MOBILE FULLSCREEN SUBMENU ===== */
.mobile-submenu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.mobile-submenu-panel {
  width: 100%;
  height: 100dvh;
  background: rgb(15, 15, 15);
  display: flex;
  flex-direction: column;
}

.mobile-submenu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  background: rgba(20, 20, 20, 0.95);
}

.mobile-submenu-title {
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex: 1;
  text-align: center;
}

.mobile-back-btn,
.mobile-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mobile-back-btn-placeholder {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.mobile-back-btn:active,
.mobile-close-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.15);
}

.mobile-submenu-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  padding-bottom: 80px; /* Space for dock */
  -webkit-overflow-scrolling: touch;
}

/* Lista de items móvil */
.mobile-items-list {
  display: flex;
  flex-direction: column;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mobile-menu-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.mobile-item-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--item-color, #22c55e) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--item-color, #22c55e) 25%, transparent);
  flex-shrink: 0;
}

.mobile-item-icon svg {
  width: 22px;
  height: 22px;
  color: var(--item-color, #22c55e);
}

.mobile-item-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--item-color, #22c55e);
}

.mobile-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-item-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}

.mobile-item-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-item-chevron {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

/* Mobile transition */
.mobile-submenu-enter-active,
.mobile-submenu-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-submenu-enter-active .mobile-submenu-panel,
.mobile-submenu-leave-active .mobile-submenu-panel {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-submenu-enter-from,
.mobile-submenu-leave-to {
  opacity: 0;
}

.mobile-submenu-enter-from .mobile-submenu-panel {
  transform: translateY(30px);
}

.mobile-submenu-leave-to .mobile-submenu-panel {
  transform: translateY(30px);
}

/* Responsive - Desktop only styles */
@media (max-width: 768px) {
  .dock-submenu {
    max-width: calc(100vw - 32px);
    border-radius: 16px;
  }

  .submenu-glass-filter,
  .submenu-glass-overlay,
  .submenu-glass-specular {
    border-radius: 16px;
  }

  .submenu-content {
    padding: 12px;
  }

  .submenu-content.has-nested {
    min-width: 304px;
    min-height: 280px;
  }
}

@media (max-width: 480px) {
  .submenu-content.has-nested {
    min-width: 244px;
    min-height: 320px;
  }
}
</style>
