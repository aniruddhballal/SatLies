import LeftPanel from './components/LeftPanel'
import OrbitViewer from './components/OrbitViewer'
import RightPanel from './components/RightPanel'

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#020409' }}>
      {/* Left Panel */}
      <aside style={{ width: '256px', flexShrink: 0, borderRight: '1px solid #0a1628', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <LeftPanel />
      </aside>

      {/* Center — 3D Viewer */}
      <main style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <OrbitViewer />
      </main>

      {/* Right Panel */}
      <aside style={{ width: '256px', flexShrink: 0, borderLeft: '1px solid #0a1628', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <RightPanel />
      </aside>
    </div>
  )
}