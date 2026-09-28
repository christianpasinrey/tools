<script setup>
import Icon from '../icons/Icon.vue'

defineProps({
  page: { type: Object, required: true },
  index: { type: Number, required: true },
  active: Boolean,
  checked: Boolean,
  dragOver: Boolean,
  dragging: Boolean
})
defineEmits(['select', 'toggle'])
</script>

<template>
  <div class="pdf-thumb" :class="{ 'is-selected': active, 'is-drop-target': dragOver, 'opacity-50': dragging }">
    <button type="button" class="block w-full rounded-lg overflow-hidden bg-white aspect-[3/4]"
            :aria-label="`Ver página ${index + 1}`" :aria-current="active ? 'page' : undefined" @click="$emit('select')">
      <img :src="page.thumbnail" alt="" class="w-full h-full object-contain" :style="{ transform: `rotate(${page.rotation}deg)` }" />
    </button>
    <button type="button" class="pdf-thumb-check" :aria-pressed="String(checked)"
            :aria-label="`Seleccionar página ${index + 1}`" @click.stop="$emit('toggle')">
      <Icon v-if="checked" name="check" :size="12" :stroke-width="3" />
    </button>
    <span v-if="page.rotation" class="absolute top-1.5 right-1.5 px-1.5 rounded-md text-[10px] font-code bg-tb-surface text-tb-ink shadow">{{ page.rotation }}°</span>
    <span class="block mt-1 text-center text-xs font-code" :class="active ? 'text-[var(--cat)] font-semibold' : 'text-tb-muted'">{{ index + 1 }}</span>
  </div>
</template>

<style scoped>
.pdf-thumb { position: relative; cursor: grab; }
.pdf-thumb > button:first-child { box-shadow: 0 0 0 1px var(--tb-line); transition: box-shadow .15s; }
.pdf-thumb:hover > button:first-child { box-shadow: 0 0 0 1px var(--tb-line-strong), var(--tb-shadow, 0 2px 6px rgb(0 0 0 / .08)); }
.pdf-thumb.is-selected > button:first-child { outline: 2px solid var(--cat); outline-offset: 2px; }
.pdf-thumb.is-drop-target > button:first-child { outline: 2px dashed var(--cat); outline-offset: 2px; }
.pdf-thumb-check {
  position: absolute; top: 6px; left: 6px; display: grid; place-items: center;
  width: 20px; height: 20px; border-radius: 6px; color: #fff;
  border: 1.5px solid rgb(0 0 0 / .35); background: rgb(255 255 255 / .85);
}
.pdf-thumb-check[aria-pressed="true"] { background: var(--cat); border-color: var(--cat); }
html.dark .pdf-thumb-check[aria-pressed="true"] { color: var(--tb-bg); }
</style>
