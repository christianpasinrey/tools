import { ref, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function useThreePlayground() {
  // Core Three.js objects (not reactive)
  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let animationId = null
  let containerEl = null

  // Reactive state
  const objects = ref([])
  const isInitialized = ref(false)
  const themeColor = ref('#22c55e')

  // Initialize Three.js
  const init = (container) => {
    if (isInitialized.value || !container) return
    containerEl = container

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    // Camera
    const aspect = container.clientWidth / container.clientHeight
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.position.set(5, 5, 5)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 50

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x222222)
    scene.add(gridHelper)

    // Handle resize
    window.addEventListener('resize', handleResize)

    isInitialized.value = true
    animate()
  }

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Update objects with animation
    objects.value.forEach(obj => {
      if (obj.userData && obj.userData.animate) {
        obj.userData.animate(obj)
      }
    })

    if (controls) controls.update()
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  // Handle window resize
  const handleResize = () => {
    if (!containerEl || !camera || !renderer) return

    const width = containerEl.clientWidth
    const height = containerEl.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // Add shape
  const addShape = (type) => {
    if (!scene) return null

    let geometry
    const color = new THREE.Color(themeColor.value)

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1)
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32)
        break
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100)
        break
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32)
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
        break
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(0.7)
        break
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(0.6)
        break
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(0.5)
        break
      case 'torusKnot':
        geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16)
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.5 + Math.random() * 2,
      (Math.random() - 0.5) * 4
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { type, id: Date.now() }

    scene.add(mesh)
    objects.value = [...objects.value, mesh]

    return mesh
  }

  // Clear all objects
  const clearScene = () => {
    if (!scene) return

    console.log('Clearing scene, objects:', objects.value.length)

    // Remove each object from scene
    objects.value.forEach(obj => {
      scene.remove(obj)
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })

    // Clear the array
    objects.value = []
    console.log('After clear, objects:', objects.value.length)
  }

  // Load preset scene
  const loadPreset = (presetId) => {
    clearScene()

    switch (presetId) {
      case 'cube': {
        const cube = addShape('cube')
        if (cube) {
          cube.position.set(0, 0.5, 0)
          cube.userData.animate = (obj) => {
            obj.rotation.x += 0.01
            obj.rotation.y += 0.01
          }
        }
        break
      }

      case 'spheres': {
        for (let i = 0; i < 20; i++) {
          const sphere = addShape('sphere')
          if (sphere) {
            const angle = (i / 20) * Math.PI * 2
            const radius = 3 + Math.random() * 2
            sphere.position.set(
              Math.cos(angle) * radius,
              0.5 + Math.random() * 3,
              Math.sin(angle) * radius
            )
            sphere.userData.angle = angle
            sphere.userData.radius = radius
            sphere.userData.speed = 0.005 + Math.random() * 0.01
            sphere.userData.animate = (obj) => {
              obj.userData.angle += obj.userData.speed
              obj.position.x = Math.cos(obj.userData.angle) * obj.userData.radius
              obj.position.z = Math.sin(obj.userData.angle) * obj.userData.radius
            }
          }
        }
        break
      }

      case 'particles': {
        createParticles()
        break
      }

      case 'waves': {
        createWaves()
        break
      }

      case 'empty':
      default:
        // Just clear, no objects
        break
    }
  }

  // Create particle system
  const createParticles = () => {
    if (!scene) return

    const particleCount = 5000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const color = new THREE.Color(themeColor.value)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = Math.random() * 10
      positions[i3 + 2] = (Math.random() - 0.5) * 20

      const mixedColor = color.clone()
      mixedColor.offsetHSL(Math.random() * 0.1, 0, Math.random() * 0.2 - 0.1)
      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    })

    const particles = new THREE.Points(geometry, material)
    particles.userData = {
      type: 'particles',
      id: Date.now(),
      animate: (obj) => {
        obj.rotation.y += 0.001
      }
    }

    scene.add(particles)
    objects.value = [...objects.value, particles]
  }

  // Create wave plane
  const createWaves = () => {
    if (!scene) return

    const geometry = new THREE.PlaneGeometry(15, 15, 50, 50)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeColor.value),
      wireframe: true,
      side: THREE.DoubleSide
    })

    const plane = new THREE.Mesh(geometry, material)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = 0.1
    plane.userData = {
      type: 'waves',
      id: Date.now(),
      animate: (obj) => {
        const positions = obj.geometry.attributes.position.array
        const time = Date.now() * 0.001
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i]
          const z = positions[i + 1]
          positions[i + 2] = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 0.5
        }
        obj.geometry.attributes.position.needsUpdate = true
      }
    }

    scene.add(plane)
    objects.value = [...objects.value, plane]
  }

  // Set theme color
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Reset camera
  const resetCamera = () => {
    if (!camera || !controls) return
    camera.position.set(5, 5, 5)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  // Toggle wireframe
  const toggleWireframe = () => {
    objects.value.forEach(obj => {
      if (obj.material && 'wireframe' in obj.material) {
        obj.material.wireframe = !obj.material.wireframe
      }
    })
  }

  // Cleanup
  const destroy = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    window.removeEventListener('resize', handleResize)

    clearScene()

    if (renderer && containerEl) {
      containerEl.removeChild(renderer.domElement)
      renderer.dispose()
    }

    scene = null
    camera = null
    renderer = null
    controls = null
    isInitialized.value = false
  }

  return {
    // State
    isInitialized,
    objects,
    themeColor,

    // Methods
    init,
    addShape,
    loadPreset,
    clearScene,
    setThemeColor,
    resetCamera,
    toggleWireframe,
    destroy
  }
}
