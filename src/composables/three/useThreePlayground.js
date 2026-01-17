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

  // Unified initialization
  const init = (container) => {
    // Initialize core (scene, camera, renderer)
    core.init(container)

    // Initialize sub-modules
    objects.init()
    lights.init()
    environment.init()
    importer.init()

    // Setup post-processing
    postProcessing.init()

    // Setup render loop with post-processing
    core.onAnimate(() => {
      // Update light helpers if needed
      objects.objects.value.forEach(obj => {
        if (obj.userData?.lightHelper) {
          obj.userData.lightHelper.update()
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

    // Start animation
    core.animate()

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
      const objectsToRemove = [...objects.objects.value]
      objectsToRemove.forEach(obj => {
        objects.selectedObject.value = obj
        objects.deleteSelected()
      })
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

    // Lifecycle
    init,
    destroy,
    handleResize,
    resetCamera: core.resetCamera
  }
}
