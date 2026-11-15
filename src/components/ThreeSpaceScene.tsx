import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function ThreeSpaceScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#081326')
    scene.fog = new THREE.Fog('#081326', 7, 16)

    const camera = new THREE.PerspectiveCamera(36, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 0.2, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enableZoom = false
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.35
    controls.minPolarAngle = Math.PI / 2.5
    controls.maxPolarAngle = Math.PI / 1.8

    const sceneGroup = new THREE.Group()
    scene.add(sceneGroup)

    const texture = new THREE.TextureLoader().load('/astronaut.jpeg')
    texture.colorSpace = THREE.SRGBColorSpace
    const imagePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.7, 4.22),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.94 }),
    )
    imagePlane.position.set(0, 0.05, 0)
    sceneGroup.add(imagePlane)

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(6.86, 4.38),
      new THREE.MeshBasicMaterial({ color: '#334f73', transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
    )
    frame.position.z = -0.07
    sceneGroup.add(frame)

    const starsGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(420 * 3)
    for (let index = 0; index < starPositions.length; index += 3) {
      starPositions[index] = (Math.random() - 0.5) * 15
      starPositions[index + 1] = (Math.random() - 0.5) * 9
      starPositions[index + 2] = -1 - Math.random() * 5
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#b7d8ff', size: 0.025, transparent: true, opacity: 0.8 }))
    scene.add(stars)

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.012, 8, 120),
      new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.65 }),
    )
    orbit.rotation.x = Math.PI / 2.1
    orbit.rotation.z = -0.35
    orbit.position.set(1.7, -1.05, 0.35)
    scene.add(orbit)

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#ffb45c' }),
    )
    sun.position.set(3.18, -0.55, 0.4)
    scene.add(sun)

    scene.add(new THREE.AmbientLight('#afc9ed', 1.4))
    const keyLight = new THREE.PointLight('#ffd7a3', 2, 12)
    keyLight.position.set(3, 2, 4)
    scene.add(keyLight)

    const resize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const startedAt = performance.now()
    let animationFrame = 0
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000
      sceneGroup.rotation.y = Math.sin(elapsed * 0.35) * 0.025
      sceneGroup.rotation.x = Math.cos(elapsed * 0.28) * 0.012
      stars.rotation.y = elapsed * 0.008
      sun.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.08)
      controls.update()
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      controls.dispose()
      texture.dispose()
      imagePlane.geometry.dispose()
      imagePlane.material.dispose()
      frame.geometry.dispose()
      frame.material.dispose()
      starsGeometry.dispose()
      stars.material.dispose()
      orbit.geometry.dispose()
      orbit.material.dispose()
      sun.geometry.dispose()
      sun.material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="three-space-scene" ref={mountRef} aria-label="Interactive astronaut space scene" role="img" />
}
