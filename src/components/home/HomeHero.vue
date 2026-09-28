<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../icons/Icon.vue'
import HeroCluster from './HeroCluster.vue'
import { useTypewriter } from '@/composables/useTypewriter'
import { useRecentTools } from '@/composables/useRecentTools'
import { getEntry, TASKS } from '@/config/catalog'
import { openTool } from '@/lib/openTool'

const query = defineModel({ type: String, default: '' })
const emit = defineEmits(['submit', 'pick-file'])
const router = useRouter()
const { recordVisit } = useRecentTools()

const PHRASES = ['pasar un PDF a Word…', 'recortar una foto…', 'convertir km a millas…', 'sacar el HEX de un color…', 'cortar un audio…', 'crear una factura…', 'probar una API…']
const { text: placeholder, start, stop } = useTypewriter(PHRASES)
onMounted(start)

const CHIPS = ['pdf-to-word', 'image-editor', 'color', 'unit-converter', 'pdf-to-jpg', 'todo'].map(getEntry)
const count = TASKS.length

function onFocus() { stop() }
function onBlur() { if (!query.value) start() }
function onKeydown(e) { if (e.key === 'Enter') emit('submit') }
</script>

<template>
  <section class="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 grid lg:grid-cols-[1.25fr_1fr] gap-10 items-center">
    <div>
      <p class="tb-rise inline-flex items-center gap-2 px-3 py-1 rounded-full border border-tb-line bg-tb-surface/70 font-code text-xs text-tb-muted">
        <span class="w-1.5 h-1.5 rounded-full bg-cat-apps tb-pulse"></span>
        {{ count }} herramientas · gratis · sin registro
      </p>
      <h1 class="tb-rise [animation-delay:80ms] mt-5 font-display font-extrabold tracking-[-0.035em] leading-[0.92] text-[clamp(2.9rem,7.5vw,6.2rem)] text-tb-ink">
        ¿Qué necesitas
        <span class="relative inline-block">
          hacer
          <svg class="tb-scribble absolute left-0 -bottom-2 w-full h-4" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
            <path d="M3 11 C 40 3, 80 3, 110 8 S 170 14, 197 5" fill="none" stroke="var(--tb-accent)" stroke-width="5" stroke-linecap="round" />
          </svg>
        </span>
        hoy?
      </h1>
      <p class="tb-rise [animation-delay:160ms] mt-5 text-lg text-tb-muted max-w-xl">
        Convierte, edita y crea sin instalar nada. Todo se procesa en tu navegador: tus archivos no salen de tu equipo.
      </p>

      <div class="tb-rise [animation-delay:240ms] mt-8 relative max-w-xl">
        <label for="tb-hero-search" class="sr-only">Buscar herramienta</label>
        <Icon name="search" :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-tb-muted pointer-events-none" />
        <input id="tb-hero-search" v-model="query" type="search" autocomplete="off" spellcheck="false"
               :placeholder="`Quiero ${placeholder}`"
               class="tb-hero-input tb-bare-input w-full h-16 pl-14 pr-28 rounded-2xl border border-tb-line-strong bg-tb-surface text-lg text-tb-ink placeholder:text-tb-muted shadow-[var(--tb-shadow)] outline-none focus:border-tb-accent transition-[border-color,box-shadow]"
               @focus="onFocus" @blur="onBlur" @keydown="onKeydown" />
        <kbd class="tb-kbd absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline">/ para buscar</kbd>
      </div>

      <div class="tb-rise [animation-delay:320ms] mt-4 flex flex-wrap items-center gap-2">
        <button v-for="entry in CHIPS" :key="entry.id" type="button"
                class="tb-chip" :style="{ '--cat': `var(--cat-${entry.category})` }"
                @click="openTool(router, entry, { recordVisit })">{{ entry.name }}</button>
        <button type="button" class="tb-chip tb-chip-ghost" @click="emit('pick-file')">
          <Icon name="upload" :size="15" /> o suelta un archivo
        </button>
      </div>
    </div>
    <div class="hidden lg:flex justify-center">
      <HeroCluster />
    </div>
  </section>
</template>
