import { ref } from 'vue'
import * as THREE from 'three'

// Texture loader (singleton)
const textureLoader = new THREE.TextureLoader()

// Material presets
export const MATERIAL_PRESETS = {
  standard: {
    name: 'Estándar',
    icon: '🎨',
    create: (color) => new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4
    })
  },
  metal: {
    name: 'Metal',
    icon: '🔩',
    create: (color) => new THREE.MeshStandardMaterial({
      color,
      metalness: 1.0,
      roughness: 0.2
    })
  },
  glass: {
    name: 'Vidrio',
    icon: '🪟',
    create: (color) => new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.3
    })
  },
  rubber: {
    name: 'Goma',
    icon: '🏀',
    create: (color) => new THREE.MeshStandardMaterial({
      color,
      metalness: 0,
      roughness: 0.9
    })
  },
  emissive: {
    name: 'Emisivo',
    icon: '💡',
    create: (color) => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0,
      roughness: 0.5
    })
  },
  plastic: {
    name: 'Plástico',
    icon: '🧴',
    create: (color) => new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })
  },
  wood: {
    name: 'Madera',
    icon: '🪵',
    create: (color) => new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).offsetHSL(0.05, -0.3, -0.2),
      metalness: 0,
      roughness: 0.8
    })
  },
  wireframe: {
    name: 'Wireframe',
    icon: '🔲',
    create: (color) => new THREE.MeshBasicMaterial({
      color,
      wireframe: true
    })
  },
  toon: {
    name: 'Cartoon',
    icon: '🎭',
    create: (color) => new THREE.MeshToonMaterial({
      color
    })
  },
  normal: {
    name: 'Normal',
    icon: '🌈',
    create: () => new THREE.MeshNormalMaterial()
  }
}

export function useThreeMaterials() {
  const currentMaterialType = ref('standard')

  // Apply material preset to object
  const applyMaterialPreset = (object, presetKey) => {
    if (!object || !object.material) return false

    const preset = MATERIAL_PRESETS[presetKey]
    if (!preset) return false

    // Get current color
    const currentColor = object.material.color?.clone() || new THREE.Color(0x22c55e)

    // Dispose old material
    object.material.dispose()

    // Create new material
    object.material = preset.create(currentColor)
    object.userData.materialType = presetKey

    return true
  }

  // Change object color
  const setObjectColor = (object, color) => {
    if (!object || !object.material) return false

    const threeColor = new THREE.Color(color)
    object.material.color = threeColor

    // Update emissive for emissive materials
    if (object.material.emissive && object.userData.materialType === 'emissive') {
      object.material.emissive = threeColor
    }

    return true
  }

  // Get material properties for editing
  const getMaterialProperties = (object) => {
    if (!object || !object.material) return null

    const mat = object.material
    return {
      color: mat.color ? '#' + mat.color.getHexString() : '#ffffff',
      metalness: mat.metalness ?? 0,
      roughness: mat.roughness ?? 0.5,
      opacity: mat.opacity ?? 1,
      transparent: mat.transparent ?? false,
      emissiveIntensity: mat.emissiveIntensity ?? 0,
      wireframe: mat.wireframe ?? false
    }
  }

  // Update material property
  const updateMaterialProperty = (object, property, value) => {
    if (!object || !object.material) return false

    const mat = object.material

    switch (property) {
      case 'metalness':
        if ('metalness' in mat) mat.metalness = value
        break
      case 'roughness':
        if ('roughness' in mat) mat.roughness = value
        break
      case 'opacity':
        mat.opacity = value
        mat.transparent = value < 1
        break
      case 'emissiveIntensity':
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = value
        break
      case 'wireframe':
        if ('wireframe' in mat) mat.wireframe = value
        break
      default:
        return false
    }

    mat.needsUpdate = true
    return true
  }

  // Apply texture to object from image URL or data URL
  const applyTexture = (object, imageUrl) => {
    if (!object?.material) return false

    const texture = textureLoader.load(imageUrl, (loadedTexture) => {
      loadedTexture.colorSpace = THREE.SRGBColorSpace
      object.material.needsUpdate = true
    })

    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    // Handle different material types
    if (object.material.map !== undefined) {
      object.material.map = texture
    }

    object.material.needsUpdate = true
    object.userData.hasTexture = true
    object.userData.textureUrl = imageUrl

    return true
  }

  // Remove texture from object
  const removeTexture = (object) => {
    if (!object?.material) return false

    if (object.material.map) {
      object.material.map.dispose()
      object.material.map = null
    }

    object.material.needsUpdate = true
    object.userData.hasTexture = false
    object.userData.textureUrl = null

    return true
  }

  // Check if object has texture
  const hasTexture = (object) => {
    return object?.userData?.hasTexture || object?.material?.map != null
  }

  // Get texture URL from object
  const getTextureUrl = (object) => {
    return object?.userData?.textureUrl || null
  }

  return {
    currentMaterialType,
    MATERIAL_PRESETS,
    applyMaterialPreset,
    setObjectColor,
    getMaterialProperties,
    updateMaterialProperty,
    // Texture functions
    applyTexture,
    removeTexture,
    hasTexture,
    getTextureUrl
  }
}
