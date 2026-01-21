import { ref } from 'vue'
import * as THREE from 'three'
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

// Light types configuration
export const LIGHT_TYPES = {
  spotlight: {
    name: 'Foco',
    icon: '🔦',
    description: 'Luz direccional concentrada'
  },
  pointlight: {
    name: 'Punto',
    icon: '💡',
    description: 'Luz omnidireccional'
  },
  arealight: {
    name: 'Softbox',
    icon: '📦',
    description: 'Luz suave y difusa (panel LED)'
  },
  hemisphere: {
    name: 'Hemisferio',
    icon: '🌤️',
    description: 'Luz cielo/suelo natural'
  },
  directional: {
    name: 'Direccional',
    icon: '☀️',
    description: 'Luz paralela tipo sol'
  }
}

// Cinematographic lighting presets
export const LIGHTING_PRESETS = {
  default: {
    name: 'Por Defecto',
    icon: '💡',
    description: 'Iluminacion basica de escena',
    ambient: { intensity: 0.3, color: 0xffffff },
    directional: { intensity: 0.5, color: 0xffffff, position: [5, 10, 5] },
    lights: []
  },
  threePoint: {
    name: '3 Puntos',
    icon: '🎬',
    description: 'Key + Fill + Back light (clasico cine)',
    ambient: { intensity: 0.1, color: 0xffffff },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [4, 5, 4], intensity: 120, color: 0xfff5e6, angle: 0.5, name: 'Key Light' },
      { type: 'spotlight', position: [-4, 4, 2], intensity: 40, color: 0xe6f0ff, angle: 0.6, name: 'Fill Light' },
      { type: 'spotlight', position: [0, 4, -5], intensity: 70, color: 0xffffff, angle: 0.4, name: 'Back Light' }
    ]
  },
  rembrandt: {
    name: 'Rembrandt',
    icon: '🎨',
    description: 'Dramatico, triangulo de luz bajo el ojo',
    ambient: { intensity: 0.05, color: 0x1a1a2e },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [3, 6, 3], intensity: 150, color: 0xffeedd, angle: 0.4, name: 'Key (45° alto)' },
      { type: 'spotlight', position: [-2, 2, 4], intensity: 20, color: 0xaabbcc, angle: 0.7, name: 'Fill suave' }
    ]
  },
  loop: {
    name: 'Loop',
    icon: '🔄',
    description: 'Sombra de nariz circular, retratos versatiles',
    ambient: { intensity: 0.15, color: 0xffffff },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [2.5, 5, 4], intensity: 100, color: 0xfff8f0, angle: 0.5, name: 'Key (30-45°)' },
      { type: 'spotlight', position: [-3, 3, 3], intensity: 35, color: 0xf0f5ff, angle: 0.6, name: 'Fill' }
    ]
  },
  split: {
    name: 'Split',
    icon: '◐',
    description: '90° lateral, mitad iluminada - misterioso',
    ambient: { intensity: 0.02, color: 0x0a0a15 },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [6, 3, 0], intensity: 130, color: 0xffeedd, angle: 0.35, name: 'Key lateral 90°' }
    ]
  },
  butterfly: {
    name: 'Butterfly',
    icon: '🦋',
    description: 'Frontal alta, glamour Hollywood',
    ambient: { intensity: 0.1, color: 0xffffff },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [0, 7, 4], intensity: 120, color: 0xfff5ee, angle: 0.45, name: 'Key frontal alto' },
      { type: 'arealight', position: [0, 0.5, 3], intensity: 3, color: 0xffffff, width: 4, height: 2, name: 'Reflector' }
    ]
  },
  natural: {
    name: 'Luz Natural',
    icon: '🪟',
    description: 'Simula luz de ventana lateral',
    ambient: { intensity: 0.2, color: 0xe8f0ff },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'arealight', position: [-6, 4, 0], intensity: 8, color: 0xfff8f0, width: 3, height: 5, rotationY: Math.PI / 2, name: 'Ventana' },
      { type: 'hemisphere', skyColor: 0x87ceeb, groundColor: 0x444444, intensity: 0.4, name: 'Cielo' }
    ]
  },
  lowKey: {
    name: 'Low Key',
    icon: '🌑',
    description: 'Alto contraste, cine negro, thriller',
    ambient: { intensity: 0.01, color: 0x000005 },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [3, 5, 2], intensity: 180, color: 0xffeedd, angle: 0.3, name: 'Key duro' }
    ]
  },
  highKey: {
    name: 'High Key',
    icon: '☀️',
    description: 'Brillante, pocas sombras - comedia, comerciales',
    ambient: { intensity: 0.5, color: 0xffffff },
    directional: { intensity: 0.3, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'arealight', position: [0, 6, 3], intensity: 10, color: 0xffffff, width: 6, height: 4, name: 'Panel principal' },
      { type: 'arealight', position: [-4, 4, 0], intensity: 6, color: 0xffffff, width: 3, height: 3, rotationY: Math.PI / 3, name: 'Fill izquierda' },
      { type: 'arealight', position: [4, 4, 0], intensity: 6, color: 0xffffff, width: 3, height: 3, rotationY: -Math.PI / 3, name: 'Fill derecha' }
    ]
  },
  studio: {
    name: 'Estudio Foto',
    icon: '📷',
    description: 'Setup tipico de estudio fotografico',
    ambient: { intensity: 0.15, color: 0xffffff },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'arealight', position: [3, 5, 3], intensity: 8, color: 0xfff5ee, width: 2, height: 3, name: 'Softbox Key' },
      { type: 'arealight', position: [-3, 4, 2], intensity: 4, color: 0xf5f8ff, width: 2, height: 2, name: 'Softbox Fill' },
      { type: 'spotlight', position: [0, 5, -4], intensity: 60, color: 0xffffff, angle: 0.35, name: 'Hair Light' }
    ]
  },
  dramatic: {
    name: 'Dramatico',
    icon: '🎭',
    description: 'Iluminacion teatral intensa',
    ambient: { intensity: 0.02, color: 0x0a0515 },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'spotlight', position: [0, 8, 0], intensity: 200, color: 0xffeedd, angle: 0.25, name: 'Cenital' },
      { type: 'spotlight', position: [5, 2, 5], intensity: 40, color: 0xff6644, angle: 0.4, name: 'Acento calido' },
      { type: 'spotlight', position: [-5, 2, 5], intensity: 40, color: 0x4466ff, angle: 0.4, name: 'Acento frio' }
    ]
  },
  neon: {
    name: 'Neon/Cyberpunk',
    icon: '🌆',
    description: 'Colores neon estilo cyberpunk',
    ambient: { intensity: 0.05, color: 0x0a0020 },
    directional: { intensity: 0, color: 0xffffff, position: [5, 10, 5] },
    lights: [
      { type: 'arealight', position: [-4, 3, 0], intensity: 8, color: 0xff00ff, width: 0.5, height: 4, name: 'Neon magenta' },
      { type: 'arealight', position: [4, 3, 0], intensity: 8, color: 0x00ffff, width: 0.5, height: 4, name: 'Neon cyan' },
      { type: 'spotlight', position: [0, 6, 4], intensity: 50, color: 0xffffff, angle: 0.5, name: 'Key suave' }
    ]
  }
}

