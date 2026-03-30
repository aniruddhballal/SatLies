// ── Orbit ──────────────────────────────────────────────────────────────────

export interface OrbitRequest {
  altitude_km: number
  inclination_deg: number
  eccentricity: number
  raan_deg: number
  arg_perigee_deg: number
  true_anomaly_deg: number
  num_periods: number
  num_points: number
  use_j2: boolean
  include_ground_track: boolean
}

export interface GroundPoint {
  lat: number
  lon: number
  alt_km: number
}

export interface OrbitResult {
  positions: [number, number, number][]
  times: number[]
  period_s: number
  period_min: number
  apogee_km: number
  perigee_km: number
  semi_major_axis_km: number
  num_points: number
  ground_track?: GroundPoint[]
}

// ── Mission ────────────────────────────────────────────────────────────────

export interface MissionRequest {
  initial_altitude_km: number
  target_altitude_km: number
  spacecraft_mass_kg: number
  isp_s: number
}

export interface MissionResult {
  dv1_ms: number
  dv2_ms: number
  dv_total_ms: number
  transfer_time_s: number
  transfer_time_min: number
  transfer_time_h: number
  fuel_mass_kg: number
  initial_velocity_ms: number
  target_velocity_ms: number
  transfer_apogee_km: number
  transfer_perigee_km: number
  transfer_semi_major_axis_km: number
  eccentricity_transfer: number
  transfer_points: [number, number, number][]
}

// ── Ground ─────────────────────────────────────────────────────────────────

export interface GroundTrackRequest {
  altitude_km: number
  inclination_deg: number
  eccentricity: number
  raan_deg: number
  arg_perigee_deg: number
  true_anomaly_deg: number
  num_periods: number
  num_points: number
  lat_deg: number
  lon_deg: number
  min_elevation_deg: number
  station_name: string
}

export interface Pass {
  start_s: number
  end_s: number
  duration_s: number
  duration_min: number
  max_elevation_deg: number
  start_min: number
}

export interface GroundResult {
  elevations_deg: number[]
  azimuths_deg: number[]
  passes: Pass[]
  num_passes: number
  next_pass: Pass | null
  simulated_periods: number
  period_min: number
}