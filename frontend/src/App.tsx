import { useEffect } from 'react'
import LeftPanel from './components/LeftPanel'
import OrbitViewer from './components/OrbitViewer'
import RightPanel from './components/RightPanel'
import { useStore } from './store/useStore'
import { api } from './lib/api'

export default function App() {
  const { satConfig, setOrbitResult, setLoading, setError } = useStore()

  // Auto-run ISS orbit on first load so the globe isn't empty
  useEffect(() => {
    setLoading(true)
    api.simulateOrbit({ ...satConfig, num_points: 500, include_ground_track: true })
      .then(setOrbitResult)
      .catch(e => setError(e instanceof Error ? e.message : 'Auto-load failed'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#020409' }}>
      <aside style={{ width: '256px', flexShrink: 0, borderRight: '1px solid #0a1628', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <LeftPanel />
      </aside>

      <main style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <OrbitViewer />
      </main>

      <aside style={{ width: '256px', flexShrink: 0, borderLeft: '1px solid #0a1628', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <RightPanel />
      </aside>
    </div>
  )
}