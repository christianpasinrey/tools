<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import Icon from '../icons/Icon.vue'
import { benchTasks } from '@/config/catalog'
import { useRecentTools } from '@/composables/useRecentTools'
import { useDevice } from '@/composables/useDevice'
import { openTool } from '@/lib/openTool'

const props = defineProps({ category: { type: Object, required: true } })
const router = useRouter()
const { recordVisit } = useRecentTools()
const { isMobile } = useDevice()
const open = ref(false)
const root = ref(null)
const items = computed(() => benchTasks(props.category.id))

onClickOutside(root, () => { open.value = false })
onKeyStroke('Escape', () => { open.value = false })

function choose(entry) {
  open.value = false
  openTool(router, entry, { recordVisit })
}
</script>

<template>
  <div ref="root" class="relative" data-test="section-menu" :style="{ '--cat': `var(--cat-${category.id})` }">
    <button type="button" class="flex items-center gap-2 h-8 pl-2 pr-1.5 rounded-lg text-sm font-medium hover:bg-tb-surface-2 transition-colors"
            :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
      <span class="w-2 h-2 rounded-full" style="background: var(--cat)"></span>
      {{ category.name }}
      <Icon name="chevron-down" :size="14" class="text-tb-muted transition-transform duration-200" :class="open && 'rotate-180'" />
    </button>
    <Transition name="tb-pop">
      <div v-if="open" role="menu" class="absolute left-0 top-10 w-80 p-1.5 rounded-xl border border-tb-line bg-tb-surface shadow-[var(--tb-shadow-lift)] z-50">
        <button v-for="entry in items" :key="entry.id" type="button" role="menuitem"
                :disabled="isMobile && !entry.mobile"
                class="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-tb-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="choose(entry)">
          <span class="mt-0.5 grid place-items-center w-7 h-7 rounded-md shrink-0" style="color: var(--cat); background: color-mix(in srgb, var(--cat) 14%, transparent)">
            <Icon :name="category.icon" :size="15" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-medium">{{ entry.name }}</span>
            <span class="block text-xs text-tb-muted">{{ isMobile && !entry.mobile ? 'Disponible en escritorio' : entry.task }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
