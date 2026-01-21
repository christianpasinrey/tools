<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
    // Each item: { path?, name, icon, color, description?, onClick? }
  },
  color: {
    type: String,
    default: '#22c55e'
  },
  columns: {
    type: Number,
    default: 3
  },
  gap: {
    type: String,
    default: '8px'
  },
  // Layout pattern: 'auto' | 'uniform' | custom array like ['wide', 'tall', 'compact']
  layout: {
    type: [String, Array],
    default: 'auto'
  },
  // Whether items are links or just clickable divs
  linkable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['item-click'])

const router = useRouter()
const route = useRoute()

// Determine item layout class based on index and layout prop
const getItemLayout = (index) => {
  if (Array.isArray(props.layout)) {
    return props.layout[index] || 'default'
  }

  if (props.layout === 'uniform') {
    return 'default'
  }

  // Auto layout pattern for 3 items
  if (props.items.length === 3) {
    const patterns = ['wide', 'tall', 'compact']
    return patterns[index] || 'default'
  }

  // Auto layout pattern for 4 items - asymmetric puzzle
  if (props.items.length === 4) {
    const patterns = ['wide', 'tall', 'default', 'default']
    return patterns[index] || 'default'
  }

  // Auto layout pattern for 2 items
  if (props.items.length === 2) {
    return 'default'
  }

  return 'default'
}

const handleItemClick = (e, item, index) => {
  // Check if this is a hash navigation on the same base path
  if (item.path && item.path.includes('#')) {
    const [basePath, hash] = item.path.split('#')

    if (route.path === basePath || route.path === basePath + '/') {
      e.preventDefault()
      window.location.hash = hash
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }

  // Call custom onClick if provided
  if (item.onClick) {
    item.onClick(item, index)
  }

  emit('item-click', { item, index, event: e })
}

const gridStyle = computed(() => ({
  '--bento-columns': props.columns,
  '--bento-gap': props.gap
}))
</script>

<template>
  <div class="bento-grid" :style="gridStyle">
    <component
      :is="linkable && item.path ? 'router-link' : 'div'"
      v-for="(item, index) in items"
      :key="item.path || item.name || index"
      :to="linkable && item.path ? item.path : undefined"
      class="bento-item"
      :class="[`bento-${getItemLayout(index)}`]"
      :style="{ '--item-color': item.color || color }"
      @click="handleItemClick($event, item, index)"
    >
      <!-- Decorative corner glow -->
      <div class="bento-corner"></div>

      <!-- Icon container -->
      <div v-if="item.icon" class="bento-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
        </svg>
      </div>

      <!-- Slot for custom icon -->
      <slot name="icon" :item="item" :index="index"></slot>

      <!-- Content -->
      <div class="bento-content">
        <span class="bento-name">{{ item.name }}</span>
        <span v-if="item.description" class="bento-description">{{ item.description }}</span>
      </div>

      <!-- Slot for extra content -->
      <slot name="extra" :item="item" :index="index"></slot>

      <!-- Hover glow effect -->
      <div class="bento-glow"></div>
    </component>
  </div>
</template>

<style scoped>
/* Bento Grid Container */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(var(--bento-columns, 3), 1fr);
  gap: var(--bento-gap, 8px);
  min-width: 320px;
}

/* Bento Item - Base */
.bento-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 14px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
  cursor: pointer;
}

/* Layout: Wide - spans 2 columns, horizontal layout */
.bento-wide {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}

.bento-wide .bento-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.bento-wide .bento-icon svg {
  width: 26px;
  height: 26px;
}

.bento-wide .bento-content {
  flex: 1;
  margin-top: 0;
}

.bento-wide .bento-name {
  font-size: 15px;
}

/* Layout: Tall - spans 2 rows */
.bento-tall {
  grid-row: span 2;
  justify-content: space-between;
}

.bento-tall .bento-icon {
  width: 56px;
  height: 56px;
}

.bento-tall .bento-icon svg {
  width: 28px;
  height: 28px;
}

.bento-tall .bento-content {
  margin-top: auto;
}

.bento-tall .bento-name {
  margin-bottom: 4px;
}

/* Layout: Compact - smaller, horizontal */
.bento-compact {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.bento-compact .bento-icon {
  width: 36px;
  height: 36px;
}

.bento-compact .bento-icon svg {
  width: 18px;
  height: 18px;
}

.bento-compact .bento-content {
  margin-top: 0;
}

/* Layout: Featured - large, spans full width */
.bento-featured {
  grid-column: span 3;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.bento-featured .bento-icon {
  width: 56px;
  height: 56px;
}

.bento-featured .bento-icon svg {
  width: 30px;
  height: 30px;
}

.bento-featured .bento-content {
  margin-top: 0;
}

.bento-featured .bento-name {
  font-size: 17px;
}

/* Layout: Default - standard square */
.bento-default {
  /* Uses base styles */
}

/* Hover states */
.bento-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: color-mix(in srgb, var(--item-color, #22c55e) 40%, transparent);
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px color-mix(in srgb, var(--item-color, #22c55e) 20%, transparent);
}

.bento-item:hover .bento-icon {
  background: color-mix(in srgb, var(--item-color, #22c55e) 20%, transparent);
  border-color: color-mix(in srgb, var(--item-color, #22c55e) 40%, transparent);
  color: var(--item-color, #22c55e);
  box-shadow: 0 0 20px color-mix(in srgb, var(--item-color, #22c55e) 30%, transparent);
}

.bento-item:hover .bento-glow {
  opacity: 1;
}

.bento-item:hover .bento-corner {
  opacity: 1;
  transform: scale(1);
}

/* Decorative corner */
.bento-corner {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 60px;
  height: 60px;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--item-color, #22c55e) 30%, transparent) 0%,
    transparent 70%
  );
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.4s ease;
  pointer-events: none;
}

/* Icon container */
.bento-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.bento-icon svg {
  width: 20px;
  height: 20px;
}

/* Content */
.bento-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
}

.bento-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.bento-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.3;
}

/* Hover glow effect */
.bento-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    color-mix(in srgb, var(--item-color, #22c55e) 10%, transparent) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: inherit;
}

/* Responsive */
@media (max-width: 768px) {
  .bento-grid {
    min-width: 280px;
    gap: 6px;
  }

  .bento-item {
    padding: 12px;
  }

  .bento-wide {
    padding: 14px;
  }

  .bento-wide .bento-icon {
    width: 40px;
    height: 40px;
  }

  .bento-wide .bento-icon svg {
    width: 22px;
    height: 22px;
  }

  .bento-icon {
    width: 32px;
    height: 32px;
  }

  .bento-icon svg {
    width: 16px;
    height: 16px;
  }

  .bento-name {
    font-size: 12px;
  }

  .bento-description {
    font-size: 10px;
  }
}

@media (max-width: 400px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    min-width: 220px;
  }

  .bento-wide,
  .bento-compact,
  .bento-featured {
    grid-column: span 2;
  }

  .bento-tall {
    grid-row: auto;
  }

  .bento-tall .bento-description {
    display: none;
  }
}
</style>
