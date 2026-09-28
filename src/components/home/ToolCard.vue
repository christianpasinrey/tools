<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import Icon from '../icons/Icon.vue'
import { getPreview } from './previews'
import { getCategory } from '@/config/catalog'
import { useRecentTools } from '@/composables/useRecentTools'
import { useDevice } from '@/composables/useDevice'
import { openTool } from '@/lib/openTool'

const props = defineProps({ entry: { type: Object, required: true }, size: { type: String, default: 'md' } })
const router = useRouter()
const { recordVisit, toggleFavorite, isFavorite } = useRecentTools()
const { isMobile } = useDevice()

const root = ref(null)
const visible = ref(false)
const hovered = ref(false)
useIntersectionObserver(root, ([e]) => { visible.value = !!e?.isIntersecting }, { threshold: 0.25 })

const preview = computed(() => getPreview(props.entry.preview))
const category = computed(() => getCategory(props.entry.category))
const unavailable = computed(() => isMobile.value && !props.entry.mobile)
const favorite = computed(() => isFavorite(props.entry.id))

function open() {
  if (unavailable.value) return
  openTool(router, props.entry, { sourceEl: root.value, recordVisit })
}

function onPointerMove(e) {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  el.style.setProperty('--px', ((e.clientX - r.left) / r.width).toFixed(3))
  el.style.setProperty('--py', ((e.clientY - r.top) / r.height).toFixed(3))
}
</script>

<template>
  <article ref="root" data-test="tool-card" class="tb-card tb-motion group"
           :class="[`tb-card-${size}`, unavailable && 'is-unavailable']"
           :style="{ '--cat': `var(--cat-${entry.category})` }"
           @pointermove="onPointerMove" @pointerenter="hovered = true" @pointerleave="hovered = false">
    <div class="tb-card-preview" aria-hidden="true">
      <component :is="preview" :active="visible || hovered" :entry="entry" />
    </div>
    <div class="tb-card-body">
      <p class="tb-card-cat"><Icon :name="category.icon" :size="13" /> {{ category.name }}</p>
      <h3 class="font-display">{{ entry.name }}</h3>
      <p class="tb-card-task">{{ unavailable ? 'Disponible en escritorio' : entry.task }}</p>
    </div>
    <span v-if="!entry.mobile" class="tb-card-badge" title="Pensada para pantalla grande"><Icon name="monitor" :size="12" /> Escritorio</span>
    <button type="button" data-test="open" class="tb-card-open" :aria-disabled="unavailable"
            :aria-label="unavailable ? `${entry.name}: disponible en escritorio` : `Abrir ${entry.name}`" @click="open"></button>
    <button type="button" class="tb-card-fav" :aria-pressed="favorite"
            :aria-label="favorite ? `Quitar ${entry.name} de favoritos` : `Añadir ${entry.name} a favoritos`"
            @click.stop="toggleFavorite(entry.id)">
      <Icon name="star" :size="16" :class="favorite && 'is-on'" />
    </button>
  </article>
</template>
