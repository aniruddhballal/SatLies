import { useStore } from '../store/useStore'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#020409',
  bg2:       '#030812',
  bg3:       '#060e1e',
  border:    '#0a1628',
  orbit:     '#38bdf8',
  ground:    '#4ade80',
  burn:      '#fb923c',
  muted:     '#94a3b8',   // was #475569 — now readable slate-400
  text:      '#ffffff',
  textDim:   '#e2e8f0',
  red:       '#f87171',
}

const FONT = '"Space Grotesk", sans-serif'

// ── Primitives ────────────────────────────────────────────────────────────────
function StatRow({ label, value, unit = '', accent }: {
  label: string; value: string | number; unit?: string; accent?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 500, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 14, fontFamily: FONT, fontWeight: 700, color: accent ?? C.orbit }}>
        {value}<span style={{ color: C.muted, marginLeft: 3, fontSize: 12, fontWeight: 500 }}>{unit}</span>
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontFamily: FONT, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ChartBox({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div style={{ background: C.bg3, borderRadius: 8, padding: '8px 4px 4px', marginTop: 4 }}>
      {children}
      <p style={{ textAlign: 'center', fontSize: 11, fontFamily: FONT, fontWeight: 500, color: C.muted, marginTop: 4 }}>{label}</p>
    </div>
  )
}

// ── Delta-V bar visual ────────────────────────────────────────────────────────
function DvBar({ dv1, dv2, total }: { dv1: number; dv2: number; total: number }) {
  const pct1 = (dv1 / total) * 100
  const pct2 = (dv2 / total) * 100
  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1, marginBottom: 8 }}>
        <div style={{ width: `${pct1}%`, background: C.burn, borderRadius: '6px 0 0 6px', opacity: 0.9 }} title={`Burn 1: ${dv1} m/s`} />
        <div style={{ width: `${pct2}%`, background: '#fbbf24', borderRadius: '0 6px 6px 0', opacity: 0.9 }} title={`Burn 2: ${dv2} m/s`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.burn }} />
          <span style={{ fontSize: 12, fontFamily: FONT, fontWeight: 600, color: C.textDim }}>Burn 1 · {dv1} m/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#fbbf24' }} />
          <span style={{ fontSize: 12, fontFamily: FONT, fontWeight: 600, color: C.textDim }}>Burn 2 · {dv2} m/s</span>
        </div>
      </div>
    </div>
  )
}

// ── Big stat highlight ────────────────────────────────────────────────────────
function BigStat({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div style={{ background: C.bg3, borderRadius: 10, padding: '14px 16px', marginBottom: 12, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, fontFamily: FONT, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 26, fontFamily: FONT, fontWeight: 800, color }}>{value}</span>
        <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 600, color: C.muted }}>{unit}</span>
      </div>
    </div>
  )
}

// ── Pass card ─────────────────────────────────────────────────────────────────
function PassCard({ pass, index, isNext }: { pass: { start_min: number; duration_min: number; max_elevation_deg: number }; index: number; isNext: boolean }) {
  const elFraction = Math.min(pass.max_elevation_deg / 90, 1)
  return (
    <div style={{
      background: isNext ? 'rgba(74,222,128,0.06)' : C.bg3,
      border: `1px solid ${isNext ? 'rgba(74,222,128,0.25)' : C.border}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontFamily: FONT, fontWeight: 700, color: isNext ? C.ground : C.textDim }}>
          {isNext ? '▶ NEXT PASS' : `Pass ${index + 1}`}
        </span>
        <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 700, color: C.ground }}>+{pass.start_min.toFixed(1)} min</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontFamily: FONT, fontWeight: 600, color: C.textDim }}>{pass.duration_min.toFixed(1)} min duration</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 52, height: 5, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${elFraction * 100}%`, height: '100%', background: C.orbit, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 700, color: C.orbit }}>{pass.max_elevation_deg.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  )
}

// ── Tooltip styles ────────────────────────────────────────────────────────────
const tooltipStyle = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: FONT }
const tickStyle = { fontSize: 11, fill: C.muted, fontFamily: FONT }

