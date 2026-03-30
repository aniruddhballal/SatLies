import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

const R_EARTH_KM = 6371

// Scale everything so Earth radius = 1 unit
function toUnit(km: number) {
  return km / R_EARTH_KM
}

// ── Earth ────────────────────────────────────────────────────────────────────
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Slow rotation for aesthetics
      meshRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        color="#1a4a7a"
        emissive="#0a2040"
        specular="#4488cc"
        shininess={20}
        wireframe={false}
      />
      {/* Grid overlay */}
      <mesh>
        <sphereGeometry args={[1.001, 36, 18]} />
        <meshBasicMaterial color="#1e3a5f" wireframe opacity={0.15} transparent />
      </mesh>
    </mesh>
  )
}

// ── Atmosphere glow ───────────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.05, 32, 32]} />
      <meshBasicMaterial color="#1a6090" transparent opacity={0.08} side={THREE.BackSide} />
    </mesh>
  )
}

// ── Orbit path ───────────────────────────────────────────────────────────────
function OrbitPath({ positions }: { positions: [number, number, number][] }) {
  const points = useMemo(
    () => positions.map(([x, y, z]) => new THREE.Vector3(toUnit(x), toUnit(z), toUnit(y))),
    [positions]
  )

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color="#38bdf8"
      lineWidth={1.5}
      transparent
      opacity={0.8}
    />
  )
}

// ── Transfer orbit ───────────────────────────────────────────────────────────
function TransferOrbit({ points }: { points: [number, number, number][] }) {
  const threePoints = useMemo(
    () => points.map(([x, y, z]) => new THREE.Vector3(toUnit(x), toUnit(z), toUnit(y))),
    [points]
  )
  if (threePoints.length < 2) return null
  return <Line points={threePoints} color="#fb923c" lineWidth={1.5} transparent opacity={0.8} dashed dashScale={2} />
}

// ── Satellite dot ─────────────────────────────────────────────────────────────
function Satellite({ positions, times }: { positions: [number, number, number][]; times: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const indexRef = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current || positions.length === 0) return
    indexRef.current = (indexRef.current + Math.floor(delta * 10)) % positions.length
    const [x, y, z] = positions[indexRef.current]
    meshRef.current.position.set(toUnit(x), toUnit(z), toUnit(y))
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
      <pointLight color="#38bdf8" intensity={0.5} distance={0.5} />
    </mesh>
  )
}

// ── Ground station marker ────────────────────────────────────────────────────
function GroundStationMarker({ lat, lon }: { lat: number; lon: number }) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  const r = 1.01
  const x = r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.sin(theta)

  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshBasicMaterial color="#4ade80" />
      <pointLight color="#4ade80" intensity={0.3} distance={0.3} />
    </mesh>
  )
}

// ── Target orbit ring ─────────────────────────────────────────────────────────
function TargetOrbitRing({ altitude_km }: { altitude_km: number }) {
  const r = toUnit(R_EARTH_KM + altitude_km)
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)))
    }
    return pts
  }, [r])
  return <Line points={points} color="#4ade80" lineWidth={1} transparent opacity={0.4} />
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene() {
  const { activeTab, orbitResult, missionResult, groundResult, satConfig, missionConfig, groundConfig } = useStore()

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#fff9e6" />

      {/* Stars */}
      <Stars radius={100} depth={50} count={3000} factor={3} fade speed={0.5} />

      {/* Earth */}
      <Earth />
      <Atmosphere />

      {/* Orbit path */}
      {orbitResult && activeTab !== 'mission' && (
        <>
          <OrbitPath positions={orbitResult.positions} />
          <Satellite positions={orbitResult.positions} times={orbitResult.times} />
        </>
      )}

      {/* Mission planner — transfer orbit + rings */}
      {missionResult && activeTab === 'mission' && (
        <>
          <TransferOrbit points={missionResult.transfer_points} />
          <TargetOrbitRing altitude_km={missionConfig.target_altitude_km} />
          <TargetOrbitRing altitude_km={satConfig.altitude_km} />
        </>
      )}

      {/* Ground station marker */}
      {activeTab === 'ground' && groundResult && (
        <GroundStationMarker lat={groundConfig.lat_deg} lon={groundConfig.lon_deg} />
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={20}
        autoRotate={!orbitResult}
        autoRotateSpeed={0.3}
      />
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function OrbitViewer() {
  const { isLoading } = useStore()

  return (
    <div style={{ position: "absolute", inset: 0, background: "#020409" }}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-space-950/70 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orbit border-t-transparent rounded-full animate-spin" />
            <p className="text-orbit text-xs font-mono">Integrating equations of motion…</p>
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <p className="text-space-700 text-xs font-mono">SatLies - where the satellite lies</p>
      </div>

      {/* Axis legend */}
      <div className="absolute top-3 right-3 space-y-1 opacity-50">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orbit" />
          <span className="text-xs font-mono text-slate-500">orbit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-burn" />
          <span className="text-xs font-mono text-slate-500">transfer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-ground" />
          <span className="text-xs font-mono text-slate-500">target / stn</span>
        </div>
      </div>
    </div>
  )
}