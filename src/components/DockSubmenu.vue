<script setup>
import { ref, computed, watch } from 'vue'
import BentoGrid from './BentoGrid.vue'

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

const emit = defineEmits(['mouseenter', 'mouseleave', 'item-click'])

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
  if (item.children && item.children.length > 0) {
    selectedCategory.value = item
    return
  }
  emit('item-click', item)
}

const goBack = () => {
  selectedCategory.value = null
}
</script>

<template>
  <Transition name="submenu">
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
      <div class="submenu-arrow"></div>
    </div>
  </Transition>
</template>

<style scoped>
/* Dark mode (default, same as MobileDock) */
.dock-submenu {
  position: absolute;
  bottom: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  border-radius: 20px;
  z-index: 50;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 0.5px rgba(255, 255, 255, 0.08);
}

.dock-submenu::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
}

/* Light mode */
:global(html:not(.dark)) .dock-submenu {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark)) .dock-submenu::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
}

/* Hide extra glass layers - not needed with new approach */
.submenu-glass-filter,
.submenu-glass-overlay,
.submenu-glass-specular {
  display: none;
}

/* Content layer */
.submenu-content {
  position: relative;
  padding: 16px;
  z-index: 4;
}

.submenu-content.has-nested {
  min-width: 412px;
  min-height: 308px;
}

/* Header with back button - Dark mode (default) */
.submenu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

:global(html:not(.dark)) .submenu-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

/* Back button - Dark mode (default) */
.submenu-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.submenu-back:hover {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

/* Back button - Light mode */
:global(html:not(.dark)) .submenu-back {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark)) .submenu-back:hover {
  background: rgba(0, 0, 0, 0.1);
  color: black;
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

/* Down arrow pointing to dock - Dark mode (default) */
.submenu-arrow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.08);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Light mode */
:global(html:not(.dark)) .submenu-arrow {
  border-top-color: rgba(255, 255, 255, 0.85);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
</style>
