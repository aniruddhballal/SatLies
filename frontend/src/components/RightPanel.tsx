import { useStore } from '../store/useStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function StatRow({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="stat-row">
      <span className="label">{label}</span>
      <span className="value">{value}<span className="text-slate-500 ml-1 text-xs">{unit}</span></span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="label mb-2 pb-1 border-b border-space-700">{title}</div>
      {children}
    </div>
  )
}

export default function RightPanel() {
  const { activeTab, orbitResult, missionResult, groundResult, error } = useStore()

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-xs font-mono">Error: {error}</p>
          <p className="text-slate-500 text-xs mt-1">Is the backend running on :8000?</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-space-700">
        <span className="label">Output</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ── ORBIT RESULTS ── */}
        {activeTab === 'orbit' && orbitResult && (
          <>
            <Section title="Orbital Parameters">
              <StatRow label="Period" value={orbitResult.period_min} unit="min" />
              <StatRow label="Apogee" value={orbitResult.apogee_km} unit="km" />
              <StatRow label="Perigee" value={orbitResult.perigee_km} unit="km" />
              <StatRow label="Semi-major axis" value={orbitResult.semi_major_axis_km} unit="km" />
              <StatRow label="Data points" value={orbitResult.num_points} />
            </Section>

            <Section title="Ground Track Preview">
              {orbitResult.ground_track && orbitResult.ground_track.length > 0 ? (
                <div className="bg-space-800 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={orbitResult.ground_track.filter((_, i) => i % 5 === 0)}>
                      <XAxis dataKey="lon" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} domain={[-180, 180]} />
                      <YAxis dataKey="lat" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} domain={[-90, 90]} />
                      <Tooltip
                        contentStyle={{ background: '#030812', border: '1px solid #0a1628', borderRadius: 6 }}
                        labelStyle={{ color: '#94a3b8', fontSize: 10 }}
                        itemStyle={{ color: '#38bdf8', fontSize: 10 }}
                        formatter={(v: number) => [`${v.toFixed(2)}°`]}
                      />
                      <Line type="monotone" dataKey="lat" stroke="#38bdf8" dot={false} strokeWidth={1} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-slate-600 text-xs font-mono text-center mt-1">lat vs lon</p>
                </div>
              ) : (
                <p className="text-slate-600 text-xs font-mono">No ground track data</p>
              )}
            </Section>
          </>
        )}

        {/* ── MISSION RESULTS ── */}
        {activeTab === 'mission' && missionResult && (
          <>
            <Section title="Delta-V Budget">
              <StatRow label="Burn 1 (raise apogee)" value={missionResult.dv1_ms} unit="m/s" />
              <StatRow label="Burn 2 (circularize)" value={missionResult.dv2_ms} unit="m/s" />
              <div className="stat-row">
                <span className="label font-bold text-white">Total Δv</span>
                <span className="font-mono text-burn font-bold text-base">{missionResult.dv_total_ms} <span className="text-slate-500 text-xs">m/s</span></span>
              </div>
            </Section>

            <Section title="Transfer Orbit">
              <StatRow label="Semi-major axis" value={missionResult.transfer_semi_major_axis_km} unit="km" />
              <StatRow label="Eccentricity" value={missionResult.eccentricity_transfer} />
              <StatRow label="Transfer time" value={missionResult.transfer_time_min} unit="min" />
            </Section>

            <Section title="Fuel Estimate">
              <StatRow label="Fuel consumed" value={missionResult.fuel_mass_kg} unit="kg" />
              <StatRow label="Initial velocity" value={missionResult.initial_velocity_ms} unit="m/s" />
              <StatRow label="Target velocity" value={missionResult.target_velocity_ms} unit="m/s" />
            </Section>
          </>
        )}

        {/* ── GROUND RESULTS ── */}
        {activeTab === 'ground' && groundResult && (
          <>
            {groundResult.next_pass ? (
              <div className="bg-ground/10 border border-ground/30 rounded-lg p-3 mb-4">
                <p className="text-ground text-xs font-mono mb-1">NEXT PASS</p>
                <p className="text-white font-mono text-sm">
                  in <span className="text-ground font-bold text-lg">{groundResult.next_pass.start_min.toFixed(1)}</span> min
                </p>
                <p className="text-slate-400 text-xs font-mono">
                  Duration: {groundResult.next_pass.duration_min.toFixed(1)} min · Max el: {groundResult.next_pass.max_elevation_deg.toFixed(1)}°
                </p>
              </div>
            ) : (
              <div className="bg-space-800 rounded-lg p-3 mb-4">
                <p className="text-slate-500 text-xs font-mono">No visible passes in simulation window.</p>
                <p className="text-slate-600 text-xs font-mono mt-1">Try increasing periods or adjusting inclination.</p>
              </div>
            )}

            <Section title="Pass Summary">
              <StatRow label="Total passes" value={groundResult.num_passes} />
              <StatRow label="Simulated periods" value={groundResult.simulated_periods} />
              <StatRow label="Orbital period" value={groundResult.period_min} unit="min" />
            </Section>

            {groundResult.passes.length > 0 && (
              <Section title="All Passes">
                <div className="space-y-2">
                  {groundResult.passes.slice(0, 8).map((p, i) => (
                    <div key={i} className="bg-space-800 rounded px-3 py-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-mono text-slate-400">Pass {i + 1}</span>
                        <span className="text-xs font-mono text-ground">+{p.start_min.toFixed(1)} min</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs font-mono text-slate-500">dur: {p.duration_min.toFixed(1)} min</span>
                        <span className="text-xs font-mono text-orbit">max el: {p.max_elevation_deg.toFixed(1)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Elevation angle chart */}
            {groundResult.elevations_deg.length > 0 && (
              <Section title="Elevation Profile">
                <div className="bg-space-800 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart
                      data={groundResult.elevations_deg
                        .filter((_, i) => i % 10 === 0)
                        .map((el, i) => ({ t: i, el }))}
                    >
                      <XAxis dataKey="t" hide />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} domain={[-90, 90]} />
                      <Tooltip
                        contentStyle={{ background: '#030812', border: '1px solid #0a1628', borderRadius: 6 }}
                        labelStyle={{ color: '#94a3b8', fontSize: 10 }}
                        itemStyle={{ color: '#4ade80', fontSize: 10 }}
                        formatter={(v: number) => [`${v.toFixed(1)}°`, 'Elevation']}
                      />
                      <Line type="monotone" dataKey="el" stroke="#4ade80" dot={false} strokeWidth={1} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-slate-600 text-xs font-mono text-center mt-1">elevation over time</p>
                </div>
              </Section>
            )}
          </>
        )}

        {/* Empty state */}
        {((activeTab === 'orbit' && !orbitResult) ||
          (activeTab === 'mission' && !missionResult) ||
          (activeTab === 'ground' && !groundResult)) && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <span className="text-3xl mb-3">📡</span>
            <p className="text-xs font-mono text-center">Configure parameters<br />and run a simulation</p>
          </div>
        )}
      </div>
    </div>
  )
}