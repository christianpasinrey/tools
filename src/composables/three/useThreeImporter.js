import { ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

export function useThreeImporter(core, objectsManager) {
  const isLoading = ref(false)
  const loadProgress = ref(0)
  const loadError = ref(null)

  let gltfLoader = null
  let objLoader = null
  let fbxLoader = null
  let dracoLoader = null

  // Initialize loaders
  const init = () => {
    // DRACO decoder for compressed GLTF
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    // GLTF Loader
    gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    // OBJ Loader
    objLoader = new OBJLoader()

    // FBX Loader
    fbxLoader = new FBXLoader()
  }

  // Load GLTF/GLB file
  const loadGLTF = (file) => {
    return new Promise((resolve, reject) => {
      if (!core.scene.value) {
        reject(new Error('Scene not initialized'))
        return
      }

      isLoading.value = true
      loadProgress.value = 0
      loadError.value = null

      const url = URL.createObjectURL(file)

      gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim

          model.scale.multiplyScalar(scale)
          model.position.sub(center.multiplyScalar(scale))
          model.position.y += size.y * scale / 2

          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          model.userData = {
            type: 'model',
            id: Date.now(),
            isUserObject: true,
            filename: file.name
          }

          core.scene.value.add(model)
          objectsManager.objects.value = [...objectsManager.objects.value, model]

          URL.revokeObjectURL(url)
          isLoading.value = false
          loadProgress.value = 100

          resolve(model)
        },
        (progress) => {
          if (progress.total > 0) {
            loadProgress.value = (progress.loaded / progress.total) * 100
          }
        },
        (error) => {
          URL.revokeObjectURL(url)
          isLoading.value = false
          loadError.value = error.message
          reject(error)
        }
      )
    })
  }

  // Load OBJ file
  const loadOBJ = (file) => {
    return new Promise((resolve, reject) => {
      if (!core.scene.value) {
        reject(new Error('Scene not initialized'))
        return
      }

      isLoading.value = true
      loadProgress.value = 0
      loadError.value = null

      const url = URL.createObjectURL(file)

      objLoader.load(
        url,
        (obj) => {
          // Apply default material
          const material = new THREE.MeshStandardMaterial({
            color: objectsManager.themeColor.value,
            metalness: 0.3,
            roughness: 0.4
          })

          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = material
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          // Center and scale
          const box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim

          obj.scale.multiplyScalar(scale)
          obj.position.sub(center.multiplyScalar(scale))
          obj.position.y += size.y * scale / 2

          obj.userData = {
            type: 'model',
            id: Date.now(),
            isUserObject: true,
            filename: file.name
          }

          core.scene.value.add(obj)
          objectsManager.objects.value = [...objectsManager.objects.value, obj]

          URL.revokeObjectURL(url)
          isLoading.value = false
          loadProgress.value = 100

          resolve(obj)
        },
        (progress) => {
          if (progress.total > 0) {
            loadProgress.value = (progress.loaded / progress.total) * 100
          }
        },
        (error) => {
          URL.revokeObjectURL(url)
          isLoading.value = false
          loadError.value = error.message
          reject(error)
        }
      )
    })
  }

  // Load file based on extension
  const loadFile = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase()

    switch (extension) {
      case 'gltf':
      case 'glb':
        return loadGLTF(file)
      case 'obj':
        return loadOBJ(file)
      default:
        throw new Error(`Formato no soportado: ${extension}`)
    }
  }

  // Handle file input
  const handleFileInput = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return []

    const loaded = []
    for (const file of files) {
      try {
        const model = await loadFile(file)
        loaded.push(model)
      } catch (error) {
        console.error(`Error loading ${file.name}:`, error)
        loadError.value = `Error al cargar ${file.name}: ${error.message}`
      }
    }

    return loaded
  }

  // Cleanup
  const destroy = () => {
    if (dracoLoader) {
      dracoLoader.dispose()
    }
  }

  return {
    // State
    isLoading,
    loadProgress,
    loadError,

    // Methods
    init,
    destroy,
    loadFile,
    loadGLTF,
    loadOBJ,
    handleFileInput
  }
}
