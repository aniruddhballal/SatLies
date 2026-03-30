import { useStore } from '../store/useStore'
import { api } from '../lib/api'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#020409',
  bg2:     '#030812',
  bg3:     '#060e1e',
  border:  '#0a1628',
  orbit:   '#38bdf8',
  ground:  '#4ade80',
  burn:    '#fb923c',
  muted:   '#475569',
  textDim: '#94a3b8',
  text:    '#e2e8f0',
  white:   '#ffffff',
}

// ── Preset satellites ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'ISS',  altitude_km: 408,    inclination_deg: 51.6, eccentricity: 0.0002 },
  { label: 'GEO',  altitude_km: 35786,  inclination_deg: 0,    eccentricity: 0      },
  { label: 'SSO',  altitude_km: 500,    inclination_deg: 97.4, eccentricity: 0      },
  { label: 'Mol',  altitude_km: 24396,  inclination_deg: 63.4, eccentricity: 0.74   },
]

// ── SliderRow ─────────────────────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step = 1, unit = '', onChange, color = C.orbit }: {
  label: string; value: number; min: number; max: number
  step?: number; unit?: string; onChange: (v: number) => void; color?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color }}>
          {value}<span style={{ color: C.muted, fontSize: 9 }}>{unit}</span>
        </span>
      </div>
      <div style={{ position: 'relative', height: 4, background: C.border, borderRadius: 2 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.8 }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: '-6px 0', width: '100%', opacity: 0, cursor: 'pointer', height: 16 }}
        />
      </div>
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
      {children}
    </div>
  )
}

