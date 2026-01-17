<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedObject: Object,
  materialPresets: Object,
  materialProperties: Object
})

const emit = defineEmits(['color-change', 'material-change', 'material-property-change'])

// Check if selected object is a light
const isLight = computed(() => {
  return props.selectedObject?.userData?.light != null
})

const lightType = computed(() => {
  return props.selectedObject?.userData?.type
})

const light = computed(() => {
  return props.selectedObject?.userData?.light
})

// Get current values
const position = computed(() => props.selectedObject?.position)
const rotation = computed(() => props.selectedObject?.rotation)
const scale = computed(() => props.selectedObject?.scale)

// Update functions
const updatePosition = (axis, value) => {
  if (!props.selectedObject) return
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    props.selectedObject.position[axis] = numValue
    // Sync light if needed
    if (light.value) {
      light.value.position[axis] = numValue
      props.selectedObject.userData.helper?.update()
    }
  }
}

const updateRotation = (axis, value) => {
  if (!props.selectedObject || isLight.value) return
  const numValue = parseFloat(value) * (Math.PI / 180)
  if (!isNaN(numValue)) {
    props.selectedObject.rotation[axis] = numValue
  }
}

const updateScale = (axis, value) => {
  if (!props.selectedObject || isLight.value) return
  const numValue = parseFloat(value)
  if (!isNaN(numValue) && numValue > 0) {
    props.selectedObject.scale[axis] = numValue
  }
}

const updateLightIntensity = (value) => {
  if (!light.value) return
  light.value.intensity = parseFloat(value) || 0
}

const updateLightDistance = (value) => {
  if (!light.value) return
  light.value.distance = parseFloat(value) || 0
  props.selectedObject?.userData?.helper?.update()
}

const updateLightAngle = (value) => {
  if (!light.value || lightType.value !== 'spotlight') return
  light.value.angle = (parseFloat(value) || 30) * (Math.PI / 180)
  props.selectedObject?.userData?.helper?.update()
}

const updateLightColor = (value) => {
  if (!light.value) return
  light.value.color.set(value)
  if (props.selectedObject?.material) {
    props.selectedObject.material.color.set(value)
  }
  props.selectedObject?.userData?.helper?.update()
}

