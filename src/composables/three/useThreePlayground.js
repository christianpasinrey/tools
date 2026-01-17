import { ref, computed, watch } from 'vue'
import { useThreeCore } from './useThreeCore.js'
import { useThreeObjects } from './useThreeObjects.js'
import { useThreeLights } from './useThreeLights.js'
import { useThreeMaterials, MATERIAL_PRESETS } from './useThreeMaterials.js'
import { useThreePostProcessing } from './useThreePostProcessing.js'
import { useThreeImporter } from './useThreeImporter.js'
import { useThreeExporter } from './useThreeExporter.js'
import { useThreeEnvironment, ENVIRONMENT_PRESETS } from './useThreeEnvironment.js'

export function useThreePlayground() {
  // Initialize core
  const core = useThreeCore()

  // Initialize managers
  const objects = useThreeObjects(core)
  const lights = useThreeLights(core, objects)
  const materials = useThreeMaterials()
  const postProcessing = useThreePostProcessing(core)
  const importer = useThreeImporter(core, objects)
  const exporter = useThreeExporter(core, objects)
  const environment = useThreeEnvironment(core)

  // Animation control
  const animationPaused = ref(false)
  let pausedTime = 0
  let timeOffset = 0

  // Unified initialization
  const init = (container) => {
    // Initialize core (scene, camera, renderer)
    core.init(container)

    // Initialize sub-modules
    objects.init()
    environment.init()
    importer.init()

    // Setup post-processing
    postProcessing.init()

    // Setup render loop with post-processing
    core.setSkipDefaultRender(true) // We handle rendering ourselves
    core.onAnimate((time) => {
      // Calculate effective time (accounting for pauses)
      let effectiveTime = time
      if (animationPaused.value) {
        if (pausedTime === 0) pausedTime = time
        effectiveTime = pausedTime - timeOffset
      } else {
        if (pausedTime > 0) {
          timeOffset += time - pausedTime
          pausedTime = 0
        }
        effectiveTime = time - timeOffset
      }

      // Update light helpers and run per-object animations
      objects.objects.value.forEach(obj => {
        if (obj.userData?.lightHelper) {
          obj.userData.lightHelper.update()
        }
        // Run custom animation if defined (only when not paused)
        if (obj.userData?.animate && !animationPaused.value) {
          obj.userData.animate(effectiveTime, obj)
        }
      })

      // Use post-processing render if bloom is enabled
      if (!postProcessing.render()) {
        // Normal render if post-processing didn't render
        if (core.renderer.value && core.scene.value && core.camera.value) {
          core.renderer.value.render(core.scene.value, core.camera.value)
        }
      }
    })

    return true
  }

  // Handle resize
  const handleResize = (width, height) => {
    core.handleResize(width, height)
    postProcessing.handleResize(width, height)
  }

  // Cleanup all resources
  const destroy = () => {
    objects.destroy()
    postProcessing.destroy()
    environment.destroy()
    importer.destroy()
    core.destroy()
  }

  // Apply material to selected object
  const applyMaterialToSelected = (presetKey) => {
    if (objects.selectedObject.value) {
      materials.applyMaterialPreset(objects.selectedObject.value, presetKey)
    }
  }

  // Change color of selected object
  const setSelectedColor = (color) => {
    if (objects.selectedObject.value) {
      materials.setObjectColor(objects.selectedObject.value, color)
    }
  }

  // Get material properties of selected object
  const getSelectedMaterialProperties = computed(() => {
    if (objects.selectedObject.value) {
      return materials.getMaterialProperties(objects.selectedObject.value)
    }
    return null
  })

  // Update selected object material property
  const updateSelectedMaterialProperty = (property, value) => {
    if (objects.selectedObject.value) {
      materials.updateMaterialProperty(objects.selectedObject.value, property, value)
    }
  }

  // Quick actions
  const quickActions = {
    // Take screenshot
    screenshot: (options) => exporter.downloadScreenshot('three-screenshot', options),

    // Export scene
    exportGLTF: () => exporter.downloadGLTF('scene', false),
    exportGLB: () => exporter.downloadGLTF('scene', true),
    exportJSON: () => exporter.downloadSceneJSON('scene'),

    // Save/Load
    saveScene: () => exporter.saveToLocalStorage(),
    loadScene: () => {
      const data = exporter.loadFromLocalStorage()
      if (data) {
        // TODO: Implement scene loading from JSON
        console.log('Scene data loaded:', data)
        return data
      }
      return null
    },

    // Clear scene
    clearScene: () => {
      // Deselect first
      objects.deselectObject()

      // Remove all user objects from scene and array
      const objectsToRemove = [...objects.objects.value]
      objectsToRemove.forEach(obj => {
        // Remove from Three.js scene
        if (core.scene.value && obj.parent) {
          obj.parent.remove(obj)
        }

        // Dispose geometry and material
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      // Clear the objects array
      objects.objects.value = []
    },

    // Reset camera
    resetCamera: () => core.resetCamera()
  }

  // File import handler
  const handleFileImport = async (event) => {
    const models = await importer.handleFileInput(event)
    if (models.length > 0) {
      // Select the first imported model
      objects.selectObject(models[0])
    }
    return models
  }

  return {
    // Core refs
    scene: core.scene,
    camera: core.camera,
    renderer: core.renderer,
    orbitControls: core.orbitControls,
    isInitialized: core.isInitialized,

    // Objects
    objects: objects.objects,
    selectedObject: objects.selectedObject,
    keysPressed: objects.keysPressed,
    addShape: objects.addShape,
    deleteObject: objects.deleteObject,
    deleteSelected: objects.deleteSelected,
    duplicateSelected: objects.duplicateSelected,
    selectObject: objects.selectObject,
    deselectObject: objects.deselectObject,

    // Lights
    ambientIntensity: lights.ambientIntensity,
    directionalIntensity: lights.directionalIntensity,
    addSpotlight: lights.addSpotlight,
    addPointLight: lights.addPointLight,
    setAmbientIntensity: lights.setAmbientIntensity,
    setDirectionalIntensity: lights.setDirectionalIntensity,

    // Materials
    MATERIAL_PRESETS,
    applyMaterialToSelected,
    setSelectedColor,
    getSelectedMaterialProperties,
    updateSelectedMaterialProperty,

    // Post-processing
    bloomEnabled: postProcessing.bloomEnabled,
    bloomStrength: postProcessing.bloomStrength,
    bloomRadius: postProcessing.bloomRadius,
    bloomThreshold: postProcessing.bloomThreshold,
    setBloomEnabled: postProcessing.setBloomEnabled,
    setBloomStrength: postProcessing.setBloomStrength,
    setBloomRadius: postProcessing.setBloomRadius,
    setBloomThreshold: postProcessing.setBloomThreshold,

    // Environment
    ENVIRONMENT_PRESETS,
    currentEnvironment: environment.currentEnvironment,
    showBackground: environment.showBackground,
    environmentIntensity: environment.environmentIntensity,
    isLoadingEnvironment: environment.isLoading,
    loadEnvironment: environment.loadEnvironment,
    setShowBackground: environment.setShowBackground,
    setEnvironmentIntensity: environment.setEnvironmentIntensity,

    // Import
    isImporting: importer.isLoading,
    importProgress: importer.loadProgress,
    importError: importer.loadError,
    handleFileImport,

    // Export
    isExporting: exporter.isExporting,
    hasSavedScene: exporter.hasSavedScene,

    // Quick actions
    quickActions,

    // Animation control
    animationPaused,
    setAnimationPaused: (paused) => { animationPaused.value = paused },

    // Lifecycle
    init,
    destroy,
    handleResize,
    resetCamera: core.resetCamera
  }
}