// ── Toggle button ─────────────────────────────────────────────────────────────
function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          padding: '3px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', cursor: 'pointer',
          background: active ? 'rgba(56,189,248,0.12)' : C.bg3,
          color: active ? C.orbit : C.muted,
          border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : C.border}`,
          transition: 'all 0.15s',
        }}
      >
        {active ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeftPanel() {
  const {
    activeTab, setActiveTab,
    satConfig, setSatConfig,
    missionConfig, setMissionConfig,
    groundConfig, setGroundConfig,
    isLoading, setLoading, setError,
    setOrbitResult, setMissionResult, setGroundResult,
  } = useStore()

  async function handleSimulate() {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'orbit') {
        const result = await api.simulateOrbit({ ...satConfig, num_points: 500, include_ground_track: true })
        setOrbitResult(result)
      } else if (activeTab === 'mission') {
        const result = await api.planMission({ initial_altitude_km: satConfig.altitude_km, ...missionConfig })
        setMissionResult(result)
      } else {
        const result = await api.getPasses({ ...satConfig, num_points: 1000, ...groundConfig })
        setGroundResult(result)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'orbit',   label: 'Orbit',   color: C.orbit  },
    { id: 'mission', label: 'Mission', color: C.burn   },
    { id: 'ground',  label: 'Ground',  color: C.ground },
  ] as const

  const activeColor = tabs.find(t => t.id === activeTab)?.color ?? C.orbit

  const btnLabel = activeTab === 'orbit' ? '▶  Simulate Orbit'
                 : activeTab === 'mission' ? '▶  Plan Mission'
                 : '▶  Track Passes'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: '"Space Grotesk", sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>🛰</span>
        <span style={{ fontWeight: 600, color: C.white, letterSpacing: '-0.02em', fontSize: 15 }}>SatLies</span>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, marginLeft: 'auto' }}>v0.1</span>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 8px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {tabs.map(t => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: active ? t.color : 'transparent',
                color: active ? C.bg : C.muted,
                fontWeight: active ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Scrollable inputs ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* Presets */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Presets</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setSatConfig({ altitude_km: p.altitude_km, inclination_deg: p.inclination_deg, eccentricity: p.eccentricity })}
                style={{
                  padding: '5px 0', borderRadius: 6, fontSize: 10, fontFamily: 'monospace',
                  cursor: 'pointer', border: `1px solid ${C.border}`,
                  background: C.bg3, color: C.textDim,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = activeColor; (e.target as HTMLButtonElement).style.color = activeColor }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = C.border; (e.target as HTMLButtonElement).style.color = C.textDim }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Satellite config */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Satellite</SectionLabel>
          <SliderRow label="Altitude"     value={satConfig.altitude_km}       min={160}  max={40000} step={10}  unit=" km" color={C.orbit}  onChange={v => setSatConfig({ altitude_km: v })} />
          <SliderRow label="Inclination"  value={satConfig.inclination_deg}   min={0}    max={180}   step={0.1} unit="°"   color={C.orbit}  onChange={v => setSatConfig({ inclination_deg: v })} />
          <SliderRow label="Eccentricity" value={satConfig.eccentricity}      min={0}    max={0.95}  step={0.01}            color={C.orbit}  onChange={v => setSatConfig({ eccentricity: v })} />
          <SliderRow label="RAAN"         value={satConfig.raan_deg}          min={0}    max={360}   unit="°"   color={C.muted}  onChange={v => setSatConfig({ raan_deg: v })} />
          <SliderRow label="Arg. Perigee" value={satConfig.arg_perigee_deg}   min={0}    max={360}   unit="°"   color={C.muted}  onChange={v => setSatConfig({ arg_perigee_deg: v })} />
          <SliderRow label="True Anomaly" value={satConfig.true_anomaly_deg}  min={0}    max={360}   unit="°"   color={C.muted}  onChange={v => setSatConfig({ true_anomaly_deg: v })} />
          <SliderRow label="Periods"      value={satConfig.num_periods}       min={0.5}  max={10}    step={0.5} color={C.textDim} onChange={v => setSatConfig({ num_periods: v })} />
          <Toggle label="J2 Perturbation" active={satConfig.use_j2} onToggle={() => setSatConfig({ use_j2: !satConfig.use_j2 })} />
        </div>

        {/* Mission config */}
        {activeTab === 'mission' && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16 }}>
            <SectionLabel>Mission</SectionLabel>
            <SliderRow label="Target Alt."      value={missionConfig.target_altitude_km}  min={160}  max={40000} step={100} unit=" km" color={C.burn} onChange={v => setMissionConfig({ target_altitude_km: v })} />
            <SliderRow label="Spacecraft Mass"  value={missionConfig.spacecraft_mass_kg}  min={10}   max={10000} step={10}  unit=" kg" color={C.burn} onChange={v => setMissionConfig({ spacecraft_mass_kg: v })} />
            <SliderRow label="Isp"              value={missionConfig.isp_s}               min={50}   max={500}   step={5}   unit=" s"  color={C.burn} onChange={v => setMissionConfig({ isp_s: v })} />
          </div>
        )}

        {/* Ground config */}
        {activeTab === 'ground' && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16 }}>
            <SectionLabel>Ground Station</SectionLabel>
            <SliderRow label="Latitude"      value={groundConfig.lat_deg}           min={-90}  max={90}   step={0.1} unit="°" color={C.ground} onChange={v => setGroundConfig({ lat_deg: v })} />
            <SliderRow label="Longitude"     value={groundConfig.lon_deg}           min={-180} max={180}  step={0.1} unit="°" color={C.ground} onChange={v => setGroundConfig({ lon_deg: v })} />
            <SliderRow label="Min Elevation" value={groundConfig.min_elevation_deg} min={0}    max={45}   unit="°"   color={C.ground} onChange={v => setGroundConfig({ min_elevation_deg: v })} />
            <SliderRow label="Sim Periods"   value={groundConfig.num_periods}       min={1}    max={15}   step={1}   color={C.ground} onChange={v => setGroundConfig({ num_periods: v })} />
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Station Name</div>
              <input
                type="text"
                value={groundConfig.station_name}
                onChange={e => setGroundConfig({ station_name: e.target.value })}
                style={{
                  width: '100%', background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', color: C.white,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = C.ground)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Simulate button ── */}
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            background: isLoading ? C.bg3 : activeColor,
            color: isLoading ? C.muted : C.bg,
            fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: 13,
            transition: 'all 0.15s', opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, border: `2px solid ${C.muted}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Computing…
            </span>
          ) : btnLabel}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

    </div>
  )
}