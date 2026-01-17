import { ref } from 'vue'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

// Preset environments (using free HDRIs from Poly Haven)
export const ENVIRONMENT_PRESETS = {
  none: {
    name: 'Ninguno',
    icon: '🌑',
    url: null,
    background: 0x0a0a0a
  },
  studio: {
    name: 'Estudio',
    icon: '📷',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
    background: null
  },
  sunset: {
    name: 'Atardecer',
    icon: '🌅',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr',
    background: null
  },
  night: {
    name: 'Noche',
    icon: '🌙',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr',
    background: null
  },
  forest: {
    name: 'Bosque',
    icon: '🌲',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/syferfontein_0d_clear_puresky_1k.hdr',
    background: null
  },
  city: {
    name: 'Ciudad',
    icon: '🏙️',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
    background: null
  }
}

export function useThreeEnvironment(core) {
  const currentEnvironment = ref('none')
  const isLoading = ref(false)
  const showBackground = ref(false)
  const environmentIntensity = ref(1.0)

  let rgbeLoader = null
  let currentEnvMap = null

  // Initialize
  const init = () => {
    rgbeLoader = new RGBELoader()
  }

  // Load environment
  const loadEnvironment = async (presetKey) => {
    if (!core.scene.value || !core.renderer.value) return false

    const preset = ENVIRONMENT_PRESETS[presetKey]
    if (!preset) return false

    currentEnvironment.value = presetKey
    isLoading.value = true

    // Clear previous environment
    if (currentEnvMap) {
      currentEnvMap.dispose()
      currentEnvMap = null
    }

    if (preset.url === null) {
      // No environment - reset to default
      core.scene.value.environment = null
      core.scene.value.background = new THREE.Color(preset.background)
      isLoading.value = false
      return true
    }

    try {
      const texture = await new Promise((resolve, reject) => {
        rgbeLoader.load(
          preset.url,
          (texture) => resolve(texture),
          undefined,
          (error) => reject(error)
        )
      })

      texture.mapping = THREE.EquirectangularReflectionMapping
      currentEnvMap = texture

      // Apply environment for reflections
      core.scene.value.environment = texture
      core.scene.value.environmentIntensity = environmentIntensity.value

      // Apply as background if enabled
      if (showBackground.value) {
        core.scene.value.background = texture
      } else {
        core.scene.value.background = new THREE.Color(0x0a0a0a)
      }

      isLoading.value = false
      return true
    } catch (error) {
      console.error('Error loading environment:', error)
      isLoading.value = false
      return false
    }
  }

  // Toggle background visibility
  const setShowBackground = (show) => {
    showBackground.value = show

    if (!core.scene.value) return

    if (show && currentEnvMap) {
      core.scene.value.background = currentEnvMap
    } else {
      core.scene.value.background = new THREE.Color(0x0a0a0a)
    }
  }

  // Set environment intensity
  const setEnvironmentIntensity = (intensity) => {
    environmentIntensity.value = intensity

    if (core.scene.value) {
      core.scene.value.environmentIntensity = intensity
    }
  }

  // Set background color (when no environment)
  const setBackgroundColor = (color) => {
    if (!core.scene.value) return

    if (!showBackground.value || !currentEnvMap) {
      core.scene.value.background = new THREE.Color(color)
    }
  }

  // Cleanup
  const destroy = () => {
    if (currentEnvMap) {
      currentEnvMap.dispose()
      currentEnvMap = null
    }
  }

  return {
    // State
    currentEnvironment,
    isLoading,
    showBackground,
    environmentIntensity,
    ENVIRONMENT_PRESETS,

    // Methods
    init,
    destroy,
    loadEnvironment,
    setShowBackground,
    setEnvironmentIntensity,
    setBackgroundColor
  }
}
