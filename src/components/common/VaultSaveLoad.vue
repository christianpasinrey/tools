<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useVault } from '../../composables/useVault'
import Icon from '../icons/Icon.vue'
import { toast } from '../../composables/useToast'

const props = defineProps({
  storeName: { type: String, required: true },
  getData: { type: Function, required: true },
  label: { type: String, default: '' }
})

const emit = defineEmits(['load'])

const vault = useVault()
const items = ref([])
const showPanel = ref(false)
const showSaveInput = ref(false)
const saveName = ref('')
const saving = ref(false)
const loading = ref(false)
const deleteConfirm = ref(null)

// Refs for positioning teleported popovers
const saveButtonRef = ref(null)
const loadButtonRef = ref(null)
const popoverPos = ref({ top: 0, left: 0 })

function updatePopoverPos(buttonRef) {
  if (!buttonRef) return
  const rect = buttonRef.getBoundingClientRect()
  const popoverWidth = 260
  let left = rect.left
  if (left + popoverWidth > window.innerWidth - 8) {
    left = window.innerWidth - popoverWidth - 8
  }
  popoverPos.value = {
    top: rect.bottom + 4,
    left: Math.max(8, left)
  }
}

async function refreshList() {
  try {
    items.value = await vault.list(props.storeName)
  } catch {
    items.value = []
  }
}

// Refresh list when vault unlocks
watch(() => vault.isLocked.value, (locked) => {
  if (!locked) refreshList()
})

onMounted(() => {
  if (!vault.isLocked.value) refreshList()
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(e) {
  // Close popovers when clicking outside
  if (showPanel.value || showSaveInput.value) {
    const target = e.target
    // Check if click is inside the teleported popover or the buttons
    if (target.closest('.vault-popover') || target.closest('.vault-controls')) return
    showPanel.value = false
    showSaveInput.value = false
  }
}

function togglePanel() {
  if (vault.isLocked.value) return
  showSaveInput.value = false
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    updatePopoverPos(loadButtonRef.value)
    refreshList()
  }
}

function startSave() {
  if (vault.isLocked.value) return
  showPanel.value = false
  showSaveInput.value = true
  saveName.value = ''
  nextTick(() => updatePopoverPos(saveButtonRef.value))
}

async function confirmSave() {
  if (!saveName.value.trim() || saving.value) return
  saving.value = true
  try {
    const data = props.getData()
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    await vault.save(props.storeName, id, saveName.value.trim(), data)
    showSaveInput.value = false
    saveName.value = ''
    showFeedback('Guardado')
    await refreshList()
  } catch (err) {
    showFeedback('Error: ' + (err.message || 'fallo'))
  } finally {
    saving.value = false
  }
}

async function loadItem(item) {
  if (loading.value) return
  loading.value = true
  try {
    const data = await vault.load(props.storeName, item.id)
    emit('load', data)
    showPanel.value = false
    showFeedback('Cargado')
  } catch (err) {
    showFeedback('Error: ' + (err.message || 'fallo'))
  } finally {
    loading.value = false
  }
}

async function deleteItem(id) {
  try {
    await vault.remove(props.storeName, id)
    deleteConfirm.value = null
    await refreshList()
    showFeedback('Eliminado')
  } catch {
    showFeedback('Error al eliminar')
  }
}

function showFeedback(msg) {
  toast(msg, { tone: msg.startsWith('Error') ? 'error' : 'success' })
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="inline-flex items-center gap-0.5 vault-controls tb-ui">
    <button ref="saveButtonRef" type="button" class="tb-icon-btn tb-icon-btn-md" :disabled="vault.isLocked.value"
            :title="vault.isLocked.value ? 'Bóveda bloqueada' : 'Guardar en la bóveda'" aria-label="Guardar en la bóveda" @click="startSave">
      <Icon name="download" :size="16" />
    </button>
    <button ref="loadButtonRef" type="button" class="tb-icon-btn tb-icon-btn-md relative" :disabled="vault.isLocked.value"
            :title="vault.isLocked.value ? 'Bóveda bloqueada' : 'Abrir desde la bóveda'" aria-label="Abrir desde la bóveda"
            :aria-expanded="showPanel" @click="togglePanel">
      <Icon name="folder" :size="16" />
      <span v-if="items.length && !vault.isLocked.value"
            class="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 grid place-items-center rounded-full bg-[var(--accent)] text-[9px] font-semibold text-white">{{ items.length }}</span>
    </button>

    <Teleport to="body">
      <div v-if="showSaveInput" class="vault-popover tb-ui fixed z-[9999] w-[260px] rounded-xl border border-tb-line bg-tb-surface text-tb-ink p-3 shadow-[var(--tb-shadow-lift)] font-ui"
           :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }">
        <p class="mb-2 text-[11px] font-code uppercase tracking-[.12em] text-tb-muted">Guardar {{ label }}</p>
        <div class="flex items-center gap-2">
          <input v-model="saveName" type="text" placeholder="Nombre…" autofocus
                 class="tb-bare-input flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-tb-line-strong bg-tb-bg text-sm text-tb-ink outline-none focus:border-[var(--accent)]"
                 @keyup.enter="confirmSave" @keyup.escape="showSaveInput = false" />
          <button type="button" data-test="vault-confirm-save" class="tb-btn tb-btn-primary tb-btn-sm" :disabled="!saveName.trim() || saving" @click="confirmSave">
            {{ saving ? '…' : 'Guardar' }}
          </button>
        </div>
      </div>

      <div v-if="showPanel" class="vault-popover tb-ui fixed z-[9999] w-[260px] max-h-[320px] flex flex-col overflow-hidden rounded-xl border border-tb-line bg-tb-surface text-tb-ink shadow-[var(--tb-shadow-lift)] font-ui"
           :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }">
        <div class="flex items-center justify-between px-3 py-2 border-b border-tb-line">
          <span class="text-[11px] font-code uppercase tracking-[.12em] text-tb-muted">{{ label || 'Guardados' }}</span>
          <button type="button" class="tb-icon-btn tb-icon-btn-sm" aria-label="Cerrar" @click="showPanel = false"><Icon name="x" :size="13" /></button>
        </div>
        <div v-if="!items.length" class="px-3 py-6 text-center text-sm text-tb-muted">Sin elementos guardados</div>
        <div v-else class="overflow-y-auto flex-1 p-1">
          <div v-for="item in items" :key="item.id" class="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-tb-surface-2 cursor-pointer">
            <div class="flex-1 min-w-0" @click="loadItem(item)">
              <div class="text-sm truncate">{{ item.name }}</div>
              <div class="text-[11px] text-tb-muted">{{ formatDate(item.updatedAt) }}</div>
            </div>
            <button v-if="deleteConfirm !== item.id" type="button" title="Eliminar" aria-label="Eliminar"
                    class="tb-icon-btn tb-icon-btn-sm tb-icon-btn-danger opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    @click.stop="deleteConfirm = item.id"><Icon name="trash" :size="13" /></button>
            <div v-else class="flex items-center gap-1" @click.stop>
              <button type="button" data-test="vault-confirm-delete" class="tb-btn tb-btn-danger tb-btn-sm" @click="deleteItem(item.id)">Sí</button>
              <button type="button" class="tb-btn tb-btn-ghost tb-btn-sm" @click="deleteConfirm = null">No</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