// URL for free human model (CC0 license)
export const HUMAN_MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb'

export function useThreeLights(core, objectsManager) {
  const ambientIntensity = ref(0.4)
  const directionalIntensity = ref(0.6)
  // Add spotlight
  const addSpotlight = (options = {}) => {
    if (!core.scene.value) return null

    const color = new THREE.Color(options.color || objectsManager.themeColor.value)
    const posX = options.x ?? (Math.random() - 0.5) * 4
    const posZ = options.z ?? (Math.random() - 0.5) * 4
    const posY = options.y ?? 5

    const spotlight = new THREE.SpotLight(color, options.intensity ?? 100)
    spotlight.position.set(posX, posY, posZ)
    spotlight.angle = options.angle ?? Math.PI / 5
    spotlight.penumbra = options.penumbra ?? 0.5
    spotlight.decay = options.decay ?? 1.5
    spotlight.distance = options.distance ?? 30
    spotlight.castShadow = true
    spotlight.shadow.mapSize.width = 1024
    spotlight.shadow.mapSize.height = 1024

    const target = new THREE.Object3D()
    target.position.set(posX, 0, posZ)
    core.scene.value.add(target)
    spotlight.target = target

    const helper = new THREE.SpotLightHelper(spotlight)
    core.scene.value.add(helper)

    const sphereGeom = new THREE.SphereGeometry(0.2, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    })
    const lightMesh = new THREE.Mesh(sphereGeom, sphereMat)
    lightMesh.position.copy(spotlight.position)

    lightMesh.userData = {
      type: 'spotlight',
      id: Date.now(),
      isUserObject: true,
      light: spotlight,
      helper: helper,
      target: target
    }

    core.scene.value.add(spotlight)
    core.scene.value.add(lightMesh)
    objectsManager.objects.value = [...objectsManager.objects.value, lightMesh]

    return lightMesh
  }

  // Add point light
  const addPointLight = (options = {}) => {
    if (!core.scene.value) return null

    const color = new THREE.Color(options.color || objectsManager.themeColor.value)

    const pointLight = new THREE.PointLight(color, options.intensity ?? 80)
    pointLight.position.set(
      options.x ?? (Math.random() - 0.5) * 4,
      options.y ?? 3,
      options.z ?? (Math.random() - 0.5) * 4
    )
    pointLight.decay = options.decay ?? 1.5
    pointLight.distance = options.distance ?? 20
    pointLight.castShadow = true
    pointLight.shadow.mapSize.width = 1024
    pointLight.shadow.mapSize.height = 1024

    const helper = new THREE.PointLightHelper(pointLight, 0.3)
    core.scene.value.add(helper)

    const sphereGeom = new THREE.SphereGeometry(0.2, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    })
    const lightMesh = new THREE.Mesh(sphereGeom, sphereMat)
    lightMesh.position.copy(pointLight.position)

    lightMesh.userData = {
      type: 'pointlight',
      id: Date.now(),
      isUserObject: true,
      light: pointLight,
      helper: helper
    }

    core.scene.value.add(pointLight)
    core.scene.value.add(lightMesh)
    objectsManager.objects.value = [...objectsManager.objects.value, lightMesh]

    return lightMesh
  }

  // Add ambient light
  const addAmbientLight = (options = {}) => {
    if (!core.scene.value) return null

    const color = new THREE.Color(options.color || 0xffffff)
    const ambientLight = new THREE.AmbientLight(color, options.intensity ?? 0.5)
    ambientLight.name = 'ambientLight'
    core.scene.value.add(ambientLight)

    return ambientLight
  }

  // Set ambient light intensity
  const setAmbientIntensity = (intensity) => {
    ambientIntensity.value = intensity
    if (!core.scene.value) return
    const ambient = core.scene.value.getObjectByName('ambientLight')
    if (ambient) {
      ambient.intensity = intensity
    }
  }

  // Set directional light intensity
  const setDirectionalIntensity = (intensity) => {
    directionalIntensity.value = intensity
    if (!core.scene.value) return
    const directional = core.scene.value.getObjectByName('directionalLight')
    if (directional) {
      directional.intensity = intensity
    }
  }

  // Initialize RectAreaLight uniforms (call once)
  let rectAreaLightInitialized = false
  const initRectAreaLight = () => {
    if (!rectAreaLightInitialized) {
      RectAreaLightUniformsLib.init()
      rectAreaLightInitialized = true
    }
  }

  // Add area light (softbox/panel)
  const addAreaLight = (options = {}) => {
    if (!core.scene.value) return null
    initRectAreaLight()

    const color = new THREE.Color(options.color || objectsManager.themeColor.value)
    const width = options.width ?? 2
    const height = options.height ?? 2
    const intensity = options.intensity ?? 5

    const areaLight = new THREE.RectAreaLight(color, intensity, width, height)
    areaLight.position.set(
      options.x ?? options.position?.[0] ?? 0,
      options.y ?? options.position?.[1] ?? 4,
      options.z ?? options.position?.[2] ?? 3
    )
    areaLight.lookAt(0, 0, 0)

    if (options.rotationY) {
      areaLight.rotation.y = options.rotationY
    }

    const helper = new RectAreaLightHelper(areaLight)
    areaLight.add(helper)

    // Visual mesh for selection
    const meshGeom = new THREE.PlaneGeometry(width, height)
    const meshMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const lightMesh = new THREE.Mesh(meshGeom, meshMat)
    lightMesh.position.copy(areaLight.position)
    lightMesh.rotation.copy(areaLight.rotation)

    lightMesh.userData = {
      type: 'arealight',
      id: Date.now(),
      isUserObject: true,
      light: areaLight,
      helper: helper,
      name: options.name || 'Area Light'
    }

    core.scene.value.add(areaLight)
    core.scene.value.add(lightMesh)
    objectsManager.objects.value = [...objectsManager.objects.value, lightMesh]

    return lightMesh
  }

  // Add hemisphere light
  const addHemisphereLight = (options = {}) => {
    if (!core.scene.value) return null

    const skyColor = new THREE.Color(options.skyColor || 0x87ceeb)
    const groundColor = new THREE.Color(options.groundColor || 0x444444)
    const intensity = options.intensity ?? 0.5

    const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, intensity)
    hemiLight.position.set(0, options.y ?? 10, 0)

    const helper = new THREE.HemisphereLightHelper(hemiLight, 1)
    core.scene.value.add(helper)

    // Visual mesh
    const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: skyColor,
      transparent: true,
      opacity: 0.7
    })
    const lightMesh = new THREE.Mesh(sphereGeom, sphereMat)
    lightMesh.position.copy(hemiLight.position)

    lightMesh.userData = {
      type: 'hemisphere',
      id: Date.now(),
      isUserObject: true,
      light: hemiLight,
      helper: helper,
      name: options.name || 'Hemisphere Light'
    }

    core.scene.value.add(hemiLight)
    core.scene.value.add(lightMesh)
    objectsManager.objects.value = [...objectsManager.objects.value, lightMesh]

    return lightMesh
  }

  // Add user directional light
  const addDirectionalLight = (options = {}) => {
    if (!core.scene.value) return null

    const color = new THREE.Color(options.color || 0xffffff)
    const intensity = options.intensity ?? 1

    const dirLight = new THREE.DirectionalLight(color, intensity)
    dirLight.position.set(
      options.x ?? options.position?.[0] ?? 5,
      options.y ?? options.position?.[1] ?? 8,
      options.z ?? options.position?.[2] ?? 5
    )
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048

    const helper = new THREE.DirectionalLightHelper(dirLight, 1)
    core.scene.value.add(helper)

    // Visual mesh
    const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    })
    const lightMesh = new THREE.Mesh(sphereGeom, sphereMat)
    lightMesh.position.copy(dirLight.position)

    lightMesh.userData = {
      type: 'directional',
      id: Date.now(),
      isUserObject: true,
      light: dirLight,
      helper: helper,
      name: options.name || 'Directional Light'
    }

    core.scene.value.add(dirLight)
    core.scene.value.add(lightMesh)
    objectsManager.objects.value = [...objectsManager.objects.value, lightMesh]

    return lightMesh
  }

  // Clear all user-added lights (for preset switching)
  const clearUserLights = () => {
    if (!core.scene.value) return

    const lightsToRemove = objectsManager.objects.value.filter(obj =>
      ['spotlight', 'pointlight', 'arealight', 'hemisphere', 'directional'].includes(obj.userData.type)
    )

    lightsToRemove.forEach(lightMesh => {
      // Remove light
      if (lightMesh.userData.light) {
        core.scene.value.remove(lightMesh.userData.light)
        if (lightMesh.userData.light.dispose) {
          lightMesh.userData.light.dispose()
        }
      }
      // Remove helper
      if (lightMesh.userData.helper) {
        core.scene.value.remove(lightMesh.userData.helper)
        if (lightMesh.userData.helper.dispose) {
          lightMesh.userData.helper.dispose()
        }
      }
      // Remove target (for spotlights)
      if (lightMesh.userData.target) {
        core.scene.value.remove(lightMesh.userData.target)
      }
      // Remove mesh
      core.scene.value.remove(lightMesh)
      lightMesh.geometry?.dispose()
      lightMesh.material?.dispose()
    })

    objectsManager.objects.value = objectsManager.objects.value.filter(obj =>
      !['spotlight', 'pointlight', 'arealight', 'hemisphere', 'directional'].includes(obj.userData.type)
    )
  }

  // Apply lighting preset
  const currentPreset = ref('default')

  const applyLightingPreset = (presetKey) => {
    const preset = LIGHTING_PRESETS[presetKey]
    if (!preset) return false

    // Clear existing user lights
    clearUserLights()

    // Set ambient intensity
    if (preset.ambient) {
      setAmbientIntensity(preset.ambient.intensity)
      const ambient = core.scene.value?.getObjectByName('ambientLight')
      if (ambient && preset.ambient.color) {
        ambient.color.setHex(preset.ambient.color)
      }
    }

    // Set directional intensity
    if (preset.directional) {
      setDirectionalIntensity(preset.directional.intensity)
      const directional = core.scene.value?.getObjectByName('directionalLight')
      if (directional) {
        if (preset.directional.color) {
          directional.color.setHex(preset.directional.color)
        }
        if (preset.directional.position) {
          directional.position.set(...preset.directional.position)
        }
      }
    }

    // Add preset lights
    if (preset.lights) {
      preset.lights.forEach(lightConfig => {
        switch (lightConfig.type) {
          case 'spotlight':
            addSpotlight({
              x: lightConfig.position?.[0],
              y: lightConfig.position?.[1],
              z: lightConfig.position?.[2],
              intensity: lightConfig.intensity,
              color: lightConfig.color,
              angle: lightConfig.angle,
              name: lightConfig.name
            })
            break
          case 'pointlight':
            addPointLight({
              x: lightConfig.position?.[0],
              y: lightConfig.position?.[1],
              z: lightConfig.position?.[2],
              intensity: lightConfig.intensity,
              color: lightConfig.color,
              name: lightConfig.name
            })
            break
          case 'arealight':
            addAreaLight({
              position: lightConfig.position,
              intensity: lightConfig.intensity,
              color: lightConfig.color,
              width: lightConfig.width,
              height: lightConfig.height,
              rotationY: lightConfig.rotationY,
              name: lightConfig.name
            })
            break
          case 'hemisphere':
            addHemisphereLight({
              skyColor: lightConfig.skyColor,
              groundColor: lightConfig.groundColor,
              intensity: lightConfig.intensity,
              name: lightConfig.name
            })
            break
          case 'directional':
            addDirectionalLight({
              position: lightConfig.position,
              intensity: lightConfig.intensity,
              color: lightConfig.color,
              name: lightConfig.name
            })
            break
        }
      })
    }

    currentPreset.value = presetKey
    return true
  }

  return {
    // State
    ambientIntensity,
    directionalIntensity,
    currentPreset,

    // Methods - Basic lights
    addSpotlight,
    addPointLight,
    addAmbientLight,
    setAmbientIntensity,
    setDirectionalIntensity,

    // Methods - Extended light types
    addAreaLight,
    addHemisphereLight,
    addDirectionalLight,

    // Methods - Presets
    clearUserLights,
    applyLightingPreset
  }
}
