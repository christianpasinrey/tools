<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDevice } from '../composables/useDevice'

const { isMobile } = useDevice()

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

const emit = defineEmits(['mouseenter', 'mouseleave', 'submenu-enter', 'submenu-leave', 'submenu-toggle'])

const route = useRoute()
const router = useRouter()

// Check if this button is active (handles hash routes)
const isActive = computed(() => {
  // For hash routes like /documents#pdf
  if (props.path.includes('#')) {
    const [path, hash] = props.path.split('#')
    return route.path === path && route.hash === `#${hash}`
  }
  // For paths without hash, check if we're on that base path (including with hash)
  // e.g. /cheatsheets is active when on /cheatsheets#macos
  return route.path === props.path || route.path.startsWith(props.path + '/')
})

const handleMouseEnter = () => {
  // En móvil no hacemos nada con hover
  if (isMobile.value) return
  emit('mouseenter')
  if (props.hasSubmenu) {
    emit('submenu-enter')
  }
}

const handleMouseLeave = () => {
  // En móvil no hacemos nada con hover
  if (isMobile.value) return
  emit('mouseleave')
  if (props.hasSubmenu) {
    emit('submenu-leave')
  }
}

// Handle click on submenu button
const handleClick = (e) => {
  if (props.hasSubmenu) {
    // En móvil, hacer toggle del submenu sin navegar
    if (isMobile.value) {
      e.preventDefault()
      emit('submenu-toggle')
      return
    }
    // En desktop, navegar al path
    if (props.path) {
      router.push(props.path)
    }
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
    @click="handleClick"
  >
    <div class="dock-icon">
      <svg 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style="width: 20px; height: 20px;"
      >
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
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Dock Icon - Dark mode (default, same as MobileDock) */
.dock-icon {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s ease;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);
}

.dock-icon::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
}

.dock-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  filter:
    drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

.dock-item:hover .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.dock-item.is-active .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 16px color-mix(in srgb, var(--tool-color, #22c55e) 25%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.dock-item.submenu-open .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 60%, rgba(255, 255, 255, 0.2));
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 40%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

/* Dock Icon - Light mode */
:global(html:not(.dark)) .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.75) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark)) .dock-icon::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
}

:global(html:not(.dark)) .dock-icon svg {
  filter:
    drop-shadow(0 0 1px rgba(0, 0, 0, 0.15))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.08));
}

:global(html:not(.dark)) .dock-item:hover .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border-color: rgba(0, 0, 0, 0.12);
  color: var(--tool-color, #22c55e) !important;
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 25%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

:global(html:not(.dark)) .dock-item.is-active .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 40%, rgba(0, 0, 0, 0.1));
  color: var(--tool-color, #22c55e) !important;
}

:global(html:not(.dark)) .dock-item.submenu-open .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 255, 255, 0.92) 100%
  );
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 50%, rgba(0, 0, 0, 0.1));
  color: var(--tool-color, #22c55e) !important;
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

/* Tooltip with liquid glass effect - Dark mode (default) */
.dock-tooltip {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 0.5px rgba(255, 255, 255, 0.08);
}

.dock-tooltip::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
}

.dock-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.08);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Tooltip - Light mode */
:global(html:not(.dark)) .dock-tooltip {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.8);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark)) .dock-tooltip::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
}

:global(html:not(.dark)) .dock-tooltip::after {
  border-top-color: rgba(255, 255, 255, 0.85);
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
