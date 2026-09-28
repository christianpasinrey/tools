<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import Icon from '../icons/Icon.vue'
import { sectionTools } from '@/config/catalog'
import { currentHash, goToSectionTool } from '@/lib/sectionHash'
import { useDevice } from '@/composables/useDevice'

const props = defineProps({ category: { type: Object, required: true } })
const router = useRouter()
const { isMobile } = useDevice()
const open = ref(false)
const root = ref(null)
const tools = computed(() => sectionTools(props.category.id))
const activeTool = computed(() => tools.value.find(t => `#${t.hash}` === currentHash.value) || tools.value[0])

onClickOutside(root, () => { open.value = false })
onKeyStroke('Escape', () => { open.value = false })

function choose(tool) {
  if (isMobile.value && !tool.mobile) return
  open.value = false
  goToSectionTool(router, props.category.path, tool.hash)
}
</script>

<template>
  <div ref="root" class="relative" data-test="section-menu" :style="{ '--cat': `var(--cat-${category.id})` }">
    <button type="button" class="flex items-center gap-2 h-8 pl-2 pr-1.5 min-w-0 max-w-[60vw] rounded-lg text-sm font-medium whitespace-nowrap hover:bg-tb-surface-2 transition-colors"
            :aria-expanded="open" aria-haspopup="menu" :disabled="!tools.length" @click="open = !open">
      <span class="w-2 h-2 rounded-full" style="background: var(--cat)"></span>
      <span>{{ category.name }}</span>
      <template v-if="activeTool">
        <span class="text-tb-muted truncate">/ {{ activeTool.short }}</span>
        <Icon name="chevron-down" :size="14" class="text-tb-muted transition-transform duration-200" :class="open && 'rotate-180'" />
      </template>
    </button>
    <Transition name="tb-pop">
      <div v-if="open" role="menu" class="absolute left-0 top-10 w-64 p-1.5 rounded-xl border border-tb-line bg-tb-surface shadow-[var(--tb-shadow-lift)] z-50">
        <button v-for="tool in tools" :key="tool.hash" type="button" role="menuitem"
                :aria-disabled="isMobile && !tool.mobile" :aria-current="tool === activeTool ? 'page' : undefined"
                class="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-tb-surface-2 aria-disabled:opacity-50"
                @click="choose(tool)">
          <span class="grid place-items-center w-7 h-7 rounded-md shrink-0" style="color: var(--cat); background: color-mix(in srgb, var(--cat) 14%, transparent)">
            <Icon :name="tool.icon" :size="15" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium">{{ tool.name }}</span>
            <span v-if="isMobile && !tool.mobile" class="block text-xs text-tb-muted">Disponible en escritorio</span>
          </span>
          <Icon v-if="tool === activeTool" name="check" :size="15" class="text-tb-muted" />
        </button>
      </div>
    </Transition>
  </div>
</template>
