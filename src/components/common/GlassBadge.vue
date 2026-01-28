<script setup>
defineProps({
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: null
  }
})
</script>

<template>
  <span class="glass-badge">
    <svg
      v-if="icon"
      class="w-4 h-4 glass-badge-icon"
      :style="color ? { color } : {}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
    </svg>
    <span class="glass-badge-text">
      <slot />
    </span>
  </span>
</template>

<style scoped>
/* Dark mode (default) - igual que MobileDock */
.glass-badge {
  position: relative;
  @apply backdrop-blur-xl;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

.glass-badge-icon {
  color: rgba(255, 255, 255, 0.7);
}

.glass-badge-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}
</style>

<!-- Light mode (sin scoped) -->
<style>
html:not(.dark) .glass-badge {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0.8) 100%
  ) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

html:not(.dark) .glass-badge-icon {
  color: rgba(0, 0, 0, 0.6) !important;
}

html:not(.dark) .glass-badge-text {
  color: rgba(0, 0, 0, 0.85) !important;
}
</style>
