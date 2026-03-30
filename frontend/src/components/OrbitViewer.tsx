import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import type { GroundPoint } from '../types/api'

const R_EARTH_KM = 6371

function toUnit(km: number) {
  return km / R_EARTH_KM
}

// Convert geographic lat/lon to a 3D point on the Earth surface (r = surface radius in scene units)
function latLonToVec3(lat: number, lon: number, r = 1.002): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

// ── Earth ─────────────────────────────────────────────────────────────────────
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.03
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial color="#1a4a7a" emissive="#0a2040" specular="#4488cc" shininess={20} />
      <mesh>
        <sphereGeometry args={[1.001, 36, 18]} />
        <meshBasicMaterial color="#1e3a5f" wireframe opacity={0.12} transparent />
      </mesh>
    </mesh>
  )
}

// ── Atmosphere ────────────────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.06, 32, 32]} />
      <meshBasicMaterial color="#1a6090" transparent opacity={0.07} side={THREE.BackSide} />
    </mesh>
  )
}

// ── Orbit path (ECI positions in km) ─────────────────────────────────────────
function OrbitPath({ positions }: { positions: [number, number, number][] }) {
  const points = useMemo(
    () => positions.map(([x, y, z]) => new THREE.Vector3(toUnit(x), toUnit(z), toUnit(y))),
    [positions]
  )
  if (points.length < 2) return null
  return <Line points={points} color="#38bdf8" lineWidth={1.5} transparent opacity={0.8} />
}

// ── Ground track line on Earth surface ───────────────────────────────────────
// Splits the track into segments whenever there's a big lon jump (antimeridian wrap)
function GroundTrack({ track }: { track: GroundPoint[] }) {
  const segments = useMemo(() => {
    if (track.length < 2) return []

    const segs: THREE.Vector3[][] = []
    let current: THREE.Vector3[] = []

    for (let i = 0; i < track.length; i++) {
      const pt = latLonToVec3(track[i].lat, track[i].lon)

      if (i > 0) {
        const lonDiff = Math.abs(track[i].lon - track[i - 1].lon)
        if (lonDiff > 180) {
          // Antimeridian crossing — start a new segment
          if (current.length > 1) segs.push(current)
          current = []
        }
      }
      current.push(pt)
    }
    if (current.length > 1) segs.push(current)
    return segs
  }, [track])

  if (segments.length === 0) return null

  return (
    <>
      {segments.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color="#4ade80"
          lineWidth={1.2}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  )
}

// ── Satellite dot ─────────────────────────────────────────────────────────────
// simSpeed: how many seconds of sim time pass per real second
// e.g. simSpeed=60 means 1 real second = 1 sim minute (good for LEO ~92 min period)
const SIM_SPEED = 60 // 1 real second = 60 sim seconds

function Satellite({ positions, times }: { positions: [number, number, number][]; times: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const simTimeRef = useRef(0) // accumulated simulation time in seconds

  // Reset to start whenever a new simulation comes in
  useEffect(() => { simTimeRef.current = 0 }, [positions])

  useFrame((_, delta) => {
    if (!meshRef.current || positions.length === 0 || times.length === 0) return

    // Advance sim time
    simTimeRef.current += delta * SIM_SPEED

    // Wrap around when we exceed the simulation duration
    const totalDuration = times[times.length - 1]
    simTimeRef.current = simTimeRef.current % totalDuration

    // Binary search for the closest time index
    let lo = 0, hi = times.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (times[mid] < simTimeRef.current) lo = mid + 1
      else hi = mid
    }

    const [x, y, z] = positions[lo]
    meshRef.current.position.set(toUnit(x), toUnit(z), toUnit(y))
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.022, 10, 10]} />
      <meshBasicMaterial color="#ffffff" />
      <pointLight color="#38bdf8" intensity={0.6} distance={0.6} />
    </mesh>
  )
}

