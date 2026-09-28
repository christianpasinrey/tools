<script setup>
import { ref, watch, nextTick } from 'vue'
import TbButton from './TbButton.vue'
import { useConfirmState } from '@/composables/useConfirm'

const { request, settle } = useConfirmState()
const panel = ref(null)
let returnFocus = null

watch(request, async (r) => {
  if (r) {
    returnFocus = document.activeElement
    await nextTick()
    panel.value?.querySelector('[data-autofocus]')?.focus()
  } else if (returnFocus instanceof HTMLElement) {
    returnFocus.focus()
    returnFocus = null
  }
})

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); settle(false); return }
  if (e.key === 'Tab') {
    const els = [...panel.value.querySelectorAll('button')]
    const i = els.indexOf(document.activeElement)
    e.preventDefault()
    els[(i + (e.shiftKey ? -1 : 1) + els.length) % els.length].focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tb-palette">
      <div v-if="request" class="fixed inset-0 z-[260] grid place-items-center p-4 font-ui">
        <div class="tb-palette-backdrop absolute inset-0 bg-black/35 backdrop-blur-[2px]" aria-hidden="true" @click="settle(false)"></div>
        <div ref="panel" role="alertdialog" aria-modal="true" aria-labelledby="tb-confirm-title"
             class="tb-palette-panel relative w-full max-w-sm rounded-2xl border border-tb-line bg-tb-surface text-tb-ink p-5 shadow-[var(--tb-shadow-lift)]"
             @keydown="onKeydown">
          <h2 id="tb-confirm-title" class="font-display text-lg font-bold">{{ request.title }}</h2>
          <p v-if="request.message" class="mt-1.5 text-sm text-tb-muted">{{ request.message }}</p>
          <div class="mt-5 flex justify-end gap-2">
            <TbButton variant="ghost" @click="settle(false)">{{ request.cancelLabel }}</TbButton>
            <TbButton :variant="request.tone === 'danger' ? 'danger' : 'primary'" data-autofocus @click="settle(true)">{{ request.confirmLabel }}</TbButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
