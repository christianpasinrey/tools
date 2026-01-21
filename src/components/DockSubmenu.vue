<script setup>
import { ref } from 'vue'
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
    // Each item: { path, name, icon, color, description? }
  },
  color: {
    type: String,
    default: '#22c55e'
  },
  layout: {
    type: [String, Array],
    default: 'auto'
  }
})

const emit = defineEmits(['mouseenter', 'mouseleave', 'item-click'])

const handleMouseEnter = () => {
  emit('mouseenter')
}

const handleMouseLeave = () => {
  emit('mouseleave')
}

const handleItemClick = ({ item }) => {
  emit('item-click', item)
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
      <div class="submenu-content">
        <!-- Title if provided -->
        <div v-if="title" class="submenu-title" :style="{ color: color }">
          {{ title }}
        </div>

        <!-- Default slot for custom content -->
        <slot>
          <BentoGrid
            :items="items"
            :color="color"
            :layout="layout"
            @item-click="handleItemClick"
          />
        </slot>
      </div>

      <!-- Arrow pointing down to dock -->
      <div class="submenu-arrow" :style="{ borderTopColor: 'rgba(30, 30, 30, 0.95)' }"></div>
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

/* Title */
.submenu-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
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

/* Responsive */
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
}
</style>
