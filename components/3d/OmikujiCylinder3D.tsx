'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

interface OmikujiCylinder3DProps {
  isShaking: boolean
  isRevealed: boolean
  fortuneNumber?: number
  onDraw?: () => void
}

// 漢数字変換ヘルパー
const KANJI_NUMBERS = [
  '第一番', '第二番', '第三番', '第四番', '第五番', '第六番',
  '第七番', '第八番', '第九番', '第十番', '第十一番', '第十二番'
]

// Three.js による最高峰の Stylized Premium 和風 3D 想い出みくじコンポーネント
export function OmikujiCylinder3D({
  isShaking,
  isRevealed,
  fortuneNumber = 1,
  onDraw,
}: OmikujiCylinder3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isShakingRef = useRef(isShaking)
  const isRevealedRef = useRef(isRevealed)
  const onDrawRef = useRef(onDraw)
  const fortuneNumberRef = useRef(fortuneNumber)

  useEffect(() => {
    isShakingRef.current = isShaking
  }, [isShaking])

  useEffect(() => {
    isRevealedRef.current = isRevealed
  }, [isRevealed])

  useEffect(() => {
    onDrawRef.current = onDraw
  }, [onDraw])

  useEffect(() => {
    fortuneNumberRef.current = fortuneNumber
  }, [fortuneNumber])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 1. シーン、カメラ、レンダラーの初期化
    const width = container.clientWidth || 360
    const height = container.clientHeight || 280

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100)
    camera.position.set(0, 0.45, 7.8)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.28
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    // リアルな環境マップ（RoomEnvironment による鏡面反射）
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomScene = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomScene, 0.04).texture
    scene.environment = envTexture

    // 2. OrbitControls の設定（スムーズなダンピングと直感的な操作）
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.minDistance = 4.8
    controls.maxDistance = 11.5
    controls.minPolarAngle = Math.PI / 6
    controls.maxPolarAngle = (Math.PI * 5) / 8
    controls.target.set(0, -0.05, 0)

    // 3. スタジオ 3-Point ライティングシステム（ドラマチックな陰影とエッジ強調）
    // (A) Key Light: 左上からの力強い主光源（温白色）
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8)
    keyLight.position.set(-4.5, 6.0, 4.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    scene.add(keyLight)

    // (B) Fill Light: 右前からの柔らかな補助光
    const fillLight = new THREE.DirectionalLight(0xfdf7ee, 0.85)
    fillLight.position.set(3.5, 2.0, 3.0)
    scene.add(fillLight)

    // (C) Rim Light (Backlight): 右後方からの鋭い金光リムライト（背景と境界を際立たせる）
    const rimLight = new THREE.DirectionalLight(0xf5b041, 3.4)
    rimLight.position.set(4.0, 3.5, -4.5)
    scene.add(rimLight)

    // (D) Top Point Light: 上部開口部と金輪を照らすスポット光
    const topGlowLight = new THREE.PointLight(0xffe082, 2.0, 6)
    topGlowLight.position.set(0, 2.6, 0)
    scene.add(topGlowLight)

    // 4. メインオブジェクトグループ
    const mainRoot = new THREE.Group()
    scene.add(mainRoot)

    // (1) 接地面のコンタクトシャドウ（Contact Shadow - 濃厚な接地感）
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = 256
    shadowCanvas.height = 256
    const shadowCtx = shadowCanvas.getContext('2d')
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(128, 128, 15, 128, 128, 115)
      grad.addColorStop(0, 'rgba(20, 8, 3, 0.92)')
      grad.addColorStop(0.35, 'rgba(20, 8, 3, 0.55)')
      grad.addColorStop(0.75, 'rgba(20, 8, 3, 0.15)')
      grad.addColorStop(1, 'rgba(20, 8, 3, 0)')
      shadowCtx.fillStyle = grad
      shadowCtx.fillRect(0, 0, 256, 256)
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5)
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat)
    contactShadow.rotation.x = -Math.PI / 2
    contactShadow.position.y = -1.62
    mainRoot.add(contactShadow)

    // (2) 高級本物の金属ゴールド（Metallic Gold PBR Material）
    const goldMetalMat = new THREE.MeshStandardMaterial({
      color: 0xf5b842,
      roughness: 0.16,
      metalness: 0.96,
    })

    // (3) 神社の飾り台座グループ（洗練された比率）
    const pedestalGroup = new THREE.Group()
    pedestalGroup.position.y = -1.54
    mainRoot.add(pedestalGroup)

    const baseGeo = new THREE.CylinderGeometry(1.42, 1.55, 0.18, 8)
    baseGeo.rotateY(Math.PI / 8)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a0b05,
      roughness: 0.32,
      metalness: 0.12,
    })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    baseMesh.receiveShadow = true
    pedestalGroup.add(baseMesh)

    // 台座の金装飾金具
    const baseGoldRingGeo = new THREE.CylinderGeometry(1.44, 1.44, 0.035, 8)
    baseGoldRingGeo.rotateY(Math.PI / 8)
    const baseGoldRing = new THREE.Mesh(baseGoldRingGeo, goldMetalMat)
    baseGoldRing.position.y = 0.1
    pedestalGroup.add(baseGoldRing)

    // (4) 伝統工芸の手彫り木目テクスチャ（Wood Grain）
    const woodCanvas = document.createElement('canvas')
    woodCanvas.width = 512
    woodCanvas.height = 1024
    const wctx = woodCanvas.getContext('2d')
    if (wctx) {
      wctx.fillStyle = '#3a1608'
      wctx.fillRect(0, 0, 512, 1024)

      for (let y = 0; y < 1024; y += 3) {
        const wave = Math.sin(y * 0.018) * 16 + Math.cos(y * 0.045) * 8
        const alpha = 0.09 + Math.sin(y * 0.07 + wave * 0.1) * 0.06
        wctx.strokeStyle = `rgba(16, 4, 1, ${Math.max(0.03, alpha)})`
        wctx.lineWidth = 1.8
        wctx.beginPath()
        wctx.moveTo(0, y + wave)
        wctx.bezierCurveTo(170, y - wave * 0.5, 340, y + wave * 0.7, 512, y + wave * 0.3)
        wctx.stroke()
      }

      for (let i = 0; i < 350; i++) {
        const rx = Math.random() * 512
        const ry = Math.random() * 1024
        wctx.fillStyle = 'rgba(245, 184, 66, 0.04)'
        wctx.fillRect(rx, ry, 1, 5 + Math.random() * 8)
      }
    }
    const woodTexture = new THREE.CanvasTexture(woodCanvas)
    woodTexture.wrapS = THREE.RepeatWrapping
    woodTexture.wrapT = THREE.RepeatWrapping
    woodTexture.repeat.set(2, 1)

    // おみくじ筒グループ
    const cylinderGroup = new THREE.Group()
    mainRoot.add(cylinderGroup)

    // 漆塗り（Urushi）の鏡面八角柱本体（比率 2.8 でバランスを最適化）
    const cylinderGeo = new THREE.CylinderGeometry(0.86, 0.90, 2.75, 8)
    cylinderGeo.rotateY(Math.PI / 8)
    const lacquerMat = new THREE.MeshPhysicalMaterial({
      color: 0x3d170a,
      map: woodTexture,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      reflectivity: 0.8,
    })
    const cylinderMesh = new THREE.Mesh(cylinderGeo, lacquerMat)
    cylinderMesh.castShadow = true
    cylinderMesh.receiveShadow = true
    cylinderGroup.add(cylinderMesh)

    // 上下の装飾金帯（彫刻風リング）
    const ringGeo = new THREE.CylinderGeometry(0.885, 0.885, 0.13, 8)
    ringGeo.rotateY(Math.PI / 8)
    const topRing = new THREE.Mesh(ringGeo, goldMetalMat)
    topRing.position.y = 1.31
    cylinderGroup.add(topRing)

    const bottomRing = new THREE.Mesh(ringGeo, goldMetalMat)
    bottomRing.position.y = -1.31
    cylinderGroup.add(bottomRing)

    // 上蓋とみくじ棒出口
    const capGeo = new THREE.CylinderGeometry(0.83, 0.83, 0.08, 8)
    capGeo.rotateY(Math.PI / 8)
    const capMesh = new THREE.Mesh(capGeo, lacquerMat)
    capMesh.position.y = 1.40
    cylinderGroup.add(capMesh)

    const holeRimGeo = new THREE.TorusGeometry(0.18, 0.03, 12, 24)
    const holeRim = new THREE.Mesh(holeRimGeo, goldMetalMat)
    holeRim.rotation.x = Math.PI / 2
    holeRim.position.y = 1.44
    cylinderGroup.add(holeRim)

    const holeInnerGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16)
    const holeInnerMat = new THREE.MeshBasicMaterial({ color: 0x050201 })
    const holeInner = new THREE.Mesh(holeInnerGeo, holeInnerMat)
    holeInner.position.y = 1.40
    cylinderGroup.add(holeInner)

    // 正面フラット面にぴったり配置する 3D 看板プレート
    const signCanvas = document.createElement('canvas')
    signCanvas.width = 1024
    signCanvas.height = 2048
    const sctx = signCanvas.getContext('2d')
    if (sctx) {
      const grad = sctx.createLinearGradient(0, 0, 1024, 2048)
      grad.addColorStop(0, '#140501')
      grad.addColorStop(0.5, '#280f04')
      grad.addColorStop(1, '#110300')
      sctx.fillStyle = grad
      sctx.fillRect(0, 0, 1024, 2048)

      // 三重の精緻な金枠装飾
      sctx.strokeStyle = '#F5B842'
      sctx.lineWidth = 36
      sctx.strokeRect(48, 48, 928, 1952)

      sctx.strokeStyle = '#D4AF37'
      sctx.lineWidth = 14
      sctx.strokeRect(90, 90, 844, 1868)

      sctx.strokeStyle = '#FFE082'
      sctx.lineWidth = 6
      sctx.strokeRect(112, 112, 800, 1824)

      // 四隅の金花文様
      sctx.fillStyle = '#F5B842'
      sctx.beginPath()
      sctx.arc(130, 130, 32, 0, Math.PI * 2)
      sctx.arc(894, 130, 32, 0, Math.PI * 2)
      sctx.arc(130, 1918, 32, 0, Math.PI * 2)
      sctx.arc(894, 1918, 32, 0, Math.PI * 2)
      sctx.fill()

      // 純白（#FFFFFF）＋超極太漆黒輪郭（#000000, lineWidth 64）の超高コントラスト文字描画
      sctx.font = '900 350px "Yu Gothic", "Meiryo", "Hiragino Sans", "Segoe UI", sans-serif'
      sctx.textAlign = 'center'
      sctx.textBaseline = 'middle'

      const signChars = ['想', 'い', '出', '籤']
      const charY = [440, 800, 1160, 1520]

      signChars.forEach((c, i) => {
        // 1. 超極太の漆黒輪郭線（lineWidth 64 による圧倒的エッジ強調）
        sctx.shadowColor = '#000000'
        sctx.shadowBlur = 18
        sctx.lineWidth = 64
        sctx.strokeStyle = '#000000'
        sctx.lineJoin = 'round'
        sctx.miterLimit = 2
        sctx.strokeText(c, 512, charY[i])

        // 2. 純白の充填（文字をくっきり浮き立たせる）
        sctx.shadowBlur = 0
        sctx.fillStyle = '#FFFFFF'
        sctx.fillText(c, 512, charY[i])
      })
    }

    const signTexture = new THREE.CanvasTexture(signCanvas)
    signTexture.generateMipmaps = true
    signTexture.minFilter = THREE.LinearMipmapLinearFilter
    signTexture.magFilter = THREE.LinearFilter
    signTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const plaqueGeo = new THREE.BoxGeometry(0.68, 1.44, 0.03)
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.2,
      metalness: 0.1,
    })
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat)
    plaqueMesh.position.set(0, 0, 0.81)
    cylinderGroup.add(plaqueMesh)

    // (5) 内部の竹製みくじ棒束
    const stickMat = new THREE.MeshStandardMaterial({
      color: 0xf1dfc3,
      roughness: 0.45,
      metalness: 0.05,
    })

    const mainStickGroup = new THREE.Group()
    cylinderGroup.add(mainStickGroup)
    mainStickGroup.position.set(0, 0.2, 0)
    mainStickGroup.visible = false

    const mainStickGeo = new THREE.BoxGeometry(0.13, 2.5, 0.035)
    const mainStickMesh = new THREE.Mesh(mainStickGeo, stickMat)
    mainStickGroup.add(mainStickMesh)

    const tipGeo = new THREE.BoxGeometry(0.132, 0.35, 0.037)
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xc62828,
      roughness: 0.25,
    })
    const tipMesh = new THREE.Mesh(tipGeo, tipMat)
    tipMesh.position.y = 1.09
    mainStickGroup.add(tipMesh)

    // 棒上の番号テキスト（512x2048 極太高解像度）
    const stickCanvas = document.createElement('canvas')
    stickCanvas.width = 512
    stickCanvas.height = 2048
    const stickCtx = stickCanvas.getContext('2d')
    if (stickCtx) {
      stickCtx.fillStyle = '#F5E6CC'
      stickCtx.fillRect(0, 0, 512, 2048)
      stickCtx.fillStyle = '#100502'
      stickCtx.strokeStyle = '#100502'
      stickCtx.lineWidth = 20
      stickCtx.font = '900 290px "Yu Mincho", "Hiragino Mincho ProN", serif'
      stickCtx.textAlign = 'center'
      stickCtx.textBaseline = 'middle'
      const label = KANJI_NUMBERS[(fortuneNumberRef.current - 1) % KANJI_NUMBERS.length] || '第一番'
      const chars = label.split('')
      chars.forEach((c, idx) => {
        stickCtx.strokeText(c, 256, 420 + idx * 360)
        stickCtx.fillText(c, 256, 420 + idx * 360)
      })
    }
    const stickTexture = new THREE.CanvasTexture(stickCanvas)
    stickTexture.generateMipmaps = true
    stickTexture.minFilter = THREE.LinearMipmapLinearFilter
    stickTexture.magFilter = THREE.LinearFilter
    stickTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const stickLabelGeo = new THREE.PlaneGeometry(0.11, 0.9)
    const stickLabelMat = new THREE.MeshBasicMaterial({ map: stickTexture, transparent: true })
    const stickLabelMesh = new THREE.Mesh(stickLabelGeo, stickLabelMat)
    stickLabelMesh.position.set(0, 0.45, 0.019)
    mainStickGroup.add(stickLabelMesh)

    // (6) パーティクルシステム（金粉＆桜の花びら）
    const goldCount = 60
    const goldGeo = new THREE.BufferGeometry()
    const goldPositions = new Float32Array(goldCount * 3)
    const goldSpeeds = new Float32Array(goldCount)
    for (let i = 0; i < goldCount; i++) {
      goldPositions[i * 3] = (Math.random() - 0.5) * 4
      goldPositions[i * 3 + 1] = Math.random() * 5 - 2
      goldPositions[i * 3 + 2] = (Math.random() - 0.5) * 4
      goldSpeeds[i] = 0.3 + Math.random() * 0.5
    }
    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPositions, 3))
    const goldParticleMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    })
    const goldPoints = new THREE.Points(goldGeo, goldParticleMat)
    scene.add(goldPoints)

    // 桜の花びらパーティクル
    const petalCount = 24
    const petalGroup = new THREE.Group()
    scene.add(petalGroup)
    const petalMeshes: { mesh: THREE.Mesh; rotSpeed: THREE.Vector3; fallSpeed: number }[] = []

    const petalShape = new THREE.Shape()
    petalShape.moveTo(0, 0)
    petalShape.bezierCurveTo(0.08, 0.08, 0.12, 0.22, 0, 0.3)
    petalShape.bezierCurveTo(-0.12, 0.22, -0.08, 0.08, 0, 0)
    const petalGeo = new THREE.ShapeGeometry(petalShape)
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffb7c5,
      side: THREE.DoubleSide,
      roughness: 0.5,
      transparent: true,
      opacity: 0.85,
    })

    for (let i = 0; i < petalCount; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat)
      petal.position.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 6 - 1,
        (Math.random() - 0.5) * 5
      )
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      petalGroup.add(petal)
      petalMeshes.push({
        mesh: petal,
        rotSpeed: new THREE.Vector3(Math.random() * 0.03, Math.random() * 0.04, Math.random() * 0.02),
        fallSpeed: 0.25 + Math.random() * 0.35,
      })
    }

    // (7) Raycaster によるホバー＆ドラッグ判別クリック判定
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const clickableMeshes = [cylinderMesh, plaqueMesh, topRing, bottomRing, capMesh]
    let isHovered = false
    let isPointerDown = false
    let hasMovedBeyondThreshold = false
    let pointerDownPos = { x: 0, y: 0 }

    const handlePointerDown = (e: PointerEvent) => {
      // 主ポインターの左クリック・第1タッチ以外は無視
      if (e.button !== 0 || !e.isPrimary) return
      isPointerDown = true
      hasMovedBeyondThreshold = false
      pointerDownPos = { x: e.clientX, y: e.clientY }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (isPointerDown) {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y)
        if (dist > 6) {
          hasMovedBeyondThreshold = true
        }
      }

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(clickableMeshes)

      if (intersects.length > 0) {
        if (!isHovered) {
          isHovered = true
          container.style.cursor = 'pointer'
          goldMetalMat.emissive.setHex(0x3a2808)
        }
      } else {
        if (isHovered) {
          isHovered = false
          container.style.cursor = 'grab'
          goldMetalMat.emissive.setHex(0x000000)
        }
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      // 主ポインターの左クリック・第1タッチ以外は無視
      if (e.button !== 0 || !e.isPrimary) return
      const wasDragging = hasMovedBeyondThreshold
      isPointerDown = false
      hasMovedBeyondThreshold = false

      // ドラッグ操作中（累積移動距離が閾値6pxを超えた場合）はクリック抽選を抑制
      if (wasDragging) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(clickableMeshes)

      if (intersects.length > 0) {
        onDrawRef.current?.()
      }
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)

    // (8) アニメーションループ（高精度タイムステップ）
    let animationFrameId: number
    let lastTime = performance.now()
    const startTime = performance.now()
    let shakePhase = 0

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate)
      const nowTime = currentTime || performance.now()
      const delta = Math.min((nowTime - lastTime) / 1000, 0.1)
      lastTime = nowTime
      const time = (nowTime - startTime) / 1000

      controls.update()

      // 金粉パーティクルの上昇運動
      const gPos = goldGeo.attributes.position.array as Float32Array
      for (let i = 0; i < goldCount; i++) {
        gPos[i * 3 + 1] += delta * goldSpeeds[i]
        if (gPos[i * 3 + 1] > 3.2) {
          gPos[i * 3 + 1] = -1.8
          gPos[i * 3] = (Math.random() - 0.5) * 4
        }
      }
      goldGeo.attributes.position.needsUpdate = true

      // 桜の花びらの舞い落ち運動
      petalMeshes.forEach((p) => {
        p.mesh.position.y -= delta * p.fallSpeed
        p.mesh.rotation.x += p.rotSpeed.x
        p.mesh.rotation.y += p.rotSpeed.y
        p.mesh.rotation.z += p.rotSpeed.z
        if (p.mesh.position.y < -2.2) {
          p.mesh.position.y = 3.8
          p.mesh.position.x = (Math.random() - 0.5) * 5
        }
      })

      if (isShakingRef.current) {
        // 激しいリアルシェイク（傾き・回転・上下振動）
        shakePhase += delta * 32
        cylinderGroup.rotation.z = Math.sin(shakePhase) * 0.42
        cylinderGroup.rotation.x = Math.cos(shakePhase * 0.8) * 0.32 + 0.15
        cylinderGroup.position.y = Math.sin(shakePhase * 1.8) * 0.22
        cylinderGroup.rotation.y += delta * 2.8

        mainStickGroup.visible = true
        mainStickGroup.position.y = 0.4 + Math.sin(shakePhase * 2.2) * 0.15
        topGlowLight.intensity = 4.0 + Math.sin(shakePhase * 3) * 1.5
      } else if (isRevealedRef.current) {
        // 結果開示：主役のみくじ棒が黄金光と共にせり出し、静かに回転
        cylinderGroup.position.y = THREE.MathUtils.lerp(cylinderGroup.position.y, 0, delta * 4)
        cylinderGroup.rotation.z = THREE.MathUtils.lerp(cylinderGroup.rotation.z, 0, delta * 4)
        cylinderGroup.rotation.x = THREE.MathUtils.lerp(cylinderGroup.rotation.x, 0.08, delta * 4)
        cylinderGroup.rotation.y += delta * 0.4

        mainStickGroup.visible = true
        mainStickGroup.position.y = THREE.MathUtils.lerp(mainStickGroup.position.y, 1.88, delta * 3.5)
        topGlowLight.intensity = THREE.MathUtils.lerp(topGlowLight.intensity, 3.2, delta * 2)
      } else {
        // 待機時：自然な呼吸の浮遊感
        cylinderGroup.position.y = Math.sin(time * 1.8) * 0.05
        cylinderGroup.rotation.z = THREE.MathUtils.lerp(cylinderGroup.rotation.z, 0, delta * 6)
        cylinderGroup.rotation.x = THREE.MathUtils.lerp(cylinderGroup.rotation.x, 0, delta * 6)
        mainStickGroup.visible = false
        mainStickGroup.position.y = 0.2
        topGlowLight.intensity = 1.2
      }

      renderer.render(scene, camera)
    }

    animate(performance.now())

    // (9) リサイズ対応
    const handleResize = () => {
      if (!container) return
      const newWidth = container.clientWidth || 360
      const newHeight = container.clientHeight || 280
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // (10) メモリの確実なクリーンアップ
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      controls.dispose()

      roomScene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose()
        }
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose())
          } else {
            mat.dispose()
          }
        }
      })
      pmremGenerator.dispose()
      envTexture.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      cylinderGeo.dispose()
      ringGeo.dispose()
      capGeo.dispose()
      baseGeo.dispose()
      baseGoldRingGeo.dispose()
      holeRimGeo.dispose()
      holeInnerGeo.dispose()
      plaqueGeo.dispose()
      mainStickGeo.dispose()
      tipGeo.dispose()
      stickLabelGeo.dispose()
      goldGeo.dispose()
      petalGeo.dispose()
      shadowGeo.dispose()

      lacquerMat.dispose()
      goldMetalMat.dispose()
      baseMat.dispose()
      holeInnerMat.dispose()
      plaqueMat.dispose()
      stickMat.dispose()
      tipMat.dispose()
      stickLabelMat.dispose()
      goldParticleMat.dispose()
      petalMat.dispose()
      shadowMat.dispose()

      signTexture.dispose()
      stickTexture.dispose()
      shadowTexture.dispose()
      woodTexture.dispose()

      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-64 relative flex items-center justify-center select-none"
      style={{ touchAction: 'none' }}
    />
  )
}

export default OmikujiCylinder3D
