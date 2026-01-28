<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { useThreePlayground } from '../composables/three/useThreePlayground'
import ThreeToolbar from '../components/three/ThreeToolbar.vue'
import ThreePropertiesPanel from '../components/three/ThreePropertiesPanel.vue'
import ThreeObjectsList from '../components/three/ThreeObjectsList.vue'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'

const playground = useThreePlayground()

const getSceneData = () => ({
  objects: playground.objects.value.map(obj => ({
    type: obj.userData?.type || 'cube',
    position: obj.position.toArray(),
    rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale: obj.scale.toArray(),
    color: obj.material?.color ? '#' + obj.material.color.getHexString() : '#22c55e'
  }))
})

const loadSceneData = (data) => {
  playground.quickActions.clearScene()
  isPresetActive.value = false
  if (!data.objects) return
  data.objects.forEach(objData => {
    const mesh = playground.addShape(objData.type || 'cube', { color: objData.color || '#22c55e' })
    if (mesh) {
      if (objData.position) mesh.position.fromArray(objData.position)
      if (objData.rotation) mesh.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2])
      if (objData.scale) mesh.scale.fromArray(objData.scale)
    }
  })
}
const canvasContainer = ref(null)
const fileInput = ref(null)
const isPresetActive = ref(false)
const isAnimationPlaying = ref(true)
const isRecording = ref(false)
const savedScenes = ref([])  // Stored custom scenes
const recordingInterval = ref(null)  // Interval for recording keyframes
const recordedFrames = ref([])  // Frames being recorded

// Computed
const hasObjects = computed(() => playground.objects.value.length > 0)

// Watch for preset mode changes to trigger resize
watch(isPresetActive, () => {
  nextTick(() => {
    // Trigger window resize event for Three.js to recalculate
    window.dispatchEvent(new Event('resize'))
  })
})

// Animation control
const toggleAnimation = () => {
  isAnimationPlaying.value = !isAnimationPlaying.value
  playground.setAnimationPaused(!isAnimationPlaying.value)
}

// Capture current frame
const captureFrame = () => {
  const objects = playground.objects.value
  if (objects.length === 0) return null

  return objects.map(obj => ({
    id: obj.userData?.id,
    type: obj.userData?.type || 'cube',
    position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
    rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
    scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
    color: obj.material?.color?.getHexString() || '22c55e'
  }))
}

// Recording control - captures frames over time
const toggleRecording = () => {
  if (!isRecording.value) {
    // Start recording
    isRecording.value = true
    recordedFrames.value = []

    // Capture first frame immediately
    const firstFrame = captureFrame()
    if (firstFrame) recordedFrames.value.push(firstFrame)

    // Capture frames every 100ms (10 fps)
    recordingInterval.value = setInterval(() => {
      const frame = captureFrame()
      if (frame) recordedFrames.value.push(frame)
    }, 100)
  } else {
    // Stop recording
    isRecording.value = false
    if (recordingInterval.value) {
      clearInterval(recordingInterval.value)
      recordingInterval.value = null
    }

    // Save recorded scene if we have frames
    if (recordedFrames.value.length > 1) {
      const sceneData = {
        id: Date.now(),
        name: `Escena ${savedScenes.value.length + 1}`,
        timestamp: new Date().toLocaleTimeString(),
        duration: recordedFrames.value.length * 0.1, // seconds
        frames: [...recordedFrames.value],
        // Store first frame for preview
        objects: recordedFrames.value[0]
      }
      savedScenes.value = [...savedScenes.value, sceneData]
    }
    recordedFrames.value = []
  }
}

