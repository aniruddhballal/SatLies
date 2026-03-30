import { useStore } from '../store/useStore'
import { api } from '../lib/api'

function SliderRow({
  label, value, min, max, step = 1, unit = '',
  onChange,
}: {
  label: string; value: number; min: number; max: number
  step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="label">{label}</span>
        <span className="value">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input-range"
      />
    </div>
  )
}

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
        const result = await api.simulateOrbit({
          ...satConfig,
          num_points: 500,
          include_ground_track: true,
        })
        setOrbitResult(result)
      } else if (activeTab === 'mission') {
        const result = await api.planMission({
          initial_altitude_km: satConfig.altitude_km,
          ...missionConfig,
        })
        setMissionResult(result)
      } else {
        const result = await api.getPasses({
          ...satConfig,
          num_points: 1000,
          ...groundConfig,
        })
        setGroundResult(result)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'orbit', label: 'Orbit' },
    { id: 'mission', label: 'Mission' },
    { id: 'ground', label: 'Ground' },
  ] as const

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-space-700 flex items-center gap-2">
        <span className="text-orbit text-lg">🛰</span>
        <span className="font-display font-semibold text-white tracking-tight">SatLies</span>
        <span className="text-slate-500 text-xs font-mono ml-auto">v0.1</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-2 border-b border-space-700">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded text-xs font-mono transition-all duration-150 ${
              activeTab === t.id
                ? 'bg-orbit text-space-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Satellite Config — always shown */}
        <div>
          <p className="label mb-3">Satellite</p>
          <SliderRow label="Altitude" value={satConfig.altitude_km} min={160} max={40000} step={10} unit=" km" onChange={v => setSatConfig({ altitude_km: v })} />
          <SliderRow label="Inclination" value={satConfig.inclination_deg} min={0} max={180} step={0.1} unit="°" onChange={v => setSatConfig({ inclination_deg: v })} />
          <SliderRow label="Eccentricity" value={satConfig.eccentricity} min={0} max={0.95} step={0.01} onChange={v => setSatConfig({ eccentricity: v })} />
          <SliderRow label="RAAN" value={satConfig.raan_deg} min={0} max={360} unit="°" onChange={v => setSatConfig({ raan_deg: v })} />
          <SliderRow label="Arg. Perigee" value={satConfig.arg_perigee_deg} min={0} max={360} unit="°" onChange={v => setSatConfig({ arg_perigee_deg: v })} />
          <SliderRow label="True Anomaly" value={satConfig.true_anomaly_deg} min={0} max={360} unit="°" onChange={v => setSatConfig({ true_anomaly_deg: v })} />
          <SliderRow label="Periods" value={satConfig.num_periods} min={0.5} max={10} step={0.5} onChange={v => setSatConfig({ num_periods: v })} />

          <div className="flex items-center justify-between mt-2">
            <span className="label">J2 Perturbation</span>
            <button
              onClick={() => setSatConfig({ use_j2: !satConfig.use_j2 })}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                satConfig.use_j2
                  ? 'bg-orbit/20 text-orbit border border-orbit/50'
                  : 'bg-space-800 text-slate-500 border border-space-700'
              }`}
            >
              {satConfig.use_j2 ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Mission Config */}
        {activeTab === 'mission' && (
          <div className="border-t border-space-700 pt-4">
            <p className="label mb-3">Mission</p>
            <SliderRow label="Target Alt." value={missionConfig.target_altitude_km} min={160} max={40000} step={100} unit=" km" onChange={v => setMissionConfig({ target_altitude_km: v })} />
            <SliderRow label="Spacecraft Mass" value={missionConfig.spacecraft_mass_kg} min={10} max={10000} step={10} unit=" kg" onChange={v => setMissionConfig({ spacecraft_mass_kg: v })} />
            <SliderRow label="Isp" value={missionConfig.isp_s} min={50} max={500} step={5} unit=" s" onChange={v => setMissionConfig({ isp_s: v })} />
          </div>
        )}

        {/* Ground Config */}
        {activeTab === 'ground' && (
          <div className="border-t border-space-700 pt-4">
            <p className="label mb-3">Ground Station</p>
            <SliderRow label="Latitude" value={groundConfig.lat_deg} min={-90} max={90} step={0.1} unit="°" onChange={v => setGroundConfig({ lat_deg: v })} />
            <SliderRow label="Longitude" value={groundConfig.lon_deg} min={-180} max={180} step={0.1} unit="°" onChange={v => setGroundConfig({ lon_deg: v })} />
            <SliderRow label="Min Elevation" value={groundConfig.min_elevation_deg} min={0} max={45} unit="°" onChange={v => setGroundConfig({ min_elevation_deg: v })} />
            <SliderRow label="Sim Periods" value={groundConfig.num_periods} min={1} max={15} step={1} onChange={v => setGroundConfig({ num_periods: v })} />
            <div className="mt-2">
              <span className="label block mb-1">Station Name</span>
              <input
                type="text"
                value={groundConfig.station_name}
                onChange={e => setGroundConfig({ station_name: e.target.value })}
                className="w-full bg-space-800 border border-space-700 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-orbit"
              />
            </div>
          </div>
        )}
      </div>

      {/* Simulate button */}
      <div className="p-4 border-t border-space-700">
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-space-950 border-t-transparent rounded-full animate-spin" />
              Computing…
            </span>
          ) : (
            activeTab === 'orbit' ? '▶ Simulate Orbit'
            : activeTab === 'mission' ? '▶ Plan Mission'
            : '▶ Track Passes'
          )}
        </button>
      </div>
    </div>
  )
}