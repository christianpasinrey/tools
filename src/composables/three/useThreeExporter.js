import { ref } from 'vue'
import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

export function useThreeExporter(core, objectsManager) {
  const isExporting = ref(false)

  // Take screenshot
  const takeScreenshot = (options = {}) => {
    if (!core.renderer.value) return null

    const {
      width = core.renderer.value.domElement.width,
      height = core.renderer.value.domElement.height,
      format = 'png',
      quality = 1.0,
      transparent = false
    } = options

    // Store original settings
    const originalClearColor = core.renderer.value.getClearColor(new THREE.Color())
    const originalClearAlpha = core.renderer.value.getClearAlpha()

    // Set transparent background if requested
    if (transparent) {
      core.renderer.value.setClearColor(0x000000, 0)
    }

    // Render
    core.renderer.value.render(core.scene.value, core.camera.value)

    // Get data URL
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
    const dataURL = core.renderer.value.domElement.toDataURL(mimeType, quality)

    // Restore original settings
    core.renderer.value.setClearColor(originalClearColor, originalClearAlpha)

    return dataURL
  }

  // Download screenshot
  const downloadScreenshot = (filename = 'screenshot', options = {}) => {
    const dataURL = takeScreenshot(options)
    if (!dataURL) return false

    const link = document.createElement('a')
    link.download = `${filename}.${options.format || 'png'}`
    link.href = dataURL
    link.click()

    return true
  }

  // Export scene to GLTF
  const exportToGLTF = (options = {}) => {
    return new Promise((resolve, reject) => {
      if (!core.scene.value) {
        reject(new Error('Scene not initialized'))
        return
      }

      isExporting.value = true

      const exporter = new GLTFExporter()

      // Collect user objects only
      const objectsToExport = objectsManager.objects.value.filter(
        obj => obj.userData?.isUserObject && !obj.userData?.light
      )

      if (objectsToExport.length === 0) {
        isExporting.value = false
        reject(new Error('No hay objetos para exportar'))
        return
      }

      // Create a temporary scene with only user objects
      const exportScene = new THREE.Scene()
      objectsToExport.forEach(obj => {
        const clone = obj.clone()
        exportScene.add(clone)
      })

      exporter.parse(
        exportScene,
        (result) => {
          isExporting.value = false

          if (options.binary) {
            resolve(result) // ArrayBuffer for GLB
          } else {
            resolve(JSON.stringify(result, null, 2)) // JSON string for GLTF
          }
        },
        (error) => {
          isExporting.value = false
          reject(error)
        },
        {
          binary: options.binary ?? false,
          trs: options.trs ?? false,
          onlyVisible: true,
          truncateDrawRange: true
        }
      )
    })
  }

  // Download GLTF/GLB
  const downloadGLTF = async (filename = 'scene', binary = false) => {
    try {
      const data = await exportToGLTF({ binary })

      const blob = binary
        ? new Blob([data], { type: 'application/octet-stream' })
        : new Blob([data], { type: 'application/json' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${filename}.${binary ? 'glb' : 'gltf'}`
      link.href = url
      link.click()

      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Export error:', error)
      return false
    }
  }

  // Save scene to JSON (for later loading)
  const saveSceneToJSON = () => {
    const sceneData = {
      version: 1,
      timestamp: Date.now(),
      objects: objectsManager.objects.value.map(obj => ({
        type: obj.userData?.type || 'unknown',
        position: obj.position.toArray(),
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: obj.scale.toArray(),
        materialType: obj.userData?.materialType || 'standard',
        color: obj.material?.color ? '#' + obj.material.color.getHexString() : '#22c55e',
        // Light specific data
        lightData: obj.userData?.light ? {
          intensity: obj.userData.light.intensity,
          distance: obj.userData.light.distance,
          angle: obj.userData.light.angle,
          color: '#' + obj.userData.light.color.getHexString()
        } : null
      }))
    }

    return JSON.stringify(sceneData, null, 2)
  }

  // Download scene JSON
  const downloadSceneJSON = (filename = 'scene') => {
    const json = saveSceneToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${filename}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    return true
  }

  // Save to localStorage
  const saveToLocalStorage = (key = 'three-playground-scene') => {
    const json = saveSceneToJSON()
    localStorage.setItem(key, json)
    return true
  }

  // Load from localStorage
  const loadFromLocalStorage = (key = 'three-playground-scene') => {
    const json = localStorage.getItem(key)
    if (!json) return null
    return JSON.parse(json)
  }

  // Check if there's a saved scene
  const hasSavedScene = (key = 'three-playground-scene') => {
    return localStorage.getItem(key) !== null
  }

  return {
    // State
    isExporting,

    // Methods
    takeScreenshot,
    downloadScreenshot,
    exportToGLTF,
    downloadGLTF,
    saveSceneToJSON,
    downloadSceneJSON,
    saveToLocalStorage,
    loadFromLocalStorage,
    hasSavedScene
  }
}