// Load a saved scene with playback animation
const loadSavedScene = (scene) => {
  playground.quickActions.clearScene()

  // Treat saved scenes like presets (show play/pause, hide object list)
  isPresetActive.value = true
  isAnimationPlaying.value = true
  playground.setAnimationPaused(false)

  const frames = scene.frames
  const duration = scene.duration || frames.length * 0.1
  const firstFrame = frames[0]

  // Create objects from first frame
  const createdMeshes = []
  firstFrame.forEach((objData, index) => {
    const mesh = playground.addShape(objData.type)
    if (mesh) {
      mesh.position.set(objData.position.x, objData.position.y, objData.position.z)
      mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
      mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
      if (mesh.material?.color) {
        mesh.material.color.setStyle('#' + objData.color)
      }

      // Add playback animation
      mesh.userData.frames = frames
      mesh.userData.frameIndex = index
      mesh.userData.duration = duration
      mesh.userData.animate = (time, obj) => {
        const frameData = obj.userData.frames
        const idx = obj.userData.frameIndex
        const dur = obj.userData.duration

        // Loop time
        const loopTime = time % dur
        // Calculate frame index (with interpolation)
        const frameProgress = (loopTime / dur) * (frameData.length - 1)
        const frameA = Math.floor(frameProgress)
        const frameB = Math.min(frameA + 1, frameData.length - 1)
        const t = frameProgress - frameA // Interpolation factor

        const dataA = frameData[frameA]?.[idx]
        const dataB = frameData[frameB]?.[idx]

        if (dataA && dataB) {
          // Interpolate position
          obj.position.x = dataA.position.x + (dataB.position.x - dataA.position.x) * t
          obj.position.y = dataA.position.y + (dataB.position.y - dataA.position.y) * t
          obj.position.z = dataA.position.z + (dataB.position.z - dataA.position.z) * t

          // Interpolate rotation
          obj.rotation.x = dataA.rotation.x + (dataB.rotation.x - dataA.rotation.x) * t
          obj.rotation.y = dataA.rotation.y + (dataB.rotation.y - dataA.rotation.y) * t
          obj.rotation.z = dataA.rotation.z + (dataB.rotation.z - dataA.rotation.z) * t

          // Interpolate scale
          obj.scale.x = dataA.scale.x + (dataB.scale.x - dataA.scale.x) * t
          obj.scale.y = dataA.scale.y + (dataB.scale.y - dataA.scale.y) * t
          obj.scale.z = dataA.scale.z + (dataB.scale.z - dataA.scale.z) * t
        }
      }

      createdMeshes.push(mesh)
    }
  })
}

// Delete a saved scene
const deleteSavedScene = (sceneId) => {
  savedScenes.value = savedScenes.value.filter(s => s.id !== sceneId)
}

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (e.target.tagName === 'INPUT') return

  switch (e.key.toLowerCase()) {
    case 'delete':
      playground.deleteSelected()
      break
    case 'escape':
      playground.deselectObject()
      break
    case 'd':
      if (e.ctrlKey) {
        e.preventDefault()
        playground.duplicateSelected()
      }
      break
  }
}

// Handle file import
const triggerImport = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (e) => {
  await playground.handleFileImport(e)
  e.target.value = '' // Reset input
}

// Load human model for lighting tests
const loadHumanModel = async () => {
  isPresetActive.value = false

  // Use the GLTFLoader directly from the importer
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const loader = new GLTFLoader()

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        playground.HUMAN_MODEL_URL,
        resolve,
        (progress) => {
          console.log('Loading human model:', (progress.loaded / progress.total * 100).toFixed(0) + '%')
        },
        reject
      )
    })

    const model = gltf.scene
    model.scale.setScalar(2) // Scale up the model
    model.position.set(0, 0, 0)

    // Setup materials for better lighting visibility
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    model.userData = {
      type: 'human',
      id: Date.now(),
      isUserObject: true,
      name: 'Modelo Humano'
    }

    playground.scene.value.add(model)
    playground.objects.value = [...playground.objects.value, model]
    playground.selectObject(model)
  } catch (error) {
    console.error('Error loading human model:', error)
  }
}

// Clear all objects except lights
const clearNonLightObjects = () => {
  const lightTypes = ['spotlight', 'pointlight', 'arealight', 'hemisphere', 'directional']

  // First, deselect any object
  playground.deselectObject()

  // Get all objects to remove (anything that's not a light)
  const objectsToKeep = []
  const objectsToRemove = []

  playground.objects.value.forEach(obj => {
    if (lightTypes.includes(obj.userData?.type)) {
      objectsToKeep.push(obj)
    } else {
      objectsToRemove.push(obj)
    }
  })

  // Remove objects from scene and dispose
  objectsToRemove.forEach(obj => {
    playground.scene.value.remove(obj)
    // Dispose geometry and materials recursively
    obj.traverse?.((child) => {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.map?.dispose()
            m.dispose()
          })
        } else {
          child.material.map?.dispose()
          child.material.dispose()
        }
      }
    })
  })

  // Also scan scene directly for any orphaned user objects
  const sceneObjectsToRemove = []
  playground.scene.value.traverse((child) => {
    if (child.userData?.isUserObject && !lightTypes.includes(child.userData?.type)) {
      sceneObjectsToRemove.push(child)
    }
  })

  sceneObjectsToRemove.forEach(obj => {
    playground.scene.value.remove(obj)
  })

  // Update the objects array
  playground.objects.value = objectsToKeep
}

