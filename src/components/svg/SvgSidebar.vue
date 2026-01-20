<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  selectedElements: Array,
  artboardWidth: Number,
  artboardHeight: Number,
  sizePresets: Array,
  themeColor: String
})

const emit = defineEmits([
  'update-element',
  'apply-preset',
  'update:artboardWidth',
  'update:artboardHeight'
])

// Single selected element for editing
const selectedElement = computed(() => {
  if (props.selectedElements.length === 1) {
    return props.selectedElements[0]
  }
  return null
})

// Local text value for proper reactivity
const localText = ref('')

// Sync localText with selectedElement.text (from external changes)
watch(
  () => selectedElement.value?.text,
  (newText) => {
    if (newText !== undefined && newText !== localText.value) {
      localText.value = newText
    }
  },
  { immediate: true }
)

// Sync changes from localText to element
watch(localText, (newValue) => {
  if (selectedElement.value && newValue !== selectedElement.value.text) {
    emit('update-element', selectedElement.value.id, { text: newValue })
  }
})

const updateProperty = (property, value) => {
  if (selectedElement.value) {
    emit('update-element', selectedElement.value.id, { [property]: value })
  }
}

const updateNumberProperty = (property, event) => {
  const value = parseFloat(event.target.value) || 0
  updateProperty(property, value)
}

const strokeDashOptions = [
  { label: 'Solid', value: null },
  { label: 'Dashed', value: '8 4' },
  { label: 'Dotted', value: '2 2' },
  { label: 'Dash-Dot', value: '8 4 2 4' }
]
</script>

<template>
  <div class="w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-hidden">
    <!-- Artboard Settings -->
    <div class="p-4 border-b border-neutral-800">
      <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Artboard</h3>

      <div class="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Width</label>
          <input
            type="number"
            :value="artboardWidth"
            @input="emit('update:artboardWidth', parseInt($event.target.value) || 100)"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Height</label>
          <input
            type="number"
            :value="artboardHeight"
            @input="emit('update:artboardHeight', parseInt($event.target.value) || 100)"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      <!-- Presets -->
      <div class="flex flex-wrap gap-1">
        <button
          v-for="preset in sizePresets"
          :key="preset.name"
          @click="emit('apply-preset', preset)"
          class="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- Element Properties -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selectedElement" class="p-4 space-y-4">
        <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Properties</h3>

        <!-- Element Name -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Name</label>
          <input
            type="text"
            :value="selectedElement.name"
            @input="updateProperty('name', $event.target.value)"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <!-- Position (for rect, text) -->
        <div v-if="'x' in selectedElement && 'y' in selectedElement" class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">X</label>
            <input
              type="number"
              :value="selectedElement.x"
              @input="updateNumberProperty('x', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Y</label>
            <input
              type="number"
              :value="selectedElement.y"
              @input="updateNumberProperty('y', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <!-- Size (for rect) -->
        <div v-if="'width' in selectedElement && 'height' in selectedElement" class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Width</label>
            <input
              type="number"
              :value="selectedElement.width"
              @input="updateNumberProperty('width', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Height</label>
            <input
              type="number"
              :value="selectedElement.height"
              @input="updateNumberProperty('height', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <!-- Ellipse center/radius -->
        <div v-if="'cx' in selectedElement" class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Center X</label>
            <input
              type="number"
              :value="selectedElement.cx"
              @input="updateNumberProperty('cx', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Center Y</label>
            <input
              type="number"
              :value="selectedElement.cy"
              @input="updateNumberProperty('cy', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <div v-if="'rx' in selectedElement && 'ry' in selectedElement && selectedElement.type === 'ellipse'" class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Radius X</label>
            <input
              type="number"
              :value="selectedElement.rx"
              @input="updateNumberProperty('rx', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Radius Y</label>
            <input
              type="number"
              :value="selectedElement.ry"
              @input="updateNumberProperty('ry', $event)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <!-- Border Radius (for rect) -->
        <div v-if="selectedElement.type === 'rect'">
          <label class="text-xs text-neutral-500 mb-1 block">Corner Radius</label>
          <input
            type="number"
            :value="selectedElement.rx || 0"
            @input="updateNumberProperty('rx', $event)"
            min="0"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <!-- Rotation -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Rotation</label>
          <input
            type="number"
            :value="selectedElement.rotation || 0"
            @input="updateNumberProperty('rotation', $event)"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <!-- Fill -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Fill</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="selectedElement.fill || '#000000'"
              @input="updateProperty('fill', $event.target.value)"
              class="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              :value="selectedElement.fill || 'none'"
              @input="updateProperty('fill', $event.target.value)"
              class="flex-1 px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
            <button
              @click="updateProperty('fill', 'none')"
              class="px-2 py-1.5 text-xs bg-neutral-800 text-neutral-400 rounded hover:bg-neutral-700"
              title="No fill"
            >
              None
            </button>
          </div>
        </div>

        <!-- Stroke -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Stroke</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="selectedElement.stroke || '#000000'"
              @input="updateProperty('stroke', $event.target.value)"
              class="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              :value="selectedElement.stroke || 'none'"
              @input="updateProperty('stroke', $event.target.value)"
              class="flex-1 px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <!-- Stroke Width -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Stroke Width</label>
          <input
            type="number"
            :value="selectedElement.strokeWidth"
            @input="updateNumberProperty('strokeWidth', $event)"
            min="0"
            step="0.5"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <!-- Stroke Dash -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Stroke Style</label>
          <select
            :value="selectedElement.strokeDasharray || ''"
            @change="updateProperty('strokeDasharray', $event.target.value || null)"
            class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
          >
            <option v-for="opt in strokeDashOptions" :key="opt.label" :value="opt.value || ''">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Opacity -->
        <div>
          <label class="text-xs text-neutral-500 mb-1 block">Opacity: {{ Math.round((selectedElement.opacity || 1) * 100) }}%</label>
          <input
            type="range"
            :value="(selectedElement.opacity || 1) * 100"
            @input="updateProperty('opacity', $event.target.value / 100)"
            min="0"
            max="100"
            class="w-full"
          />
        </div>

        <!-- Text specific -->
        <template v-if="selectedElement.type === 'text'">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Text</label>
            <textarea
              v-model="localText"
              rows="3"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Font Size</label>
            <input
              type="number"
              :value="selectedElement.fontSize"
              @input="updateNumberProperty('fontSize', $event)"
              min="1"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Font Family</label>
            <select
              :value="selectedElement.fontFamily"
              @change="updateProperty('fontFamily', $event.target.value)"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
        </template>
      </div>

      <!-- No selection message -->
      <div v-else class="p-4 text-center text-neutral-500 text-sm">
        <p>Select an element to edit its properties</p>
      </div>
    </div>
  </div>
</template>
