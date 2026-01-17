import { ref } from 'vue'
import * as THREE from 'three'

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

  return {
    // State
    ambientIntensity,
    directionalIntensity,

    // Methods
    addSpotlight,
    addPointLight,
    addAmbientLight,
    setAmbientIntensity,
    setDirectionalIntensity
  }
}