// Load a pre-made scene for lighting testing
const loadScenePreset = async (presetKey) => {
  const preset = playground.SCENE_PRESETS[presetKey]
  if (!preset) return

  isPresetActive.value = false

  // Clear previous objects but keep lights
  clearNonLightObjects()

  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js')

  const loader = new GLTFLoader()

  // Setup DRACO decoder for compressed meshes
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  loader.setDRACOLoader(dracoLoader)

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        preset.url,
        resolve,
        (progress) => {
          if (progress.total > 0) {
            console.log(`Loading ${preset.name}:`, (progress.loaded / progress.total * 100).toFixed(0) + '%')
          }
        },
        reject
      )
    })

    const model = gltf.scene
    model.scale.setScalar(preset.scale || 1)

    // Setup materials for better lighting visibility
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Calculate bounding box and position model on top of the ground plane (y=0)
    const box = new THREE.Box3().setFromObject(model)
    const minY = box.min.y
    model.position.set(0, -minY, 0) // Lift model so its bottom is at y=0

    model.userData = {
      type: 'scene',
      id: Date.now(),
      isUserObject: true,
      name: preset.name
    }

    playground.scene.value.add(model)
    playground.objects.value = [...playground.objects.value, model]
    playground.selectObject(model)

    // Reset camera to see the whole scene
    playground.resetCamera()
  } catch (error) {
    console.error(`Error loading scene ${preset.name}:`, error)
  }
}

// Handle object selection from list
const handleSelectFromList = (obj) => {
  playground.selectObject(obj)
}

// Handle object deletion from list
const handleDeleteFromList = (obj) => {
  playground.deleteObject(obj)
}

// Load scene preset
const loadPreset = (presetId) => {
  // Clear current scene first
  playground.quickActions.clearScene()

  // Activate preset mode (hide objects list) except for empty
  isPresetActive.value = presetId !== 'empty'

  switch (presetId) {
    case 'empty':
      // Just empty scene, nothing to add
      break
    case 'cube':
      // Single rotating cube in center
      const cube = playground.addShape('cube')
      if (cube) {
        cube.position.set(0, 1, 0)
        cube.userData.animate = (time, obj) => {
          obj.rotation.x = time * 0.5
          obj.rotation.y = time * 0.8
        }
      }
      break
    case 'spheres':
      // Multiple spheres orbiting around center (same speed)
      for (let i = 0; i < 5; i++) {
        const sphere = playground.addShape('sphere')
        if (sphere) {
          const startAngle = (i / 5) * Math.PI * 2
          const radius = 3

          sphere.position.set(Math.cos(startAngle) * radius, 0.5, Math.sin(startAngle) * radius)
          sphere.scale.setScalar(1)

          sphere.userData.orbitRadius = radius
          sphere.userData.startAngle = startAngle
          sphere.userData.animate = (time, obj) => {
            const angle = obj.userData.startAngle + time * 0.5
            const r = obj.userData.orbitRadius
            obj.position.x = Math.cos(angle) * r
            obj.position.z = Math.sin(angle) * r
          }
        }
      }
      break
    case 'particles':
      // Many tiny spheres orbiting in random directions
      for (let i = 0; i < 150; i++) {
        const sphere = playground.addShape('sphere')
        if (sphere) {
          const radius = 3 + Math.random() * 12
          const orbitSpeed = 0.05 + Math.random() * 0.2

          // Random orbit axis for each particle
          const orbitAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize()

          // Create perpendicular vectors for orbit plane
          const perpVector = new THREE.Vector3(1, 0, 0)
          if (Math.abs(orbitAxis.dot(perpVector)) > 0.9) {
            perpVector.set(0, 1, 0)
          }
          const orbitX = new THREE.Vector3().crossVectors(orbitAxis, perpVector).normalize()
          const orbitY = new THREE.Vector3().crossVectors(orbitAxis, orbitX).normalize()

          // Random starting angle
          const startAngle = Math.random() * Math.PI * 2

          // Initial position
          const initialPos = new THREE.Vector3()
            .addScaledVector(orbitX, Math.cos(startAngle) * radius)
            .addScaledVector(orbitY, Math.sin(startAngle) * radius)

          sphere.position.copy(initialPos)
          sphere.scale.setScalar(0.02 + Math.random() * 0.05)

          // Make them emissive/bright
          if (sphere.material) {
            sphere.material.emissive = sphere.material.color.clone()
            sphere.material.emissiveIntensity = 0.5
          }

          // Store orbit data
          sphere.userData.orbitX = orbitX
          sphere.userData.orbitY = orbitY
          sphere.userData.orbitRadius = radius
          sphere.userData.orbitSpeed = orbitSpeed
          sphere.userData.startAngle = startAngle
          sphere.userData.animate = (time, obj) => {
            const angle = obj.userData.startAngle + time * obj.userData.orbitSpeed
            const r = obj.userData.orbitRadius
            obj.position.set(0, 0, 0)
              .addScaledVector(obj.userData.orbitX, Math.cos(angle) * r)
              .addScaledVector(obj.userData.orbitY, Math.sin(angle) * r)
          }
        }
      }
      break
    case 'waves':
      // Animated wave mesh floor (like a blanket)
      const segments = 60
      const size = 15
      const waveGeometry = new THREE.PlaneGeometry(size, size, segments, segments)
      waveGeometry.rotateX(-Math.PI / 2) // Make it horizontal in geometry itself

      // Store original positions for wave calculation
      const originalPositions = new Float32Array(waveGeometry.attributes.position.array)

      const waveMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#22c55e'),
        metalness: 0.2,
        roughness: 0.5,
        side: THREE.DoubleSide,
        wireframe: true
      })
      const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial)
      waveMesh.position.y = 1

      waveMesh.userData = {
        type: 'waves',
        id: Date.now(),
        isUserObject: true,
        originalPositions: originalPositions,
        animate: (time, obj) => {
          const pos = obj.geometry.attributes.position
          const orig = obj.userData.originalPositions

          for (let i = 0; i < pos.count; i++) {
            const ix = i * 3
            const x = orig[ix]
            const z = orig[ix + 2]
            // Ocean-like waves (sum of sine waves, not multiplication)
            const wave = Math.sin(x * 0.5 + time) * 0.3
                       + Math.sin(z * 0.5 + time * 1.3) * 0.3
                       + Math.sin((x + z) * 0.3 + time * 0.7) * 0.2
            pos.setY(i, wave)
          }
          pos.needsUpdate = true
          obj.geometry.computeVertexNormals()
        }
      }

      playground.scene.value.add(waveMesh)
      playground.objects.value = [...playground.objects.value, waveMesh]
      break
  }
}