// ── Main component ────────────────────────────────────────────────────────────
export default function RightPanel() {
  const { activeTab, orbitResult, missionResult, groundResult, error } = useStore()

  const hasResult =
    (activeTab === 'orbit'   && !!orbitResult)   ||
    (activeTab === 'mission' && !!missionResult) ||
    (activeTab === 'ground'  && !!groundResult)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {activeTab === 'orbit' ? 'Orbital Data' : activeTab === 'mission' ? 'Mission Data' : 'Ground Data'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ color: C.red, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}>Error: {error}</p>
            <p style={{ color: C.muted, fontSize: 12, fontFamily: FONT, marginTop: 4 }}>Is the backend running on :8000?</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!hasResult && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <p style={{ fontSize: 13, fontFamily: FONT, fontWeight: 500, textAlign: 'center', lineHeight: 1.7, color: C.textDim }}>
              Configure parameters<br />and run a simulation
            </p>
          </div>
        )}

        {/* ── ORBIT RESULTS ── */}
        {activeTab === 'orbit' && orbitResult && (
          <>
            <BigStat label="Orbital Period" value={orbitResult.period_min.toFixed(1)} unit="min" color={C.orbit} />

            <Section title="Orbital Parameters">
              <StatRow label="Apogee"          value={orbitResult.apogee_km}          unit="km" />
              <StatRow label="Perigee"         value={orbitResult.perigee_km}         unit="km" />
              <StatRow label="Semi-major axis" value={orbitResult.semi_major_axis_km} unit="km" />
              <StatRow label="Data points"     value={orbitResult.num_points} />
            </Section>

            {orbitResult.ground_track && orbitResult.ground_track.length > 0 && (
              <Section title="Ground Track">
                <ChartBox label="latitude vs longitude">
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={orbitResult.ground_track.filter((_, i) => i % 4 === 0)}>
                      <XAxis dataKey="lon" tick={tickStyle} tickLine={false} domain={[-180, 180]} tickCount={5} />
                      <YAxis dataKey="lat" tick={tickStyle} tickLine={false} domain={[-90, 90]} tickCount={5} width={28} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}°`]} />
                      <Line type="monotone" dataKey="lat" stroke={C.ground} dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartBox>
              </Section>
            )}
          </>
        )}

        {/* ── MISSION RESULTS ── */}
        {activeTab === 'mission' && missionResult && (
          <>
            <BigStat label="Total Δv" value={missionResult.dv_total_ms.toFixed(0)} unit="m/s" color={C.burn} />

            <Section title="Delta-V Breakdown">
              <DvBar dv1={missionResult.dv1_ms} dv2={missionResult.dv2_ms} total={missionResult.dv_total_ms} />
              <StatRow label="Burn 1 — raise apogee"  value={missionResult.dv1_ms} unit="m/s" accent={C.burn} />
              <StatRow label="Burn 2 — circularize"   value={missionResult.dv2_ms} unit="m/s" accent="#fbbf24" />
            </Section>

            <Section title="Transfer Orbit">
              <StatRow label="Semi-major axis" value={missionResult.transfer_semi_major_axis_km} unit="km" />
              <StatRow label="Eccentricity"    value={missionResult.eccentricity_transfer} />
              <StatRow label="Transfer time"   value={missionResult.transfer_time_min.toFixed(1)} unit="min" />
            </Section>

            <Section title="Fuel Estimate">
              <BigStat label="Fuel consumed" value={missionResult.fuel_mass_kg.toFixed(1)} unit="kg" color="#a78bfa" />
              <StatRow label="Initial velocity" value={missionResult.initial_velocity_ms} unit="m/s" />
              <StatRow label="Target velocity"  value={missionResult.target_velocity_ms}  unit="m/s" />
            </Section>
          </>
        )}

        {/* ── GROUND RESULTS ── */}
        {activeTab === 'ground' && groundResult && (
          <>
            {groundResult.next_pass ? (
              <BigStat
                label="Next visible pass"
                value={groundResult.next_pass.start_min.toFixed(1)}
                unit="min away"
                color={C.ground}
              />
            ) : (
              <div style={{ background: C.bg3, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <p style={{ color: C.textDim, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}>No visible passes in window.</p>
                <p style={{ color: C.muted, fontSize: 12, fontFamily: FONT, marginTop: 4 }}>Try increasing periods or adjusting inclination.</p>
              </div>
            )}

            <Section title="Summary">
              <StatRow label="Total passes"      value={groundResult.num_passes} />
              <StatRow label="Orbital period"    value={groundResult.period_min.toFixed(1)} unit="min" />
              <StatRow label="Sim duration"      value={(groundResult.simulated_periods * groundResult.period_min).toFixed(0)} unit="min" />
            </Section>

            {groundResult.passes.length > 0 && (
              <Section title={`All Passes (${groundResult.passes.length})`}>
                {groundResult.passes.slice(0, 8).map((p, i) => (
                  <PassCard key={i} pass={p} index={i} isNext={i === 0} />
                ))}
              </Section>
            )}

            {groundResult.elevations_deg.length > 0 && (
              <Section title="Elevation Profile">
                <ChartBox label="elevation angle over time">
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart
                      data={groundResult.elevations_deg
                        .filter((_, i) => i % 8 === 0)
                        .map((el, i) => ({ t: i, el: Math.max(0, el) }))}
                    >
                      <defs>
                        <linearGradient id="elGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.ground} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.ground} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" hide />
                      <YAxis tick={tickStyle} tickLine={false} domain={[0, 90]} tickCount={4} width={28} />
                      <ReferenceLine y={5} stroke={C.muted} strokeDasharray="3 3" strokeWidth={0.8} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}°`, 'elevation']} />
                      <Area type="monotone" dataKey="el" stroke={C.ground} fill="url(#elGrad)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartBox>
                <p style={{ fontSize: 12, fontFamily: FONT, fontWeight: 500, color: C.muted, marginTop: 6 }}>Dashed line = 5° min elevation</p>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}