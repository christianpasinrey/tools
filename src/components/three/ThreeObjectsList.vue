<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  objects: Array,
  selectedObject: Object
})

const emit = defineEmits(['select', 'delete'])

const handleDelete = (obj) => {
  emit('delete', obj)
}

// Thumbnail renderer
let thumbnailRenderer = null
let thumbnailScene = null
let thumbnailCamera = null
const thumbnailSize = 40
const thumbnails = ref({})

// Initialize thumbnail renderer
onMounted(() => {
  // Create a small offscreen renderer for thumbnails
  thumbnailRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  })
  thumbnailRenderer.setSize(thumbnailSize, thumbnailSize)
  thumbnailRenderer.setClearColor(0x000000, 0)

  // Thumbnail scene and camera
  thumbnailScene = new THREE.Scene()
  thumbnailCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  thumbnailCamera.position.set(2, 1.5, 2)
  thumbnailCamera.lookAt(0, 0, 0)

  // Add light to thumbnail scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  thumbnailScene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(2, 3, 2)
  thumbnailScene.add(directionalLight)

  // Generate initial thumbnails
  generateAllThumbnails()
})

onUnmounted(() => {
  if (thumbnailRenderer) {
    thumbnailRenderer.dispose()
  }
})

// Watch for object changes
watch(() => props.objects, () => {
  generateAllThumbnails()
}, { deep: true })

// Generate thumbnail for a single object
const generateThumbnail = (obj) => {
  if (!thumbnailRenderer || !thumbnailScene || !thumbnailCamera) return null
  if (!obj || !obj.userData?.id) return null

  // Clear previous objects from thumbnail scene (except lights)
  thumbnailScene.children = thumbnailScene.children.filter(child => child.isLight)

  // For lights, create a simple sphere representation
  if (obj.userData?.light) {
    const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16)
    const color = obj.userData.light.color?.clone() || new THREE.Color(0xffff00)
    const sphereMat = new THREE.MeshBasicMaterial({ color })
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    thumbnailScene.add(sphere)
  } else if (obj.geometry) {
    // Clone the object for thumbnail
    const clone = obj.clone()
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)

    // Fit object in view
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 1.2 / maxDim
    clone.scale.multiplyScalar(scale)

    // Center
    const center = box.getCenter(new THREE.Vector3())
    clone.position.sub(center.multiplyScalar(scale))

    thumbnailScene.add(clone)
  } else {
    return null
  }

  // Render
  thumbnailRenderer.render(thumbnailScene, thumbnailCamera)
  return thumbnailRenderer.domElement.toDataURL('image/png')
}

// Generate all thumbnails
const generateAllThumbnails = () => {
  if (!props.objects) return

  const newThumbnails = {}
  props.objects.forEach(obj => {
    if (obj.userData?.id) {
      const thumb = generateThumbnail(obj)
      if (thumb) {
        newThumbnails[obj.userData.id] = thumb
      }
    }
  })
  thumbnails.value = newThumbnails
}

// Get object display name
const getObjectName = (obj) => {
  if (!obj?.userData) return 'Objeto'

  const type = obj.userData.type || 'objeto'
  const typeNames = {
    'cube': 'Cubo',
    'sphere': 'Esfera',
    'torus': 'Toro',
    'cone': 'Cono',
    'cylinder': 'Cilindro',
    'tetrahedron': 'Tetraedro',
    'octahedron': 'Octaedro',
    'dodecahedron': 'Dodecaedro',
    'torusKnot': 'Nudo',
    'spotlight': 'Foco',
    'pointlight': 'Luz',
    'model': 'Modelo'
  }

  return typeNames[type] || type
}

// Get object icon based on type
const getObjectIcon = (obj) => {
  if (obj?.userData?.light) return 'light'
  if (obj?.userData?.type === 'model') return 'model'
  return 'shape'
}

// Check if object is selected
const isSelected = (obj) => {
  return props.selectedObject?.userData?.id === obj?.userData?.id
}
</script>

<template>
  <div class="w-48 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Objetos</span>
      <span class="text-[10px] text-neutral-600">{{ objects?.length || 0 }}</span>
    </div>

    <!-- Objects List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="!objects || objects.length === 0" class="p-4 text-xs text-neutral-600 text-center">
        Sin objetos
      </div>

      <div v-else class="py-1">
        <div
          v-for="obj in objects"
          :key="obj.userData?.id"
          @click="emit('select', obj)"
          :class="[
            'w-full px-2 py-1.5 flex items-center gap-2 text-left transition-colors group cursor-pointer',
            isSelected(obj)
              ? 'bg-green-500/20 border-l-2 border-green-500'
              : 'hover:bg-neutral-800 border-l-2 border-transparent'
          ]"
        >
          <!-- Thumbnail -->
          <div
            :class="[
              'w-10 h-10 rounded border flex-shrink-0 overflow-hidden flex items-center justify-center',
              isSelected(obj) ? 'border-green-500/50' : 'border-neutral-700'
            ]"
          >
            <!-- Rendered thumbnail -->
            <img
              v-if="thumbnails[obj.userData?.id]"
              :src="thumbnails[obj.userData?.id]"
              class="w-full h-full object-contain"
              :alt="getObjectName(obj)"
            />
            <!-- Fallback icon -->
            <template v-else>
              <!-- Light icon -->
              <svg v-if="getObjectIcon(obj) === 'light'" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z"/>
              </svg>
              <!-- Model icon -->
              <svg v-else-if="getObjectIcon(obj) === 'model'" class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <!-- Shape icon -->
              <svg v-else class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </template>
          </div>

          <!-- Object info -->
          <div class="flex-1 min-w-0">
            <div :class="['text-xs font-medium truncate', isSelected(obj) ? 'text-green-400' : 'text-neutral-300']">
              {{ getObjectName(obj) }}
            </div>
            <div class="text-[10px] text-neutral-600 truncate">
              {{ obj.userData?.filename || `#${obj.userData?.id?.toString().slice(-4)}` }}
            </div>
          </div>

          <!-- Delete button (on hover) -->
          <button
            @click.stop="handleDelete(obj)"
            class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 transition-all"
            title="Eliminar"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Footer hint -->
    <div class="px-3 py-2 border-t border-neutral-800 text-[10px] text-neutral-600">
      Click para seleccionar
    </div>
  </div>
</template>
