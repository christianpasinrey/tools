<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../icons/Icon.vue'
import { getCategory } from '@/config/catalog'
import { useRecentTools } from '@/composables/useRecentTools'
import { useDevice } from '@/composables/useDevice'
import { openTool } from '@/lib/openTool'

const router = useRouter()
const { recent, favorites, recordVisit, isFavorite } = useRecentTools()
const { isMobile } = useDevice()
const items = computed(() => {
  const seen = new Set()
  return [...favorites.value, ...recent.value].filter(e => !seen.has(e.id) && seen.add(e.id)).slice(0, 8)
})
</script>

<template>
  <section v-if="items.length" class="max-w-6xl mx-auto px-4 sm:px-6 pb-2" aria-labelledby="tb-recent-title">
    <h2 id="tb-recent-title" class="font-code text-xs uppercase tracking-[0.14em] text-tb-muted mb-3">Continúa donde lo dejaste</h2>
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      <button v-for="entry in items" :key="entry.id" type="button" data-test="recent-chip"
              class="tb-chip snap-start shrink-0" :style="{ '--cat': `var(--cat-${entry.category})` }"
              :aria-disabled="isMobile && !entry.mobile" :title="isMobile && !entry.mobile ? 'Disponible en escritorio' : undefined"
              @click="openTool(router, entry, { recordVisit })">
        <Icon v-if="isFavorite(entry.id)" name="star" :size="14" class="text-[#f59f00]" />
        <Icon v-else :name="getCategory(entry.category).icon" :size="14" style="color: var(--cat)" />
        {{ entry.name }}
      </button>
    </div>
  </section>
</template>
