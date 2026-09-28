<script setup>
import { useRouter } from 'vue-router'
import { CATEGORIES, benchTasks, toHref } from '@/config/catalog'
import { useRecentTools } from '@/composables/useRecentTools'
import { openTool } from '@/lib/openTool'

const router = useRouter()
const { recordVisit } = useRecentTools()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-tb-line bg-tb-surface/60">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
      <nav v-for="c in CATEGORIES" :key="c.id" :aria-label="c.name">
        <h2 class="font-display font-bold mb-3" :style="{ color: `var(--cat-${c.id})` }">{{ c.name }}</h2>
        <ul class="space-y-2">
          <li v-for="entry in benchTasks(c.id)" :key="entry.id">
            <a :href="toHref(entry)" class="text-sm text-tb-muted hover:text-tb-ink transition-colors"
               @click.prevent="openTool(router, entry, { recordVisit })">{{ entry.name }}</a>
          </li>
        </ul>
      </nav>
    </div>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-tb-line flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-tb-muted">
      <span class="font-display font-bold text-tb-ink">tools</span>
      <span>© {{ year }} Tailor Bytes</span>
      <router-link to="/acerca" class="hover:text-tb-ink">Acerca y privacidad</router-link>
      <a href="https://github.com/christianpasinrey/tools" target="_blank" rel="noopener noreferrer" class="hover:text-tb-ink">Código en GitHub</a>
    </div>
  </footer>
</template>
