import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type Asset } from '../../data/mockData'

const CATEGORIES = ['Pumps', 'Security', 'Life Safety', 'Electrical', 'HVAC', 'Mechanical', 'Plumbing', 'IT Infrastructure', 'Other']

export default function AddAsset() {
  const { definitions, addAsset, addToast } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    serialNumber: '',
    category: '',
    location: '',
    manufacturer: '',
    model: '',
    installDate: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<Asset | null>(null)
  const [matchedDef, setMatchedDef] = useState<typeof definitions[0] | null>(null)

  // Find a matching active definition by name/model/manufacturer similarity
  const findMatch = (f: typeof form) => {
    if (!f.category) return null
    const activeDefs = definitions.filter(d => d.state === 'Published' && d.versionState === 'Active')
    const query = [f.manufacturer, f.model, f.name].map(s => s.toLowerCase()).join(' ')
    for (const def of activeDefs) {
      const defStr = [def.manufacturer, def.model, def.name, def.category].map(s => s.toLowerCase()).join(' ')
      if (
        (f.category && def.category === f.category) &&
        (
          (f.manufacturer && def.manufacturer.toLowerCase().includes(f.manufacturer.toLowerCase())) ||
          (f.model && def.model.toLowerCase().includes(f.model.toLowerCase())) ||
          (f.name && def.name.toLowerCase().includes(f.name.toLowerCase())) ||
          (query.split(' ').some(word => word.length > 3 && defStr.includes(word)))
        )
      ) {
        return def
      }
    }
    return null
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Asset name is required'
    if (!form.serialNumber.trim()) e.serialNumber = 'Serial number is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.installDate) e.installDate = 'Install date is required'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const match = findMatch(form)

    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      name: form.name,
      serialNumber: form.serialNumber,
      category: form.category,
      location: form.location,
      manufacturer: form.manufacturer,
      model: form.model,
      installDate: form.installDate,
      notes: form.notes,
      linkedDefinitionId: undefined,
      recommendedDefinitionId: match ? match.id : undefined,
    }

    if (match) {
      // HC-5635: show acceptance modal before saving
      setMatchedDef(match)
      setPendingAsset(newAsset)
      setShowAcceptModal(true)
    } else {
      addAsset(newAsset)
      addToast({ type: 'success', title: 'Asset Added', message: `${newAsset.name} has been added.` })
      navigate(`/customer/assets/${newAsset.id}`)
    }
  }

  const handleAcceptAndLink = () => {
    if (!pendingAsset || !matchedDef) return
    const linked = { ...pendingAsset, linkedDefinitionId: matchedDef.id, recommendedDefinitionId: undefined }
    addAsset(linked)
    addToast({ type: 'success', title: 'Asset Added & Linked', message: `${linked.name} has been added and linked to "${matchedDef.name}".` })
    navigate(`/customer/assets/${linked.id}`)
  }

  const handleSkipLink = () => {
    if (!pendingAsset) return
    addAsset(pendingAsset)
    addToast({ type: 'success', title: 'Asset Added', message: `${pendingAsset.name} has been added. You can link it to the catalog later.` })
    navigate(`/customer/assets/${pendingAsset.id}`)
  }

  const field = (name: keyof typeof form, label: string, required = false, type = 'text', as?: 'select' | 'textarea') => (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {as === 'select' ? (
        <select
          className="form-select"
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
        >
          <option value="">Select category...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          className="form-textarea"
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
        />
      ) : (
        <input
          className="form-input"
          type={type}
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
        />
      )}
      {errors[name] && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors[name]}</div>}
    </div>
  )

  return (
    <>
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/customer/assets')}>Assets</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Add Asset</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Asset</h1>
          <p className="page-subtitle">Register a new facility asset. If a matching catalog definition is found, you can link it immediately.</p>
        </div>
      </div>

      <div className="info-box info">
        <span>ℹ</span>
        <span>If a matching catalog definition is found for this asset, you will be prompted to link it during save. Linking enriches the asset with standardised manufacturer data and specifications.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 className="card-title">Asset Information</h3>
          <div className="detail-grid">
            <div>{field('name', 'Asset Name', true)}</div>
            <div>{field('serialNumber', 'Serial Number', true)}</div>
            <div>{field('category', 'Category', true, 'text', 'select')}</div>
            <div>{field('location', 'Location', true)}</div>
            <div>{field('manufacturer', 'Manufacturer')}</div>
            <div>{field('model', 'Model')}</div>
            <div>{field('installDate', 'Install Date', true, 'date')}</div>
            <div></div>
            <div style={{ gridColumn: '1 / -1' }}>{field('notes', 'Notes', false, 'text', 'textarea')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/customer/assets')}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Asset</button>
        </div>
      </form>

      {/* Acceptance Modal — HC-5635 Flow 2 */}
      {showAcceptModal && matchedDef && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Information available from Catalog</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAcceptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--theme-color-soft-text)', fontSize: 14 }}>
                A catalog definition matching this asset was found. Linking will enrich it with standardised data.
              </p>
              <div className="card" style={{ background: 'var(--theme-color-ghost-selected)', marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{matchedDef.name}</div>
                <div style={{ color: 'var(--theme-color-soft-text)', fontSize: 13, marginBottom: 12 }}>
                  {matchedDef.manufacturer} — {matchedDef.model} · v{matchedDef.version}
                </div>
                <div className="detail-grid" style={{ gap: '8px 24px' }}>
                  <div>
                    <div className="detail-label">Category</div>
                    <div className="detail-value">{matchedDef.category}</div>
                  </div>
                  <div>
                    <div className="detail-label">Expected Lifespan</div>
                    <div className="detail-value">{matchedDef.expectedLifespan} years</div>
                  </div>
                  <div>
                    <div className="detail-label">MSRP</div>
                    <div className="detail-value">${matchedDef.msrp?.toLocaleString()}</div>
                  </div>
                </div>
                {matchedDef.description && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--theme-color-soft-text)' }}>
                    {matchedDef.description}
                  </div>
                )}
                {matchedDef.specifications && matchedDef.specifications.length > 0 && (
                  <>
                    <div style={{ marginTop: 14, marginBottom: 8, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>Specifications</div>
                    {matchedDef.specifications.map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--theme-color-soft-bdr)' }}>
                        <span style={{ color: 'var(--theme-color-soft-text)' }}>{s.label}</span>
                        <span style={{ fontWeight: 500 }}>{s.value}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleSkipLink}>Skip &amp; Save Without Linking</button>
              <button className="btn btn-primary" onClick={handleAcceptAndLink}>Accept &amp; Link</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
