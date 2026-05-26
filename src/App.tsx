import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AppShell from './components/AppShell'

// Internal pages
import DefinitionList from './pages/internal/DefinitionList'
import DefinitionDetail from './pages/internal/DefinitionDetail'
import CreateDefinition from './pages/internal/CreateDefinition'

// Customer pages
import AssetList from './pages/customer/AssetList'
import AssetDetail from './pages/customer/AssetDetail'
import AddAsset from './pages/customer/AddAsset'
import CatalogBrowse from './pages/customer/CatalogBrowse'

// Technician pages
import WorkOrderList from './pages/technician/WorkOrderList'
import WorkOrderDetail from './pages/technician/WorkOrderDetail'

function PersonaSelector() {
  const { setPersona } = useApp()
  const navigate = useNavigate()

  const select = (p: 'internal-admin' | 'customer-admin' | 'technician', path: string) => {
    setPersona(p)
    navigate(path)
  }

  return (
    <div className="persona-selector-page">
      <div className="persona-selector-title">CAMS</div>
      <div className="persona-selector-subtitle">Centralized Asset Management System</div>
      <p style={{ textAlign: 'center', color: 'var(--theme-color-soft-text)', marginBottom: 32, fontSize: 14 }}>
        Select a persona to explore the prototype
      </p>
      <div className="persona-cards">
        <button
          className="persona-card"
          onClick={() => select('internal-admin', '/internal/definitions')}
        >
          <div className="persona-card-icon">🏢</div>
          <div className="persona-card-name">Internal Admin</div>
          <div className="persona-card-desc">Manage asset definitions lifecycle: Draft → Published → Active</div>
        </button>
        <button
          className="persona-card"
          onClick={() => select('customer-admin', '/customer/assets')}
        >
          <div className="persona-card-icon">🏭</div>
          <div className="persona-card-name">Customer Admin</div>
          <div className="persona-card-desc">Manage facility assets, link to catalog definitions, commission new assets</div>
        </button>
        <button
          className="persona-card"
          onClick={() => select('technician', '/technician/workorders')}
        >
          <div className="persona-card-icon">🔧</div>
          <div className="persona-card-name">WO Technician</div>
          <div className="persona-card-desc">View and action work orders with linked asset catalog data</div>
        </button>
      </div>
      <p style={{ marginTop: 40, fontSize: 11, color: 'var(--theme-color-soft-text)', textAlign: 'center' }}>
        CAMS Prototype · Siemens Building X · For demonstration purposes only
      </p>
    </div>
  )
}

function ProtectedRoutes() {
  const { persona } = useApp()

  if (!persona) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell>
      <Routes>
        {/* Internal Admin routes */}
        <Route path="/internal/definitions" element={<DefinitionList />} />
        <Route path="/internal/definitions/new" element={<CreateDefinition />} />
        <Route path="/internal/definitions/:id" element={<DefinitionDetail />} />

        {/* Customer Admin routes */}
        <Route path="/customer/assets" element={<AssetList />} />
        <Route path="/customer/assets/new" element={<AddAsset />} />
        <Route path="/customer/assets/:id" element={<AssetDetail />} />
        <Route path="/customer/catalog" element={<CatalogBrowse />} />

        {/* Technician routes */}
        <Route path="/technician/workorders" element={<WorkOrderList />} />
        <Route path="/technician/workorders/:id" element={<WorkOrderDetail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<PersonaSelector />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AppProvider>
  )
}
