<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  path: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#22c55e'
  },
  scale: {
    type: Number,
    default: 1
  },
  isHovered: {
    type: Boolean,
    default: false
  },
  hasSubmenu: {
    type: Boolean,
    default: false
  },
  submenuOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['mouseenter', 'mouseleave', 'submenu-enter', 'submenu-leave'])

const route = useRoute()

// Check if this button is active (handles hash routes)
const isActive = computed(() => {
  // For hash routes like /documents#pdf
  if (props.path.includes('#')) {
    const [path, hash] = props.path.split('#')
    return route.path === path && route.hash === `#${hash}`
  }
  // For /documents without hash, check if we're on any documents route
  if (props.path === '/documents') {
    return route.path === '/documents'
  }
  return route.path === props.path
})

const handleMouseEnter = () => {
  emit('mouseenter')
  if (props.hasSubmenu) {
    emit('submenu-enter')
  }
}

const handleMouseLeave = () => {
  emit('mouseleave')
  if (props.hasSubmenu) {
    emit('submenu-leave')
  }
}
</script>

<template>
  <component
    :is="hasSubmenu ? 'div' : 'router-link'"
    :to="hasSubmenu ? undefined : path"
    class="dock-item"
    :class="{
      'is-active': isActive,
      'has-submenu': hasSubmenu,
      'submenu-open': submenuOpen
    }"
    :style="{
      '--scale': scale,
      '--tool-color': color
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="dock-icon">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icon" />
      </svg>

    </div>

    <!-- Tooltip (show when hovered and submenu is closed) -->
    <Transition name="tooltip">
      <div v-if="isHovered && !submenuOpen" class="dock-tooltip">
        {{ name }}
      </div>
    </Transition>

    <!-- Active indicator -->
    <div v-if="isActive" class="dock-active-dot"></div>
  </component>
</template>

<style scoped>
/* Dock Item */
.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(var(--scale, 1));
  transform-origin: bottom center;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), z-index 0s;
  z-index: 1;
  will-change: transform;
}

.dock-item:hover {
  z-index: 10;
}

.dock-item.has-submenu {
  cursor: pointer;
}

/* Dock Icon */
.dock-icon {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.dock-item:hover .dock-icon {
  background: rgba(45, 45, 45, 1);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
}

.dock-item.is-active .dock-icon {
  background: color-mix(in srgb, var(--tool-color, #22c55e) 15%, rgba(0, 0, 0, 0.3));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 16px color-mix(in srgb, var(--tool-color, #22c55e) 20%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
}

.dock-item.submenu-open .dock-icon {
  background: rgba(45, 45, 45, 1);
  border-color: var(--tool-color, #22c55e);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 40%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
}

/* Active dot indicator */
.dock-active-dot {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--tool-color, #22c55e);
  box-shadow: 0 0 8px var(--tool-color, #22c55e);
}

/* Tooltip with liquid glass effect */
.dock-tooltip {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 14px;
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 1px 1px 1px rgba(255, 255, 255, 0.2),
    inset -1px -1px 1px rgba(0, 0, 0, 0.2);
}

.dock-tooltip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.dock-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(20, 20, 20, 0.7);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Tooltip transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .dock-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .dock-icon svg {
    width: 18px;
    height: 18px;
  }

  .dock-tooltip {
    display: none;
  }
}

@media (max-width: 480px) {
  .dock-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .dock-icon svg {
    width: 16px;
    height: 16px;
  }

  .dock-active-dot {
    width: 3px;
    height: 3px;
    bottom: -4px;
  }

  .dock-item {
    transform: scale(1) !important;
    transition: transform 0.1s ease;
  }

  .dock-item:active {
    transform: scale(0.9) !important;
  }

  .dock-item:active .dock-icon {
    background: rgba(255, 255, 255, 0.2);
  }
}

@media (max-width: 380px) {
  .dock-icon {
    width: 32px;
    height: 32px;
    border-radius: 7px;
  }

  .dock-icon svg {
    width: 14px;
    height: 14px;
  }

  .dock-active-dot {
    bottom: -3px;
  }
}
</style>
