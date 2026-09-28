<script setup>
import { ref, nextTick } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import Icon from '../icons/Icon.vue'

defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: null },
  items: { type: Array, required: true },
  align: { type: String, default: 'start' },
  iconOnly: Boolean
})
const open = ref(false)
const root = ref(null)
const menu = ref(null)
const trigger = ref(null)

onClickOutside(root, () => { open.value = false })
onKeyStroke('Escape', () => {
  if (!open.value) return
  open.value = false
  trigger.value?.focus()
})
// Cerrar si el foco sale del menú (Tab), no solo con el puntero
function onFocusOut(e) {
  if (open.value && !root.value?.contains(e.relatedTarget)) open.value = false
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    menu.value?.querySelector('[role="menuitem"]:not([disabled])')?.focus()
  }
}
function run(item) {
  if (item.disabled) return
  open.value = false
  item.action()
}
function onKeydown(e) {
  const els = [...(menu.value?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])]
  const i = els.indexOf(document.activeElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus() }
  if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus() }
}
</script>

<template>
  <div ref="root" class="relative inline-flex tb-ui" @focusout="onFocusOut">
    <button ref="trigger" type="button" :class="iconOnly ? 'tb-icon-btn tb-icon-btn-md' : 'tb-btn tb-btn-ghost tb-btn-sm'"
            aria-haspopup="menu" :aria-expanded="open" :aria-label="iconOnly ? label : undefined" :title="iconOnly ? label : undefined"
            @click="toggle">
      <Icon v-if="icon" :name="icon" :size="16" />
      <span v-if="!iconOnly">{{ label }}</span>
      <Icon v-if="!iconOnly" name="chevron-down" :size="14" />
    </button>
    <Transition name="tb-pop">
      <div v-if="open" ref="menu" role="menu" class="tb-menu" :class="align === 'end' ? 'right-0' : 'left-0'" @keydown="onKeydown">
        <button v-for="item in items" :key="item.label" type="button" role="menuitem" class="tb-menu-item"
                :class="item.tone === 'danger' && 'tb-menu-item-danger'" :disabled="item.disabled" @click="run(item)">
          <Icon v-if="item.icon" :name="item.icon" :size="15" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
