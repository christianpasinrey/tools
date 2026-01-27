<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  color: { type: String, default: '#22c55e' },
  allSections: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: -1 }
})

const emit = defineEmits(['close', 'item-click', 'navigate-section'])

const selectedCategory = ref(null)

watch(() => props.visible, (visible) => {
  if (!visible) {
    // Delay reset to allow transition
    setTimeout(() => {
      if (!props.visible) selectedCategory.value = null
    }, 300)
  }
})

// Reset selectedCategory when section changes
watch(() => props.currentIndex, () => {
  selectedCategory.value = null
})

const currentItems = computed(() => {
  if (selectedCategory.value) return selectedCategory.value.children || []
  return props.items
})

const currentTitle = computed(() => {
  if (selectedCategory.value) return selectedCategory.value.name
  return props.title
})

const currentColor = computed(() => {
  if (selectedCategory.value) return selectedCategory.value.color || props.color
  return props.color
})

const goBack = () => {
  selectedCategory.value = null
}

// Navigation between sections
const prevSection = computed(() => {
  if (props.currentIndex <= 0 || !props.allSections.length) return null
  for (let i = props.currentIndex - 1; i >= 0; i--) {
    if (props.allSections[i].hasSubmenu) return { section: props.allSections[i], index: i }
  }
  return null
})

const nextSection = computed(() => {
  if (props.currentIndex < 0 || !props.allSections.length) return null
  for (let i = props.currentIndex + 1; i < props.allSections.length; i++) {
    if (props.allSections[i].hasSubmenu) return { section: props.allSections[i], index: i }
  }
  return null
})

const goToPrevSection = () => {
  if (prevSection.value) {
    selectedCategory.value = null
    emit('navigate-section', prevSection.value.index)
  }
}

const goToNextSection = () => {
  if (nextSection.value) {
    selectedCategory.value = null
    emit('navigate-section', nextSection.value.index)
  }
}

const handleItemClick = (e, item) => {
  // Si tiene children, prevenir navegación y mostrar subcategoría
  if (item.children && item.children.length > 0) {
    e.preventDefault()
    selectedCategory.value = item
    return
  }
  // Si tiene path, cerrar el menú (la navegación la hace router-link)
  if (item.path) {
    emit('close')
    emit('item-click', { item })
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="mobile-menu">
      <div
        v-if="visible"
        class="mobile-dock-submenu fixed inset-0 z-[9999] bg-neutral-950"
        style="height: 100dvh;"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900">
          <button
            v-if="selectedCategory"
            @click="goBack"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 active:bg-neutral-700"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div v-else class="w-10 h-10"></div>

          <h2 class="text-base font-semibold uppercase tracking-wider" :style="{ color: currentColor }">
            {{ currentTitle }}
          </h2>

          <button
            @click="emit('close')"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 active:bg-neutral-700"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Items List -->
        <div class="flex-1 overflow-y-auto" style="height: calc(100dvh - 64px - 72px);">
          <div class="py-2">
            <component
              :is="item.path ? 'router-link' : 'div'"
              v-for="(item, index) in currentItems"
              :key="item.path || item.name || index"
              :to="item.path || undefined"
              @click="handleItemClick($event, item)"
              class="flex items-center gap-4 px-5 py-4 active:bg-neutral-800/50"
            >
              <!-- Icon -->
              <div
                class="w-12 h-12 flex items-center justify-center rounded-xl"
                :style="{
                  backgroundColor: `color-mix(in srgb, ${item.color || currentColor} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${item.color || currentColor} 30%, transparent)`
                }"
              >
                <svg
                  v-if="item.icon"
                  class="w-6 h-6"
                  :style="{ color: item.color || currentColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
                </svg>
                <div
                  v-else
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: item.color || currentColor }"
                ></div>
              </div>

              <!-- Text -->
              <div class="flex-1 min-w-0">
                <p class="text-white font-medium">{{ item.name }}</p>
                <p v-if="item.description" class="text-sm text-neutral-500 truncate">{{ item.description }}</p>
              </div>

              <!-- Chevron -->
              <svg
                v-if="item.children && item.children.length > 0"
                class="w-5 h-5 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </component>
          </div>
        </div>

        <!-- Navigation Footer -->
        <div
          v-if="prevSection || nextSection"
          class="fixed bottom-0 left-0 right-0 h-[72px] bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-4 gap-3"
        >
          <button
            v-if="prevSection"
            @click="goToPrevSection"
            class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-neutral-800 active:bg-neutral-700 transition-colors"
          >
            <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="text-sm font-medium" :style="{ color: prevSection.section.color }">
              {{ prevSection.section.name }}
            </span>
          </button>
          <div v-else class="flex-1"></div>

          <button
            v-if="nextSection"
            @click="goToNextSection"
            class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-neutral-800 active:bg-neutral-700 transition-colors"
          >
            <span class="text-sm font-medium" :style="{ color: nextSection.section.color }">
              {{ nextSection.section.name }}
            </span>
            <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div v-else class="flex-1"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.2s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}
</style>
