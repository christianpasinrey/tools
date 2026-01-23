<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useVault } from '../../composables/useVault'
import CryptoLockButton from './CryptoLockButton.vue'

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
const feedback = ref('')
const deleteConfirm = ref(null)

// Refs for positioning teleported popovers
const saveButtonRef = ref(null)
const loadButtonRef = ref(null)
const popoverPos = ref({ top: 0, left: 0 })

function updatePopoverPos(buttonRef) {
  if (!buttonRef) return
  const rect = buttonRef.getBoundingClientRect()
  popoverPos.value = {
    top: rect.bottom + 4,
    left: rect.left
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
  feedback.value = msg
  setTimeout(() => feedback.value = '', 2000)
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="inline-flex items-center gap-1 vault-controls">
    <!-- Lock button when vault is locked -->
    <CryptoLockButton v-if="vault.isLocked.value" />

    <template v-else>
      <!-- Save button -->
      <button
        ref="saveButtonRef"
        @click="startSave"
        class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10"
        title="Guardar en vault"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>

      <!-- Load button (with count badge) -->
      <button
        ref="loadButtonRef"
        @click="togglePanel"
        class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10"
        title="Cargar desde vault"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span v-if="items.length" class="min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-neutral-700 text-[9px] text-neutral-300 px-1">{{ items.length }}</span>
      </button>
    </template>

    <!-- Feedback toast -->
    <transition name="fade">
      <span v-if="feedback" class="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-emerald-400 border border-emerald-500/20 shadow-lg z-50">
        {{ feedback }}
      </span>
    </transition>

    <!-- Teleported popovers to avoid overflow clipping -->
    <Teleport to="body">
      <!-- Save input popover -->
      <div
        v-if="showSaveInput"
        class="vault-popover fixed z-[9999] bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-xl min-w-[220px]"
        :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }"
      >
        <div class="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Guardar {{ label }}</div>
        <div class="flex items-center gap-2">
          <input
            v-model="saveName"
            type="text"
            placeholder="Nombre..."
            class="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            @keyup.enter="confirmSave"
            @keyup.escape="showSaveInput = false"
            autofocus
          />
          <button @click="confirmSave" :disabled="!saveName.trim() || saving" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs">
            {{ saving ? '...' : 'OK' }}
          </button>
          <button @click="showSaveInput = false" class="px-1 py-1 text-neutral-500 hover:text-neutral-300 text-xs">&times;</button>
        </div>
      </div>

      <!-- Items list panel -->
      <div
        v-if="showPanel"
        class="vault-popover fixed z-[9999] bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl min-w-[260px] max-h-[300px] overflow-hidden flex flex-col"
        :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }"
      >
        <div class="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50">
          <span class="text-[10px] text-neutral-500 uppercase tracking-wider">{{ label || 'Guardados' }}</span>
          <button @click="showPanel = false" class="text-neutral-500 hover:text-neutral-300 text-xs">&times;</button>
        </div>

        <div v-if="!items.length" class="px-3 py-4 text-center text-xs text-neutral-600">
          Sin items guardados
        </div>

        <div v-else class="overflow-y-auto flex-1">
          <div
            v-for="item in items"
            :key="item.id"
            class="group flex items-center gap-2 px-3 py-2 hover:bg-neutral-700/30 cursor-pointer border-b border-neutral-700/20 last:border-0"
          >
            <div class="flex-1 min-w-0" @click="loadItem(item)">
              <div class="text-xs text-neutral-300 truncate">{{ item.name }}</div>
              <div class="text-[10px] text-neutral-600">{{ formatDate(item.updatedAt) }}</div>
            </div>

            <!-- Delete -->
            <button
              v-if="deleteConfirm !== item.id"
              @click.stop="deleteConfirm = item.id"
              class="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-400 transition-all"
              title="Eliminar"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <!-- Confirm delete -->
            <div v-else class="flex items-center gap-1" @click.stop>
              <button @click="deleteItem(item.id)" class="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px]">Si</button>
              <button @click="deleteConfirm = null" class="px-1.5 py-0.5 text-neutral-500 hover:text-neutral-300 text-[10px]">No</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
