import LeftPanel from './components/LeftPanel'
import OrbitViewer from './components/OrbitViewer'
import RightPanel from './components/RightPanel'

export default function App() {
  return (
    <div className="flex h-screen w-screen bg-space-950 overflow-hidden font-display">
      {/* Left Panel */}
      <aside className="w-64 flex-shrink-0 border-r border-space-700 flex flex-col">
        <LeftPanel />
      </aside>

      {/* Center — 3D Viewer */}
      <main className="flex-1 relative">
        <OrbitViewer />
      </main>

      {/* Right Panel */}
      <aside className="w-64 flex-shrink-0 border-l border-space-700 flex flex-col">
        <RightPanel />
      </aside>
    </div>
  )
}