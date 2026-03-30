import axios from 'axios'
import type {
  OrbitRequest, OrbitResult,
  MissionRequest, MissionResult,
  GroundTrackRequest, GroundResult,
} from '../types/api'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 30_000,
})

export const api = {
  simulateOrbit: (req: OrbitRequest) =>
    client.post<OrbitResult>('/api/orbit/simulate', req).then(r => r.data),

  planMission: (req: MissionRequest) =>
    client.post<MissionResult>('/api/mission/hohmann', req).then(r => r.data),

  getPasses: (req: GroundTrackRequest) =>
    client.post<GroundResult>('/api/ground/passes', req).then(r => r.data),
}