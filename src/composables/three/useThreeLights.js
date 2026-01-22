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

// Pre-made scenes for lighting testing (all free/CC0)
export const SCENE_PRESETS = {
  sponza: {
    name: 'Sponza (Interior)',
    icon: '🏛️',
    description: 'Atrio clasico para testing de iluminacion',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Sponza/glTF/Sponza.gltf',
    scale: 1,
    position: [0, 0, 0]
  },
  littlestTokyo: {
    name: 'Tokyo Street',
    icon: '🏙️',
    description: 'Calle japonesa con detalles animados',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LittlestTokyo.glb',
    scale: 0.02,
    position: [0, 4, 0]
  },
  damagedHelmet: {
    name: 'Casco Scifi',
    icon: '🪖',
    description: 'Casco con materiales PBR detallados',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF/DamagedHelmet.gltf',
    scale: 2,
    position: [0, 1.5, 0]
  },
  flightHelmet: {
    name: 'Casco de Aviador',
    icon: '🛩️',
    description: 'Casco vintage con texturas detalladas',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/FlightHelmet/glTF/FlightHelmet.gltf',
    scale: 5,
    position: [0, 0, 0]
  },
  fox: {
    name: 'Zorro Animado',
    icon: '🦊',
    description: 'Zorro low-poly con animacion',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF/Fox.gltf',
    scale: 0.03,
    position: [0, 0, 0]
  },
  duck: {
    name: 'Pato de Goma',
    icon: '🦆',
    description: 'Clasico pato amarillo',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF/Duck.gltf',
    scale: 3,
    position: [0, 0, 0]
  },
  lantern: {
    name: 'Linterna',
    icon: '🏮',
    description: 'Linterna con materiales PBR',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF/Lantern.gltf',
    scale: 0.1,
    position: [0, 0, 0]
  },
  avocado: {
    name: 'Aguacate',
    icon: '🥑',
    description: 'Aguacate con texturas realistas',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF/Avocado.gltf',
    scale: 30,
    position: [0, 0.5, 0]
  },
  antiqueCamera: {
    name: 'Camara Antigua',
    icon: '📷',
    description: 'Camara fotografica vintage',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF/AntiqueCamera.gltf',
    scale: 0.3,
    position: [0, 0, 0]
  },
  toyCar: {
    name: 'Coche de Juguete',
    icon: '🚗',
    description: 'Coche con materiales brillantes',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF/ToyCar.gltf',
    scale: 100,
    position: [0, 0, 0]
  },
  waterBottle: {
    name: 'Botella de Agua',
    icon: '🍶',
    description: 'Botella con materiales transparentes',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/WaterBottle/glTF/WaterBottle.gltf',
    scale: 10,
    position: [0, 0, 0]
  },
  boomBox: {
    name: 'BoomBox Retro',
    icon: '📻',
    description: 'Radiocasete con texturas detalladas',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF/BoomBox.gltf',
    scale: 100,
    position: [0, 0.5, 0]
  }
}

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
  const lightTypes = ['spotlight', 'pointlight', 'arealight', 'hemisphere', 'directional']

  const clearUserLights = () => {
    if (!core.scene.value) return

    // First, find lights in the objects array
    const lightsToRemove = objectsManager.objects.value.filter(obj =>
      lightTypes.includes(obj.userData?.type)
    )

    // Remove each light and its associated objects
    lightsToRemove.forEach(lightMesh => {
      // Remove the actual light from scene
      if (lightMesh.userData?.light) {
        core.scene.value.remove(lightMesh.userData.light)
        lightMesh.userData.light.dispose?.()
      }
      // Remove helper
      if (lightMesh.userData?.helper) {
        core.scene.value.remove(lightMesh.userData.helper)
        lightMesh.userData.helper.dispose?.()
      }
      // Remove target (for spotlights)
      if (lightMesh.userData?.target) {
        core.scene.value.remove(lightMesh.userData.target)
      }
      // Remove the visual mesh
      core.scene.value.remove(lightMesh)
      lightMesh.geometry?.dispose()
      lightMesh.material?.dispose()
    })

    // Also scan the scene directly for any orphaned lights (belt and suspenders)
    const toRemoveFromScene = []
    core.scene.value.traverse((child) => {
      if (child.isSpotLight || child.isPointLight || child.isRectAreaLight ||
          child.isHemisphereLight || (child.isDirectionalLight && child.name !== 'directionalLight')) {
        toRemoveFromScene.push(child)
      }
      // Also remove helpers
      if (child.isSpotLightHelper || child.isPointLightHelper ||
          child.isHemisphereLightHelper || child.isDirectionalLightHelper) {
        toRemoveFromScene.push(child)
      }
    })

    toRemoveFromScene.forEach(obj => {
      core.scene.value.remove(obj)
      obj.dispose?.()
    })

    // Update the objects array
    objectsManager.objects.value = objectsManager.objects.value.filter(obj =>
      !lightTypes.includes(obj.userData?.type)
    )
  }

  // Apply lighting preset
  const currentPreset = ref('default')

  // Calculate scene bounding box (excluding lights)
  const getSceneBounds = () => {
    const box = new THREE.Box3()
    let hasObjects = false

    objectsManager.objects.value.forEach(obj => {
      // Skip lights
      if (lightTypes.includes(obj.userData?.type)) return

      const objBox = new THREE.Box3().setFromObject(obj)
      if (!objBox.isEmpty()) {
        box.union(objBox)
        hasObjects = true
      }
    })

    if (!hasObjects) {
      // Default bounds for empty scene
      return { center: new THREE.Vector3(0, 1, 0), size: new THREE.Vector3(2, 2, 2), scale: 1 }
    }

    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    // Scale factor based on the largest dimension (base presets are designed for ~2 unit objects)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = Math.max(1, maxDim / 2)

    return { center, size, scale }
  }

  const applyLightingPreset = (presetKey) => {
    const preset = LIGHTING_PRESETS[presetKey]
    if (!preset) return false

    // Clear existing user lights
    clearUserLights()

    // Get scene bounds for scaling light positions
    const bounds = getSceneBounds()
    const { center, scale } = bounds

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
          // Scale directional light position
          directional.position.set(
            preset.directional.position[0] * scale + center.x,
            preset.directional.position[1] * scale,
            preset.directional.position[2] * scale + center.z
          )
        }
      }
    }

    // Add preset lights with scaled positions
    if (preset.lights) {
      preset.lights.forEach(lightConfig => {
        // Scale positions relative to scene center
        const scaledPos = lightConfig.position ? [
          lightConfig.position[0] * scale + center.x,
          lightConfig.position[1] * scale + center.y,
          lightConfig.position[2] * scale + center.z
        ] : undefined

        // Scale distance for spotlights and point lights
        const scaledDistance = (lightConfig.distance || 30) * scale

        switch (lightConfig.type) {
          case 'spotlight':
            addSpotlight({
              x: scaledPos?.[0],
              y: scaledPos?.[1],
              z: scaledPos?.[2],
              intensity: lightConfig.intensity * scale, // Scale intensity for larger scenes
              color: lightConfig.color,
              angle: lightConfig.angle,
              distance: scaledDistance,
              name: lightConfig.name
            })
            break
          case 'pointlight':
            addPointLight({
              x: scaledPos?.[0],
              y: scaledPos?.[1],
              z: scaledPos?.[2],
              intensity: lightConfig.intensity * scale,
              color: lightConfig.color,
              distance: scaledDistance,
              name: lightConfig.name
            })
            break
          case 'arealight':
            addAreaLight({
              position: scaledPos,
              intensity: lightConfig.intensity * scale,
              color: lightConfig.color,
              width: (lightConfig.width || 2) * scale,
              height: (lightConfig.height || 2) * scale,
              rotationY: lightConfig.rotationY,
              name: lightConfig.name
            })
            break
          case 'hemisphere':
            addHemisphereLight({
              y: (lightConfig.y || 10) * scale + center.y,
              skyColor: lightConfig.skyColor,
              groundColor: lightConfig.groundColor,
              intensity: lightConfig.intensity,
              name: lightConfig.name
            })
            break
          case 'directional':
            addDirectionalLight({
              position: scaledPos,
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
