import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type Asset } from '../../data/mockData'

const CATEGORIES = ['All', 'Pumps', 'Security', 'Life Safety', 'Electrical', 'HVAC', 'Mechanical', 'Plumbing', 'IT Infrastructure', 'Other']

export default function CatalogBrowse() {
  const { definitions, addAsset, addToast } = useApp()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [selectedDef, setSelectedDef] = useState<typeof definitions[0] | null>(null)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [commissionDef, setCommissionDef] = useState<typeof definitions[0] | null>(null)
  const [commissionForm, setCommissionForm] = useState({
    name: '',
    serialNumber: '',
    location: '',
    installDate: '',
  })
  const [commissionErrors, setCommissionErrors] = useState<Record<string, string>>({})

  // Only show Active definitions in the public catalog
  const activeDefs = definitions.filter(d => d.state === 'Active')

  const filtered = activeDefs.filter(d => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'All' || d.category === filterCategory
    return matchSearch && matchCat
  })

  const openDetail = (def: typeof definitions[0]) => {
    setSelectedDef(def)
  }

  const openCommission = (def: typeof definitions[0]) => {
    setCommissionDef(def)
    setCommissionForm({ name: def.name, serialNumber: '', location: '', installDate: '' })
    setCommissionErrors({})
    setShowCommissionModal(true)
    setSelectedDef(null)
  }

  const validateCommission = () => {
    const e: Record<string, string> = {}
    if (!commissionForm.name.trim()) e.name = 'Name is required'
    if (!commissionForm.serialNumber.trim()) e.serialNumber = 'Serial number is required'
    if (!commissionForm.location.trim()) e.location = 'Location is required'
    if (!commissionForm.installDate) e.installDate = 'Install date is required'
    return e
  }

  const handleCommission = () => {
    const errs = validateCommission()
    if (Object.keys(errs).length > 0) {
      setCommissionErrors(errs)
      return
    }
    if (!commissionDef) return

    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      name: commissionForm.name,
      serialNumber: commissionForm.serialNumber,
      category: commissionDef.category,
      location: commissionForm.location,
      manufacturer: commissionDef.manufacturer,
      model: commissionDef.model,
      installDate: commissionForm.installDate,
      linkedDefinitionId: commissionDef.id,
      recommendedDefinitionId: undefined,
    }

    addAsset(newAsset)
    setShowCommissionModal(false)
    addToast({
      type: 'success',
      title: 'Asset Commissioned',
      message: `${newAsset.name} has been added and linked to "${commissionDef.name}".`,
    })
    navigate(`/customer/assets/${newAsset.id}`)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Catalog</h1>
          <p className="page-subtitle">Explore active asset definitions. Commission a new asset directly from a catalog entry.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: '12px 20px', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a' }}>{activeDefs.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>Active Definitions</div>
        </div>
        <div className="card" style={{ padding: '12px 20px', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#6b7280' }}>{filtered.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>Showing</div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search catalog..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Catalog Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--theme-color-soft-text)' }}>
          No catalog definitions found matching your filters.
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map(def => (
            <div key={def.id} className="catalog-card" onClick={() => openDetail(def)}>
              <div className="catalog-card-header">
                <span className="catalog-category-badge">{def.category}</span>
                <span style={{ fontSize: 11, color: 'var(--theme-color-soft-text)' }}>v{def.version}</span>
              </div>
              <div className="catalog-card-title">{def.name}</div>
              <div className="catalog-card-sub">{def.manufacturer} — {def.model}</div>
              <div className="catalog-card-desc">{def.description}</div>
              <div className="catalog-card-footer">
                <span style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>
                  Lifespan: {def.expectedLifespan}yr · MSRP: ${def.msrp?.toLocaleString()}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={e => { e.stopPropagation(); openCommission(def) }}
                >
                  Commission Asset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Definition Detail Drawer / Modal (HC-6843 browse detail) */}
      {selectedDef && (
        <div className="modal-overlay" onClick={() => setSelectedDef(null)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="catalog-category-badge" style={{ marginRight: 8 }}>{selectedDef.category}</span>
                <h3 style={{ display: 'inline' }}>{selectedDef.name}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDef(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 16 }}>
                <div><div className="detail-label">Manufacturer</div><div className="detail-value">{selectedDef.manufacturer}</div></div>
                <div><div className="detail-label">Model</div><div className="detail-value">{selectedDef.model}</div></div>
                <div><div className="detail-label">Expected Lifespan</div><div className="detail-value">{selectedDef.expectedLifespan} years</div></div>
                <div><div className="detail-label">MSRP</div><div className="detail-value">${selectedDef.msrp?.toLocaleString()}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><div className="detail-label">Description</div><div className="detail-value">{selectedDef.description}</div></div>
              </div>
              {selectedDef.specifications && selectedDef.specifications.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Technical Specifications</div>
                  <table className="data-table" style={{ marginTop: 0 }}>
                    <thead><tr><th>Specification</th><th>Value</th></tr></thead>
                    <tbody>
                      {selectedDef.specifications.map(s => (
                        <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDef(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => openCommission(selectedDef)}>Commission Asset</button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal — HC-6843 Flow 1 */}
      {showCommissionModal && commissionDef && (
        <div className="modal-overlay" onClick={() => setShowCommissionModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Commission Asset from Catalog</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCommissionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box info" style={{ marginBottom: 16 }}>
                <span>📋</span>
                <span>Commissioning from: <strong>{commissionDef.name}</strong> ({commissionDef.manufacturer} — {commissionDef.model})</span>
              </div>
              <div className="form-group">
                <label className="form-label">Asset Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  className="form-input"
                  value={commissionForm.name}
                  onChange={e => { setCommissionForm(f => ({ ...f, name: e.target.value })); setCommissionErrors(er => ({ ...er, name: '' })) }}
                />
                {commissionErrors.name && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{commissionErrors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  className="form-input"
                  value={commissionForm.serialNumber}
                  onChange={e => { setCommissionForm(f => ({ ...f, serialNumber: e.target.value })); setCommissionErrors(er => ({ ...er, serialNumber: '' })) }}
                  placeholder="e.g. SN-20240001"
                />
                {commissionErrors.serialNumber && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{commissionErrors.serialNumber}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Location <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  className="form-input"
                  value={commissionForm.location}
                  onChange={e => { setCommissionForm(f => ({ ...f, location: e.target.value })); setCommissionErrors(er => ({ ...er, location: '' })) }}
                  placeholder="e.g. Building A, Level 2"
                />
                {commissionErrors.location && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{commissionErrors.location}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Install Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  className="form-input"
                  type="date"
                  value={commissionForm.installDate}
                  onChange={e => { setCommissionForm(f => ({ ...f, installDate: e.target.value })); setCommissionErrors(er => ({ ...er, installDate: '' })) }}
                />
                {commissionErrors.installDate && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{commissionErrors.installDate}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCommissionModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCommission}>Commission &amp; Link</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
