import { create } from 'zustand'
import type { OrbitResult, MissionResult, GroundResult } from '../types/api'

export type ActiveTab = 'orbit' | 'mission' | 'ground'

export interface SatConfig {
  altitude_km: number
  inclination_deg: number
  eccentricity: number
  raan_deg: number
  arg_perigee_deg: number
  true_anomaly_deg: number
  num_periods: number
  use_j2: boolean
}

export interface MissionConfig {
  target_altitude_km: number
  spacecraft_mass_kg: number
  isp_s: number
}

export interface GroundConfig {
  lat_deg: number
  lon_deg: number
  min_elevation_deg: number
  station_name: string
  num_periods: number
}

interface AppState {
  // UI
  activeTab: ActiveTab
  isLoading: boolean
  error: string | null

  // Configs
  satConfig: SatConfig
  missionConfig: MissionConfig
  groundConfig: GroundConfig

  // Results
  orbitResult: OrbitResult | null
  missionResult: MissionResult | null
  groundResult: GroundResult | null

  // Actions
  setActiveTab: (tab: ActiveTab) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setSatConfig: (c: Partial<SatConfig>) => void
  setMissionConfig: (c: Partial<MissionConfig>) => void
  setGroundConfig: (c: Partial<GroundConfig>) => void
  setOrbitResult: (r: OrbitResult | null) => void
  setMissionResult: (r: MissionResult | null) => void
  setGroundResult: (r: GroundResult | null) => void
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'orbit',
  isLoading: false,
  error: null,

  satConfig: {
    altitude_km: 400,
    inclination_deg: 51.6,
    eccentricity: 0,
    raan_deg: 0,
    arg_perigee_deg: 0,
    true_anomaly_deg: 0,
    num_periods: 1,
    use_j2: false,
  },

  missionConfig: {
    target_altitude_km: 35786,
    spacecraft_mass_kg: 1000,
    isp_s: 300,
  },

  groundConfig: {
    lat_deg: 13.0827,
    lon_deg: 80.2707,
    min_elevation_deg: 5,
    station_name: 'Chennai',
    num_periods: 3,
  },

  orbitResult: null,
  missionResult: null,
  groundResult: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSatConfig: (c) => set((s) => ({ satConfig: { ...s.satConfig, ...c } })),
  setMissionConfig: (c) => set((s) => ({ missionConfig: { ...s.missionConfig, ...c } })),
  setGroundConfig: (c) => set((s) => ({ groundConfig: { ...s.groundConfig, ...c } })),
  setOrbitResult: (orbitResult) => set({ orbitResult }),
  setMissionResult: (missionResult) => set({ missionResult }),
  setGroundResult: (groundResult) => set({ groundResult }),
}))