// Initialize on mount
onMounted(() => {
  if (canvasContainer.value) {
    playground.init(canvasContainer.value)
    // Add a default cube
    playground.addShape('cube')
  }
  window.addEventListener('keydown', handleKeydown)
})

// Cleanup
onUnmounted(() => {
  playground.destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-full flex flex-col app-bg select-none">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".gltf,.glb,.obj"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Toolbar -->
    <ThreeToolbar
      :has-objects="hasObjects"
      :has-selection="!!playground.selectedObject.value"
      :bloom-enabled="playground.bloomEnabled.value"
      :current-environment="playground.currentEnvironment.value"
      :current-lighting="playground.currentLightingPreset.value"
      :environment-presets="playground.ENVIRONMENT_PRESETS"
      :lighting-presets="playground.LIGHTING_PRESETS"
      :light-types="playground.LIGHT_TYPES"
      :scene-presets="playground.SCENE_PRESETS"
      :material-presets="playground.MATERIAL_PRESETS"
      :is-importing="playground.isImporting.value"
      :is-preset-active="isPresetActive"
      :is-animation-playing="isAnimationPlaying"
      :is-recording="isRecording"
      :saved-scenes="savedScenes"
      @toggle-animation="toggleAnimation"
      @toggle-recording="toggleRecording"
      @load-saved-scene="loadSavedScene"
      @delete-saved-scene="deleteSavedScene"
      @add-shape="(shape) => { isPresetActive = false; playground.addShape(shape) }"
      @add-spotlight="() => { isPresetActive = false; playground.addSpotlight() }"
      @add-pointlight="() => { isPresetActive = false; playground.addPointLight() }"
      @add-arealight="() => { isPresetActive = false; playground.addAreaLight() }"
      @add-hemisphere="() => { isPresetActive = false; playground.addHemisphereLight() }"
      @add-directional="() => { isPresetActive = false; playground.addDirectionalLight() }"
      @clear="playground.quickActions.clearScene"
      @reset-camera="playground.resetCamera"
      @delete-selected="playground.deleteSelected"
      @duplicate-selected="playground.duplicateSelected"
      @deselect="playground.deselectObject"
      @screenshot="playground.quickActions.screenshot"
      @export-gltf="playground.quickActions.exportGLTF"
      @export-glb="playground.quickActions.exportGLB"
      @import="() => { isPresetActive = false; triggerImport() }"
      @import-human="loadHumanModel"
      @load-scene-preset="loadScenePreset"
      @toggle-bloom="playground.setBloomEnabled(!playground.bloomEnabled.value)"
      @environment-change="playground.loadEnvironment"
      @lighting-change="playground.applyLightingPreset"
      @material-change="playground.applyMaterialToSelected"
      @load-preset="loadPreset"
    />

    <!-- Scene Save/Load -->
    <div class="h-9 bg-neutral-900/50 border-b border-neutral-800 flex items-center px-3 shrink-0">
      <span class="text-xs text-neutral-500 mr-2">Escena</span>
      <VaultSaveLoad storeName="three-scenes" :getData="getSceneData" label="escena" @load="loadSceneData" />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- Objects List (left sidebar) - hidden in preset mode -->
      <ThreeObjectsList
        v-if="!isPresetActive"
        :objects="playground.objects.value"
        :selected-object="playground.selectedObject.value"
        @select="handleSelectFromList"
        @delete="handleDeleteFromList"
      />

      <!-- Canvas Container -->
      <div class="flex-1 relative">
        <div
          ref="canvasContainer"
          class="absolute inset-0"
        ></div>

        <!-- Loading overlay -->
        <div v-if="playground.isImporting.value" class="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div class="bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
            <div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div class="text-sm text-white">Importando modelo...</div>
            <div class="text-xs text-neutral-400 mt-1">{{ playground.importProgress.value.toFixed(0) }}%</div>
          </div>
        </div>

        <!-- Environment loading -->
        <div v-if="playground.isLoadingEnvironment.value" class="absolute top-4 right-4 bg-neutral-900/90 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-300 z-10">
          Cargando entorno...
        </div>

        <!-- Keyboard Controls Visual -->
        <div v-if="playground.selectedObject.value" class="absolute top-4 left-4 p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
          <div class="text-[10px] text-neutral-500 mb-2 text-center">Mover objeto</div>

          <!-- WASD + QE Layout -->
          <div class="flex flex-col items-center gap-1">
            <div class="flex gap-1">
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.q ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                Q
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.w ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                W
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.e ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                E
              </div>
            </div>
            <div class="flex gap-1">
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.a ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                A
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.s ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                S
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.d ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                D
              </div>
            </div>
          </div>

          <div class="flex flex-col text-[9px] text-neutral-600 mt-2 gap-0.5">
            <div class="flex justify-center gap-3">
              <span>W↑ S↓</span>
              <span>A← D→</span>
            </div>
            <div class="text-center">Q/E profundidad</div>
          </div>
        </div>

        <!-- General Controls Hint (when no selection) -->
        <div v-else class="absolute bottom-4 right-4 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-500">
          <span class="text-neutral-400">Click</span> Seleccionar &nbsp;
          <span class="text-neutral-400">Scroll</span> Zoom
        </div>

        <!-- Bloom indicator -->
        <div v-if="playground.bloomEnabled.value" class="absolute bottom-4 right-4 px-2 py-1 bg-purple-900/50 border border-purple-700 rounded text-[10px] text-purple-300">
          Bloom activo
        </div>
      </div>

      <!-- Properties Panel (right sidebar) -->
      <div class="w-56 bg-neutral-900 border-l border-neutral-800 shrink-0 overflow-y-auto">
        <ThreePropertiesPanel
          v-if="playground.selectedObject.value"
          :selected-object="playground.selectedObject.value"
          :material-presets="playground.MATERIAL_PRESETS"
          :material-properties="playground.getSelectedMaterialProperties.value"
          :has-texture="playground.selectedHasTexture.value"
          :texture-url="playground.selectedTextureUrl.value"
          @color-change="playground.setSelectedColor"
          @material-change="playground.applyMaterialToSelected"
          @material-property-change="(prop, val) => playground.updateSelectedMaterialProperty(prop, val)"
          @apply-texture="playground.applyTextureToSelected"
          @remove-texture="playground.removeTextureFromSelected"
        />
        <div v-else class="p-4 text-xs text-neutral-500 text-center">
          Selecciona un objeto
        </div>
      </div>
    </div>
  </div>
</template>