const formatNum = (num) => (num ?? 0).toFixed(2)
const radToDeg = (rad) => ((rad ?? 0) * (180 / Math.PI)).toFixed(1)
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-neutral-800 flex items-center gap-2 shrink-0">
      <svg v-if="isLight" class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z"/>
      </svg>
      <svg v-else class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
      <span class="text-xs font-medium text-white capitalize">{{ selectedObject?.userData?.type || 'Objeto' }}</span>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
      <!-- Position -->
      <div>
        <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Posicion</div>
        <div class="grid grid-cols-3 gap-1">
          <div>
            <label class="text-red-400 text-[10px]">X</label>
            <input
              type="number"
              step="0.1"
              :value="formatNum(position?.x)"
              @change="updatePosition('x', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-green-400 text-[10px]">Y</label>
            <input
              type="number"
              step="0.1"
              :value="formatNum(position?.y)"
              @change="updatePosition('y', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-blue-400 text-[10px]">Z</label>
            <input
              type="number"
              step="0.1"
              :value="formatNum(position?.z)"
              @change="updatePosition('z', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
        </div>
      </div>

      <!-- Rotation (only for non-lights) -->
      <div v-if="!isLight">
        <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Rotacion</div>
        <div class="grid grid-cols-3 gap-1">
          <div>
            <label class="text-red-400 text-[10px]">X</label>
            <input
              type="number"
              step="5"
              :value="radToDeg(rotation?.x)"
              @change="updateRotation('x', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-green-400 text-[10px]">Y</label>
            <input
              type="number"
              step="5"
              :value="radToDeg(rotation?.y)"
              @change="updateRotation('y', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-blue-400 text-[10px]">Z</label>
            <input
              type="number"
              step="5"
              :value="radToDeg(rotation?.z)"
              @change="updateRotation('z', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
        </div>
      </div>

      <!-- Scale (only for non-lights) -->
      <div v-if="!isLight">
        <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Escala</div>
        <div class="grid grid-cols-3 gap-1">
          <div>
            <label class="text-red-400 text-[10px]">X</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              :value="formatNum(scale?.x)"
              @change="updateScale('x', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-green-400 text-[10px]">Y</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              :value="formatNum(scale?.y)"
              @change="updateScale('y', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
          <div>
            <label class="text-blue-400 text-[10px]">Z</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              :value="formatNum(scale?.z)"
              @change="updateScale('z', $event.target.value)"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-white"
            />
          </div>
        </div>
      </div>

      <!-- Material Properties (for non-lights) -->
      <template v-if="!isLight && materialProperties">
        <!-- Color -->
        <div>
          <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Color</div>
          <input
            type="color"
            :value="materialProperties.color"
            @input="emit('color-change', $event.target.value)"
            class="w-full h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
          />
        </div>

        <!-- Material Type -->
        <div>
          <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Tipo Material</div>
          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="(preset, key) in materialPresets"
              :key="key"
              @click="emit('material-change', key)"
              :class="['p-1.5 rounded border text-center transition-colors', selectedObject?.userData?.materialType === key ? 'border-green-500 bg-green-500/20' : 'border-neutral-700 hover:border-neutral-600']"
              :title="preset.name"
            >
              {{ preset.icon }}
            </button>
          </div>
        </div>

        <!-- Metalness -->
        <div v-if="materialProperties.metalness !== undefined">
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Metalico</span>
            <span class="text-white">{{ (materialProperties.metalness * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="materialProperties.metalness"
            @input="emit('material-property-change', 'metalness', parseFloat($event.target.value))"
            class="w-full accent-green-500 h-1.5"
          />
        </div>

        <!-- Roughness -->
        <div v-if="materialProperties.roughness !== undefined">
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Rugosidad</span>
            <span class="text-white">{{ (materialProperties.roughness * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="materialProperties.roughness"
            @input="emit('material-property-change', 'roughness', parseFloat($event.target.value))"
            class="w-full accent-green-500 h-1.5"
          />
        </div>

        <!-- Opacity -->
        <div>
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Opacidad</span>
            <span class="text-white">{{ (materialProperties.opacity * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="materialProperties.opacity"
            @input="emit('material-property-change', 'opacity', parseFloat($event.target.value))"
            class="w-full accent-green-500 h-1.5"
          />
        </div>
      </template>

      <!-- Light Properties -->
      <template v-if="isLight">
        <!-- Intensity -->
        <div>
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Intensidad</span>
            <span class="text-yellow-400">{{ (light?.intensity ?? 0).toFixed(0) }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            :value="light?.intensity ?? 100"
            @input="updateLightIntensity($event.target.value)"
            class="w-full accent-yellow-500 h-1.5"
          />
        </div>

        <!-- Distance -->
        <div>
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Distancia</span>
            <span class="text-yellow-400">{{ (light?.distance ?? 0).toFixed(0) }}</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            :value="light?.distance ?? 20"
            @input="updateLightDistance($event.target.value)"
            class="w-full accent-yellow-500 h-1.5"
          />
        </div>

        <!-- Angle (spotlight only) -->
        <div v-if="lightType === 'spotlight'">
          <div class="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span class="uppercase tracking-wider">Angulo</span>
            <span class="text-yellow-400">{{ ((light?.angle ?? 0.5) * (180 / Math.PI)).toFixed(0) }}</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            :value="(light?.angle ?? 0.5) * (180 / Math.PI)"
            @input="updateLightAngle($event.target.value)"
            class="w-full accent-yellow-500 h-1.5"
          />
        </div>

        <!-- Color -->
        <div>
          <div class="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Color</div>
          <input
            type="color"
            :value="'#' + (light?.color?.getHexString?.() ?? 'ffffff')"
            @input="updateLightColor($event.target.value)"
            class="w-full h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
          />
        </div>
      </template>
    </div>
  </div>
</template>