// ── Ground station marker + visibility cone ───────────────────────────────────
function GroundStationMarker({ lat, lon }: { lat: number; lon: number }) {
  const pos = latLonToVec3(lat, lon, 1.012)

  // Horizon cone — a faint disc showing the ~5° visibility footprint
  const conePoints = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const horizonRadius = 0.18  // approximate visibility footprint in scene units
    const normal = latLonToVec3(lat, lon, 1.0).normalize()
    // Build two perpendicular vectors to normal
    const up = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const tangent1 = new THREE.Vector3().crossVectors(normal, up).normalize()
    const tangent2 = new THREE.Vector3().crossVectors(normal, tangent1).normalize()

    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2
      const pt = new THREE.Vector3()
        .addScaledVector(tangent1, Math.cos(angle) * horizonRadius)
        .addScaledVector(tangent2, Math.sin(angle) * horizonRadius)
        .addScaledVector(normal, 1.002)
      pts.push(pt)
    }
    return pts
  }, [lat, lon])

  return (
    <>
      {/* Station dot */}
      <mesh position={[pos.x, pos.y, pos.z]}>
        <sphereGeometry args={[0.018, 10, 10]} />
        <meshBasicMaterial color="#4ade80" />
        <pointLight color="#4ade80" intensity={0.4} distance={0.4} />
      </mesh>
      {/* Visibility footprint ring */}
      <Line points={conePoints} color="#4ade80" lineWidth={0.8} transparent opacity={0.3} />
    </>
  )
}

// ── Transfer orbit ────────────────────────────────────────────────────────────
function TransferOrbit({ points }: { points: [number, number, number][] }) {
  const threePoints = useMemo(
    () => points.map(([x, y, z]) => new THREE.Vector3(toUnit(x), toUnit(z), toUnit(y))),
    [points]
  )
  if (threePoints.length < 2) return null
  return <Line points={threePoints} color="#fb923c" lineWidth={1.5} transparent opacity={0.85} dashed dashScale={2} />
}

// ── Target orbit ring ─────────────────────────────────────────────────────────
function TargetOrbitRing({ altitude_km, color = '#4ade80' }: { altitude_km: number; color?: string }) {
  const r = toUnit(R_EARTH_KM + altitude_km)
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)))
    }
    return pts
  }, [r])
  return <Line points={points} color={color} lineWidth={1} transparent opacity={0.35} />
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene() {
  const { activeTab, orbitResult, missionResult, groundResult, satConfig, missionConfig, groundConfig } = useStore()

  const showOrbit   = activeTab === 'orbit'   && !!orbitResult
  const showMission = activeTab === 'mission' && !!missionResult
  const showGround  = activeTab === 'ground'  && !!groundResult

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} color="#fff9e6" />
      <Stars radius={100} depth={50} count={4000} factor={3} fade speed={0.4} />

      <Earth />
      <Atmosphere />

      {/* Orbit tab */}
      {showOrbit && (
        <>
          <OrbitPath positions={orbitResult!.positions} />
          <Satellite positions={orbitResult!.positions} times={orbitResult!.times} />
          {orbitResult!.ground_track && (
            <GroundTrack track={orbitResult!.ground_track} />
          )}
        </>
      )}

      {/* Mission tab */}
      {showMission && (
        <>
          <TransferOrbit points={missionResult!.transfer_points} />
          <TargetOrbitRing altitude_km={satConfig.altitude_km} color="#38bdf8" />
          <TargetOrbitRing altitude_km={missionConfig.target_altitude_km} color="#4ade80" />
        </>
      )}

      {/* Ground tab */}
      {showGround && (
        <>
          <GroundStationMarker lat={groundConfig.lat_deg} lon={groundConfig.lon_deg} />
          {/* Show orbit + ground track in ground mode too */}
          {orbitResult && <OrbitPath positions={orbitResult.positions} />}
          {orbitResult?.ground_track && <GroundTrack track={orbitResult.ground_track} />}
        </>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={20}
        autoRotate={!orbitResult && !missionResult && !groundResult}
        autoRotateSpeed={0.3}
      />
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function OrbitViewer() {
  const { isLoading } = useStore()

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#020409' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }} gl={{ antialias: true }}>
        <Scene />
      </Canvas>

      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,9,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#38bdf8', fontSize: 12, fontFamily: 'monospace' }}>Integrating equations of motion…</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
        {[
          { color: '#38bdf8', label: 'orbit' },
          { color: '#4ade80', label: 'ground track' },
          { color: '#fb923c', label: 'transfer' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#ffffff' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Watermark */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>
        <p style={{ color: '#1e3a5f', fontSize: 11, fontFamily: 'monospace' }}>SatLies — where the satellite lies</p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}