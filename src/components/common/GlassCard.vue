<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: true
  },
  padding: {
    type: String,
    default: 'p-4'
  },
  rounded: {
    type: String,
    default: 'rounded-2xl'
  },
  accentColor: {
    type: String,
    default: null
  }
})
</script>

<template>
  <div
    class="glass-card"
    :class="[
      padding,
      rounded,
      { 'glass-card-hover': hover }
    ]"
    :style="accentColor ? { '--accent-color': accentColor } : {}"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Dark mode (default) - exactamente igual que MobileDock */
.glass-card {
  position: relative;
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
    0 4px 20px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px rgba(255, 255, 255, 0.08);
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
  pointer-events: none;
}

.glass-card-hover {
  transition: all 0.2s ease;
}

.glass-card-hover:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.25),
    0 0 0 0.5px rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}
</style>

<!-- Light mode (sin scoped) -->
<style>
html:not(.dark) .glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  ) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 0 0 0.5px rgba(0, 0, 0, 0.05) !important;
}

html:not(.dark) .glass-card::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent) !important;
}

html:not(.dark) .glass-card-hover:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  ) !important;
  border-color: rgba(0, 0, 0, 0.12) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 0 0.5px rgba(0, 0, 0, 0.08) !important;
}
</style>
