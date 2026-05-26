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

// ─── Inline SVG persona icons ────────────────────────────────────────────────

const IconCatalogAdmin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-6z" />
    <path d="M9 3v6h6" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
)

const IconCustomerAdmin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10" />
    <path d="M8 7h.01M12 7h.01M16 7h.01" />
  </svg>
)

const IconTechnician = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

// ─── Persona Selector ────────────────────────────────────────────────────────

function PersonaSelector() {
  const { setPersona } = useApp()
  const navigate = useNavigate()

  const select = (p: 'internal-admin' | 'customer-admin' | 'technician', path: string) => {
    setPersona(p)
    navigate(path)
  }

  return (
    <div className="persona-selector-page">
      <div className="persona-selector-logo persona-selector-title">CAMS</div>
      <div className="persona-selector-subtitle">Centralized Asset Management System</div>
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontSize: 13 }}>
        Select a persona to explore the prototype
      </p>
      <div className="persona-cards persona-selector-grid">

        <button
          className="persona-card"
          onClick={() => select('internal-admin', '/internal/definitions')}
        >
          <div className="persona-card-icon">
            <IconCatalogAdmin />
          </div>
          <div className="persona-card-name">Catalog Admin</div>
          <div className="persona-card-desc">Manage asset definitions lifecycle: Draft → Published → Active</div>
        </button>

        <button
          className="persona-card"
          onClick={() => select('customer-admin', '/customer/assets')}
        >
          <div className="persona-card-icon">
            <IconCustomerAdmin />
          </div>
          <div className="persona-card-name">Customer Admin</div>
          <div className="persona-card-desc">Manage facility assets, link to catalog definitions, commission new assets</div>
        </button>

        <button
          className="persona-card"
          onClick={() => select('technician', '/technician/workorders')}
        >
          <div className="persona-card-icon">
            <IconTechnician />
          </div>
          <div className="persona-card-name">WO Technician</div>
          <div className="persona-card-desc">View and action work orders with linked asset catalog data</div>
        </button>

      </div>
      <p style={{ marginTop: 40, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        CAMS Prototype · Siemens Building X · For demonstration purposes only
      </p>
    </div>
  )
}

// ─── Protected Routes ────────────────────────────────────────────────────────

function ProtectedRoutes() {
  const { persona } = useApp()

  if (!persona) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell>
      <Routes>
        {/* Catalog Admin routes */}
        <Route path="/internal/definitions"      element={<DefinitionList />} />
        <Route path="/internal/definitions/new"  element={<CreateDefinition />} />
        <Route path="/internal/definitions/:id"  element={<DefinitionDetail />} />

        {/* Customer Admin routes */}
        <Route path="/customer/assets"           element={<AssetList />} />
        <Route path="/customer/assets/new"       element={<AddAsset />} />
        <Route path="/customer/assets/:id"       element={<AssetDetail />} />
        <Route path="/customer/catalog"          element={<CatalogBrowse />} />

        {/* Technician routes */}
        <Route path="/technician/workorders"     element={<WorkOrderList />} />
        <Route path="/technician/workorders/:id" element={<WorkOrderDetail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/"   element={<PersonaSelector />} />
        <Route path="/*"  element={<ProtectedRoutes />} />
      </Routes>
    </AppProvider>
  )
}
