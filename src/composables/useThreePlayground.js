import { ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function useThreePlayground() {
  // Core Three.js objects (not reactive)
  let scene = null
  let camera = null
  let renderer = null
  let orbitControls = null
  let animationId = null
  let containerEl = null
  let raycaster = null
  let mouse = null

  // Drag state
  let isDragging = false
  let dragPlane = null
  let dragOffset = new THREE.Vector3()
  let initialRotation = new THREE.Euler()
  let initialScale = new THREE.Vector3()
  let dragStart = new THREE.Vector2()

  // Keyboard movement state
  const keysPressed = ref({
    w: false, a: false, s: false, d: false,
    q: false, e: false
  })
  const moveSpeed = 0.1

  // Reactive state
  const objects = ref([])
  const selectedObject = ref(null)
  const isInitialized = ref(false)
  const themeColor = ref('#22c55e')
  const transformMode = ref('translate') // translate, rotate, scale

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

    // Raycaster for object selection
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // Orbit Controls
    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.05
    orbitControls.minDistance = 2
    orbitControls.maxDistance = 50

    // Drag plane for moving objects
    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

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

    // Handle mouse for selection and dragging
    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('dblclick', handleDoubleClick)

    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    isInitialized.value = true
    animate()
  }

  // Keyboard handlers
  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase()
    if (key in keysPressed.value) {
      keysPressed.value[key] = true
    }
  }

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase()
    if (key in keysPressed.value) {
      keysPressed.value[key] = false
    }
  }

  // Get mouse position in normalized device coordinates
  const getMouseNDC = (event) => {
    if (!containerEl) return null
    const rect = containerEl.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  // Handle mouse down - select or start drag
  const handleMouseDown = (event) => {
    if (!containerEl || !camera || !raycaster) return
    if (event.button !== 0) return // Only left click

    const ndc = getMouseNDC(event)
    if (!ndc) return

    mouse.set(ndc.x, ndc.y)
    raycaster.setFromCamera(mouse, camera)

    // Check if clicking on selected object to start dragging
    if (selectedObject.value) {
      const intersects = raycaster.intersectObject(selectedObject.value, false)
      if (intersects.length > 0) {
        isDragging = true
        orbitControls.enabled = false
        dragStart.set(event.clientX, event.clientY)

        // Setup based on transform mode
        if (transformMode.value === 'translate') {
          // Use a plane facing the camera for intuitive dragging
          const cameraDir = new THREE.Vector3()
          camera.getWorldDirection(cameraDir)
          dragPlane.setFromNormalAndCoplanarPoint(
            cameraDir.negate(),
            selectedObject.value.position
          )
          // Calculate offset
          const intersection = new THREE.Vector3()
          raycaster.ray.intersectPlane(dragPlane, intersection)
          if (intersection) {
            dragOffset.subVectors(selectedObject.value.position, intersection)
          }
        } else if (transformMode.value === 'rotate') {
          initialRotation.copy(selectedObject.value.rotation)
        } else if (transformMode.value === 'scale') {
          initialScale.copy(selectedObject.value.scale)
        }
        return
      }
    }

    // Otherwise, try to select a new object
    const selectableObjects = objects.value.filter(obj => obj.userData && obj.userData.id)
    const intersects = raycaster.intersectObjects(selectableObjects, false)

    if (intersects.length > 0) {
      selectObject(intersects[0].object)
    }
  }

  // Handle mouse move - drag if active
  const handleMouseMove = (event) => {
    if (!isDragging || !selectedObject.value) return

    const ndc = getMouseNDC(event)
    if (!ndc) return

    mouse.set(ndc.x, ndc.y)
    raycaster.setFromCamera(mouse, camera)

    if (transformMode.value === 'translate') {
      // Shift key = move vertically only
      if (event.shiftKey) {
        const deltaY = (dragStart.y - event.clientY) * 0.02
        selectedObject.value.position.y += deltaY
        dragStart.set(event.clientX, event.clientY)
      } else {
        const intersection = new THREE.Vector3()
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
          selectedObject.value.position.copy(intersection.add(dragOffset))
        }
      }
    } else if (transformMode.value === 'rotate') {
      const deltaX = (event.clientX - dragStart.x) * 0.01
      const deltaY = (event.clientY - dragStart.y) * 0.01
      selectedObject.value.rotation.y = initialRotation.y + deltaX
      selectedObject.value.rotation.x = initialRotation.x + deltaY
    } else if (transformMode.value === 'scale') {
      const delta = (event.clientX - dragStart.x) * 0.01
      const scaleFactor = Math.max(0.1, 1 + delta)
      selectedObject.value.scale.set(
        initialScale.x * scaleFactor,
        initialScale.y * scaleFactor,
        initialScale.z * scaleFactor
      )
    }
  }

  // Handle mouse up - stop dragging
  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false
      orbitControls.enabled = true
    }
  }

  // Double click to deselect
  const handleDoubleClick = () => {
    deselectObject()
  }

  // Select an object
  const selectObject = (obj) => {
    if (!scene) return

    // Deselect previous
    if (selectedObject.value && selectedObject.value !== obj) {
      // Remove highlight from previous
      if (selectedObject.value.material) {
        selectedObject.value.material.emissive?.setHex(0x000000)
      }
    }

    selectedObject.value = obj

    // Add highlight to selected
    if (obj.material && obj.material.emissive) {
      obj.material.emissive.setHex(0x333333)
    }
  }

  // Deselect object
  const deselectObject = () => {
    if (selectedObject.value && selectedObject.value.material) {
      selectedObject.value.material.emissive?.setHex(0x000000)
    }
    selectedObject.value = null
  }

  // Set transform mode
  const setTransformMode = (mode) => {
    transformMode.value = mode
  }

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Move selected object with WASD/QE keys
    if (selectedObject.value && camera) {
      const keys = keysPressed.value
      if (keys.w || keys.a || keys.s || keys.d || keys.q || keys.e) {
        // Get camera direction for relative movement
        const cameraDir = new THREE.Vector3()
        camera.getWorldDirection(cameraDir)
        cameraDir.y = 0
        cameraDir.normalize()

        const right = new THREE.Vector3()
        right.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0))

        // Apply movement (W/S = Y axis, A/D = left/right, Q/E = forward/back)
        if (keys.w) selectedObject.value.position.y += moveSpeed
        if (keys.s) selectedObject.value.position.y -= moveSpeed
        if (keys.d) selectedObject.value.position.addScaledVector(right, moveSpeed)
        if (keys.a) selectedObject.value.position.addScaledVector(right, -moveSpeed)
        if (keys.e) selectedObject.value.position.addScaledVector(cameraDir, moveSpeed)
        if (keys.q) selectedObject.value.position.addScaledVector(cameraDir, -moveSpeed)
      }
    }

    // Update objects with animation (only if not selected)
    objects.value.forEach(obj => {
      if (obj.userData && obj.userData.animate && obj !== selectedObject.value) {
        obj.userData.animate(obj)
      }
    })

    if (orbitControls) orbitControls.update()
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

    // Deselect any selected object
    deselectObject()

    // Remove user objects from scene (keep lights and grid)
    const toRemove = []
    scene.children.forEach(child => {
      if (child.userData && child.userData.id) {
        toRemove.push(child)
      }
    })

    toRemove.forEach(obj => {
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
    if (!camera || !orbitControls) return
    camera.position.set(5, 5, 5)
    orbitControls.target.set(0, 0, 0)
    orbitControls.update()
  }

  // Delete selected object
  const deleteSelected = () => {
    if (!selectedObject.value || !scene) return

    const obj = selectedObject.value
    deselectObject()

    scene.remove(obj)
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) obj.material.dispose()

    objects.value = objects.value.filter(o => o !== obj)
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

    if (renderer && renderer.domElement) {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick)
    }

    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)

    clearScene()

    if (renderer && containerEl) {
      containerEl.removeChild(renderer.domElement)
      renderer.dispose()
    }

    scene = null
    camera = null
    renderer = null
    orbitControls = null
    raycaster = null
    mouse = null
    isDragging = false
    isInitialized.value = false
  }

  return {
    // State
    isInitialized,
    objects,
    selectedObject,
    themeColor,
    transformMode,
    keysPressed,

    // Methods
    init,
    addShape,
    loadPreset,
    clearScene,
    selectObject,
    deselectObject,
    deleteSelected,
    setTransformMode,
    setThemeColor,
    resetCamera,
    toggleWireframe,
    destroy
  }
}
