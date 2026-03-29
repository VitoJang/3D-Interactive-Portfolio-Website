import * as THREE from 'three'
import { GLTFLoader, Octree, Capsule } from 'three-stdlib'

const GRAVITY = 30
const CAPSULE_RADIUS = 0.35
const CAPSULE_HEIGHT = 1
const MOVE_SPEED = 2.5

export type InitOptions = {
  canvas: HTMLCanvasElement
  /** 0–1 while the GLB is downloading/decoding */
  onLoadProgress?: (ratio: number) => void
  onLoaded?: () => void
  onHotspotClick?: (id: string) => void
  onCursorChange?: (pointer: boolean) => void
}

let modalOpen = false
export function setModalOpen(open: boolean) { modalOpen = open }

let animationFrameId: number | null = null
let introStartCallback: (() => void) | null = null

export function startEnterAnimation() {
  introStartCallback?.()
}

export function disposeThree() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

export function initThree({
  canvas,
  onLoadProgress,
  onLoaded,
  onHotspotClick,
  onCursorChange,
}: InitOptions) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.7

  const camera = new THREE.PerspectiveCamera(
    15,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )
  const cameraOffset = new THREE.Vector3(30, 35, 20)
  const cameraPan = new THREE.Vector3(6, 2, 9)

  // Intro: Phase 1 = descend from sky to zoomed-out overview, Phase 2 = zoom in to gameplay
  const DESCEND_DURATION = 2.0
  const ZOOM_DURATION = 2.5
  const ZOOM_OUT_FACTOR = 3.5
  const SKY_Y_OFFSET = 250
  let introPhase: 'idle' | 'descend' | 'zoom' | 'done' = 'idle'
  let introProgress = 0
  let inputEnabled = false

  // Lighting
  const sun = new THREE.DirectionalLight(0xffffff, 1)
  sun.castShadow = true
  sun.position.set(280, 200, -80)
  sun.target.position.set(100, 0, -10)
  sun.shadow.mapSize.width = 4096
  sun.shadow.mapSize.height = 4096
  sun.shadow.camera.left = -150
  sun.shadow.camera.right = 300
  sun.shadow.camera.top = 150
  sun.shadow.camera.bottom = -100
  sun.shadow.normalBias = 0.2
  scene.add(sun.target)
  scene.add(sun)

  const ambient = new THREE.AmbientLight(0x404040, 2.7)
  scene.add(ambient)

  // Character state
  const character: {
    instance: THREE.Object3D | null
    spawnPosition: THREE.Vector3
  } = {
    instance: null,
    spawnPosition: new THREE.Vector3(),
  }
  let targetRotation = 0

  const timer = new THREE.Timer()
  let mixer: THREE.AnimationMixer | null = null
  let walkAction: THREE.AnimationAction | null = null
  let isWalking = false

  // Physics
  const colliderOctree = new Octree()
  const playerCollider = new Capsule(
    new THREE.Vector3(0, CAPSULE_RADIUS, 0),
    new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
    CAPSULE_RADIUS,
  )
  const playerVelocity = new THREE.Vector3()
  let playerOnFloor = false

  // Raycaster
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const intersectObjects: THREE.Object3D[] = []
  const originalScales = new Map<THREE.Object3D, THREE.Vector3>()
  let hoveredObject: THREE.Object3D | null = null
  const HOVER_SCALE = 1.15
  const SCALE_LERP_SPEED = 0.1

  const linkObjects: Record<string, { url: string; download?: boolean }> = {
    'Email': { url: 'mailto:vitojibom@hotmail.com' },
    'Github': { url: 'https://github.com/VitoJang' },
    'Linkedin': { url: 'https://www.linkedin.com/in/vito-jang-ab9aa81aa/' },
    'Resume': { url: '/Vito Jang Resume.pdf', download: true },
  }

  // Input
  const pressedButtons = { up: false, down: false, left: false, right: false }

  // Load GLB
  const loader = new GLTFLoader()
  loader.load(
    '/models/vitofolio.glb',
    (gltf) => {
      let armatureObj: THREE.Object3D | null = null

      gltf.scene.traverse((child) => {
        if (child.name.includes('Interact')) {
          intersectObjects.push(child)
          originalScales.set(child, child.scale.clone())
        }
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
        if (child.name === 'Armature') {
          armatureObj = child
        }
        if (child.name === 'Ground_Collider') {
          colliderOctree.fromGraphNode(child)
          child.visible = false
        }
      })

      if (armatureObj) {
        const wrapper = new THREE.Group()
        wrapper.name = 'CharacterWrapper'
        wrapper.position.copy((armatureObj as THREE.Object3D).position)
        ;(armatureObj as THREE.Object3D).position.set(0, 0, 0)

        const parent = (armatureObj as THREE.Object3D).parent
        if (parent) {
          parent.add(wrapper)
          parent.remove(armatureObj as THREE.Object3D)
          wrapper.add(armatureObj as THREE.Object3D)
        }

        character.spawnPosition.copy(wrapper.position)
        character.instance = wrapper
        playerCollider.start
          .copy(wrapper.position)
          .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
        playerCollider.end
          .copy(wrapper.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))
      }

      scene.add(gltf.scene)

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene)
        const walkClip = gltf.animations.find(
          (clip) => clip.name === 'ArmatureAction'
        )
        if (walkClip) {
          walkClip.tracks = walkClip.tracks.filter((track) => {
            const objectName = track.name.split('.')[0]
            return objectName !== 'Armature'
          })
          walkAction = mixer.clipAction(walkClip)
          walkAction.loop = THREE.LoopRepeat
        } else {
          console.warn(
            'ArmatureAction not found. Available:',
            gltf.animations.map((c) => c.name),
          )
        }
      }

      introStartCallback = () => {
        introPhase = 'descend'
        introProgress = 0
      }

      onLoadProgress?.(1)
      onLoaded?.()
    },
    (progressEvent) => {
      const e = progressEvent as ProgressEvent
      if (e.lengthComputable && e.total > 0) {
        onLoadProgress?.(e.loaded / e.total)
      }
    },
    (error) => {
      console.error('Error loading GLB:', error)
      onLoadProgress?.(1)
      onLoaded?.()
    },
  )

  // Collision
  function playerCollisions() {
    const result = colliderOctree.capsuleIntersect(playerCollider)
    playerOnFloor = false
    if (result) {
      playerOnFloor = result.normal.y > 0
      playerCollider.translate(result.normal.multiplyScalar(result.depth))
    }
  }

  function respawnCharacter() {
    if (!character.instance) return
    character.instance.position.copy(character.spawnPosition)
    playerCollider.start
      .copy(character.spawnPosition)
      .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
    playerCollider.end
      .copy(character.spawnPosition)
      .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))
    playerVelocity.set(0, 0, 0)
  }

  const moveDirection = new THREE.Vector3()
  const camForward = new THREE.Vector3()
  const camRight = new THREE.Vector3()
  const worldUp = new THREE.Vector3(0, 1, 0)

  function updatePlayer() {
    if (!character.instance || !inputEnabled) return
    if (character.instance.position.y < -20) {
      respawnCharacter()
      return
    }

    // Gravity
    if (!playerOnFloor) {
      playerVelocity.y -= GRAVITY * 0.035
    } else {
      playerVelocity.y = 0
    }

    // Camera-relative walk on XZ plane (matches what you see on screen after rotating the camera)
    camera.getWorldDirection(camForward)
    camForward.y = 0
    if (camForward.lengthSq() < 1e-8) {
      camForward.set(0, 0, -1)
    } else {
      camForward.normalize()
    }
    // Screen-right on XZ; negate so A = left, D = right (matches key labels)
    camRight.crossVectors(worldUp, camForward).normalize().negate()

    moveDirection.set(0, 0, 0)
    if (pressedButtons.up) moveDirection.add(camForward)
    if (pressedButtons.down) moveDirection.sub(camForward)
    if (pressedButtons.right) moveDirection.add(camRight)
    if (pressedButtons.left) moveDirection.sub(camRight)

    const walking = moveDirection.lengthSq() > 0

    if (walking) {
      moveDirection.normalize()
      playerVelocity.x = moveDirection.x * MOVE_SPEED
      playerVelocity.z = moveDirection.z * MOVE_SPEED

      targetRotation = Math.atan2(-moveDirection.x, -moveDirection.z) + Math.PI / 2

      if (!isWalking) {
        walkAction?.reset().fadeIn(0.2).play()
        isWalking = true
      }
    } else {
      playerVelocity.x = 0
      playerVelocity.z = 0

      if (isWalking) {
        walkAction?.fadeOut(0.2)
        isWalking = false
      }
    }

    playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035))
    playerCollisions()

    character.instance.position.copy(playerCollider.start)
    character.instance.position.y -= CAPSULE_RADIUS

    // Smooth rotation toward movement direction
    const rotationDiff =
      ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
        3 * Math.PI) %
        (2 * Math.PI)) -
      Math.PI
    const finalRotation = character.instance.rotation.y + rotationDiff
    character.instance.rotation.y = THREE.MathUtils.lerp(
      character.instance.rotation.y,
      finalRotation,
      0.3,
    )
  }

  // Input handlers
  function onKeyDown(e: KeyboardEvent) {
    if (!inputEnabled) return
    if (e.code === 'KeyR') { respawnCharacter(); return }
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': pressedButtons.up = true; break
      case 'KeyS': case 'ArrowDown': pressedButtons.down = true; break
      case 'KeyA': case 'ArrowLeft': pressedButtons.left = true; break
      case 'KeyD': case 'ArrowRight': pressedButtons.right = true; break
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': pressedButtons.up = false; break
      case 'KeyS': case 'ArrowDown': pressedButtons.down = false; break
      case 'KeyA': case 'ArrowLeft': pressedButtons.left = false; break
      case 'KeyD': case 'ArrowRight': pressedButtons.right = false; break
    }
  }

  function onBlur() {
    pressedButtons.up = false
    pressedButtons.down = false
    pressedButtons.left = false
    pressedButtons.right = false
  }

  // Raycaster interaction
  function onMouseMove(e: MouseEvent) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  }

  function findInteractable(obj: THREE.Object3D): THREE.Object3D | null {
    let cur: THREE.Object3D | null = obj
    while (cur) {
      if (cur.name.includes('Interact')) return cur
      cur = cur.parent
    }
    return null
  }

  function getBaseName(interactName: string): string {
    return interactName.replace('_Interact', '')
  }

  function handleInteraction() {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(intersectObjects, true)
    if (intersects.length > 0) {
      const hit = intersects[0].object
      const interactable = findInteractable(hit)
      if (!interactable) return
      const baseName = getBaseName(interactable.name)
      if (linkObjects[baseName]) {
        const link = linkObjects[baseName]
        if (link.download) {
          const a = document.createElement('a')
          a.href = link.url
          a.download = link.url.split('/').pop() || 'download'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        } else {
          window.open(link.url, '_blank', 'noopener,noreferrer')
        }
      } else {
        onHotspotClick?.(baseName)
      }
    }
  }

  function onClick() {
    if (modalOpen) return
    handleInteraction()
  }

  // Resize
  function onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  // Event listeners
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('click', onClick)

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  function getFinalCameraPosition(): THREE.Vector3 {
    const charPos = character.instance?.position ?? character.spawnPosition
    return new THREE.Vector3(
      charPos.x + cameraOffset.x + 20 + cameraPan.x,
      cameraOffset.y + cameraPan.y,
      charPos.z + cameraOffset.z - 30 + cameraPan.z,
    )
  }

  function getFinalLookAt(): THREE.Vector3 {
    const charPos = character.instance?.position ?? character.spawnPosition
    const finalCamPos = getFinalCameraPosition()
    return new THREE.Vector3(
      charPos.x - 10 + cameraPan.x,
      finalCamPos.y - 39 + cameraPan.y,
      charPos.z - 10 + cameraPan.z,
    )
  }

  // Animation loop
  function animate() {
    timer.update()
    const delta = timer.getDelta()
    mixer?.update(delta)

    updatePlayer()

    const finalPos = getFinalCameraPosition()
    const finalLook = getFinalLookAt()
    const dir = new THREE.Vector3().subVectors(finalPos, finalLook)
    const zoomedOutPos = new THREE.Vector3().copy(finalLook).addScaledVector(dir, ZOOM_OUT_FACTOR)
    const skyPos = zoomedOutPos.clone().setY(zoomedOutPos.y + SKY_Y_OFFSET)
    const skyLook = finalLook.clone().setY(finalLook.y + SKY_Y_OFFSET)

    if (introPhase === 'descend') {
      introProgress = Math.min(introProgress + delta / DESCEND_DURATION, 1)
      const t = easeOutCubic(introProgress)

      camera.position.lerpVectors(skyPos, zoomedOutPos, t)
      const lookAt = new THREE.Vector3().lerpVectors(skyLook, finalLook, t)
      camera.lookAt(lookAt)

      if (introProgress >= 1) {
        introPhase = 'zoom'
        introProgress = 0
      }
    } else if (introPhase === 'zoom') {
      introProgress = Math.min(introProgress + delta / ZOOM_DURATION, 1)
      const t = easeOutCubic(introProgress)

      camera.position.lerpVectors(zoomedOutPos, finalPos, t)
      camera.lookAt(finalLook)

      if (introProgress >= 1) {
        introPhase = 'done'
        inputEnabled = true
      }
    } else if (introPhase === 'done' && character.instance) {
      camera.position.copy(finalPos)
      camera.lookAt(finalLook)
    } else {
      camera.position.copy(skyPos)
      camera.lookAt(skyLook)
    }

    // Hover detection and scale effect
    raycaster.setFromCamera(pointer, camera)
    const hoverIntersects = raycaster.intersectObjects(intersectObjects, true)
    const newHovered = hoverIntersects.length > 0
      ? findInteractable(hoverIntersects[0].object)
      : null

    if (newHovered !== hoveredObject) hoveredObject = newHovered
    onCursorChange?.(hoveredObject !== null)

    for (const obj of intersectObjects) {
      const orig = originalScales.get(obj)
      if (!orig) continue
      const target = obj === hoveredObject
        ? orig.x * HOVER_SCALE
        : orig.x
      obj.scale.lerp(
        new THREE.Vector3(
          target,
          obj === hoveredObject ? orig.y * HOVER_SCALE : orig.y,
          obj === hoveredObject ? orig.z * HOVER_SCALE : orig.z,
        ),
        SCALE_LERP_SPEED,
      )
    }

    renderer.render(scene, camera)
    animationFrameId = requestAnimationFrame(animate)
  }

  animate()

  // Cleanup
  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('click', onClick)
    disposeThree()
    renderer.dispose()
  }
}
