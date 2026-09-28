<script setup>
import { computed } from 'vue'
import Icon from '../icons/Icon.vue'
import ToolCard from './ToolCard.vue'
import { CATEGORIES, TASKS, benchTasks } from '@/config/catalog'
import { searchTools } from '@/lib/toolSearch'

const props = defineProps({ query: { type: String, default: '' } })
const emit = defineEmits(['update:query'])

const searching = computed(() => props.query.trim().length > 0)
const results = computed(() => searching.value
  ? searchTools(props.query, TASKS.filter(t => t.bench !== false)).map(r => r.entry)
  : [])
const SUGGESTIONS = ['pdf', 'imagen', 'color', 'audio', 'factura']
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16" aria-label="Herramientas">
    <template v-if="searching">
      <p class="font-code text-sm text-tb-muted mb-4" aria-live="polite">
        {{ results.length }} {{ results.length === 1 ? 'resultado' : 'resultados' }} para “{{ query }}”
      </p>
      <TransitionGroup v-if="results.length" name="tb-card" tag="div" class="tb-grid">
        <ToolCard v-for="(entry, i) in results" :key="entry.id" :entry="entry" :size="i === 0 ? 'lg' : 'md'" />
      </TransitionGroup>
      <div v-else class="py-16 text-center">
        <p class="font-display text-2xl font-bold">No tengo nada para eso… todavía.</p>
        <p class="mt-2 text-tb-muted">Prueba con:</p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button v-for="s in SUGGESTIONS" :key="s" type="button" data-test="empty-suggestion" class="tb-chip" @click="emit('update:query', s)">{{ s }}</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="c in CATEGORIES" :key="c.id" :id="`cat-${c.id}`" class="tb-category scroll-mt-16" :style="{ '--cat': `var(--cat-${c.id})` }">
        <header class="tb-category-head">
          <span class="tb-category-icon"><Icon :name="c.icon" :size="20" /></span>
          <div>
            <h2 class="font-display">{{ c.name }}</h2>
            <p>{{ c.blurb }}</p>
          </div>
          <span class="tb-category-count font-code">{{ benchTasks(c.id).length }}</span>
        </header>
        <div class="tb-grid">
          <ToolCard v-for="(entry, i) in benchTasks(c.id)" :key="entry.id" :entry="entry" :size="i === 0 ? 'lg' : 'md'" />
        </div>
      </div>
    </template>
  </section>
</template>
