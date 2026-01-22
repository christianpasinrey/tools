import { ref } from 'vue'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

// Preset environments (using free HDRIs from Poly Haven)
// showSky: true = muestra el HDRI como fondo/cielo
export const ENVIRONMENT_PRESETS = {
  none: {
    name: 'Sin entorno',
    icon: '🌑',
    url: null,
    background: 0x0a0a0a,
    showSky: false
  },
  studio: {
    name: 'Estudio',
    icon: '📷',
    description: 'Iluminación de estudio profesional',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
    showSky: false
  },
  // --- Cielos y exteriores ---
  blueSky: {
    name: 'Cielo Azul',
    icon: '☀️',
    description: 'Día despejado con cielo azul',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr',
    showSky: true
  },
  sunset: {
    name: 'Atardecer',
    icon: '🌅',
    description: 'Puesta de sol cálida',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr',
    showSky: true
  },
  cloudy: {
    name: 'Nublado',
    icon: '☁️',
    description: 'Cielo con nubes dramáticas',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_overcast_puresky_1k.hdr',
    showSky: true
  },
  night: {
    name: 'Noche',
    icon: '🌙',
    description: 'Cielo nocturno estrellado',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr',
    showSky: true
  },
  // --- Naturaleza ---
  forest: {
    name: 'Bosque',
    icon: '🌲',
    description: 'Claro en un bosque',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/syferfontein_0d_clear_puresky_1k.hdr',
    showSky: true
  },
  beach: {
    name: 'Playa',
    icon: '🏖️',
    description: 'Costa con mar y cielo',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/cape_hill_1k.hdr',
    showSky: true
  },
  field: {
    name: 'Campo',
    icon: '🌾',
    description: 'Pradera abierta',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/meadow_at_buzludzha_1k.hdr',
    showSky: true
  },
  // --- Urbano ---
  city: {
    name: 'Ciudad',
    icon: '🏙️',
    description: 'Plaza urbana',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
    showSky: true
  },
  parking: {
    name: 'Parking',
    icon: '🅿️',
    description: 'Aparcamiento exterior',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/evening_road_01_puresky_1k.hdr',
    showSky: true
  },
  // --- Interiores ---
  warehouse: {
    name: 'Almacén',
    icon: '🏭',
    description: 'Interior industrial',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
    showSky: false
  },
  hall: {
    name: 'Salón',
    icon: '🏛️',
    description: 'Interior elegante',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/museum_of_ethnography_1k.hdr',
    showSky: false
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
      showBackground.value = false
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

      // Apply environment for reflections/lighting
      core.scene.value.environment = texture
      core.scene.value.environmentIntensity = environmentIntensity.value

      // Use preset's showSky setting to determine if we show the sky/background
      showBackground.value = preset.showSky ?? false
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
