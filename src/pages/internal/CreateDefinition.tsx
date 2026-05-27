import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition } from '../../data/mockData'

const CATEGORIES = ['Pumps', 'Security', 'Life Safety', 'Electrical', 'HVAC', 'Mechanical', 'Plumbing', 'IT Infrastructure', 'Other']

export default function CreateDefinition() {
  const { addDefinition, addToast } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    description: '',
    expectedLifespan: '',
    msrp: '',
  })

  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: '', value: '' }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.manufacturer.trim()) e.manufacturer = 'Manufacturer is required'
    if (!form.model.trim()) e.model = 'Model is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.expectedLifespan || isNaN(Number(form.expectedLifespan))) e.expectedLifespan = 'Enter a valid number'
    if (!form.msrp || isNaN(Number(form.msrp))) e.msrp = 'Enter a valid amount'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const newDef: AssetDefinition = {
      id: `def-${Date.now()}`,
      name: form.name,
      assetClass: 'Equipment',
      category: form.category,
      manufacturer: form.manufacturer,
      model: form.model,
      description: form.description,
      expectedLifespan: Number(form.expectedLifespan),
      msrp: Number(form.msrp),
      state: 'Draft',
      source: 'manual',
      version: 1,
      createdDate: new Date().toISOString().split('T')[0],
      specifications: specs.filter(s => s.label.trim() && s.value.trim()),
    }

    addDefinition(newDef)
    addToast({ type: 'success', title: 'Definition Created', message: `${newDef.name} has been saved as a draft.` })
    navigate(`/internal/definitions/${newDef.id}`)
  }

  const field = (name: keyof typeof form, label: string, type: string = 'text', opts?: { as?: 'textarea' | 'select' }) => (
    <div className="form-group">
      <label className="form-label">{label} <span style={{ color: '#dc2626' }}>*</span></label>
      {opts?.as === 'textarea' ? (
        <textarea
          className="form-textarea"
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
        />
      ) : opts?.as === 'select' ? (
        <select
          className="form-select"
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
        >
          <option value="">Select category...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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
        <span className="breadcrumb-item" onClick={() => navigate('/internal/definitions')}>Asset Definitions</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">New Definition</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Create Asset Definition</h1>
          <p className="page-subtitle">New definitions are saved as Draft and must be published before becoming available.</p>
        </div>
      </div>

      <div className="info-box info">
        <span>ℹ</span>
        <span>This definition will be saved as <strong>Draft</strong>. Use <strong>Publish</strong> from the definition detail to make it available to customers.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 className="card-title">Basic Information</h3>
          <div className="detail-grid">
            <div>{field('name', 'Definition Name')}</div>
            <div>{field('category', 'Category', 'text', { as: 'select' })}</div>
            <div>{field('manufacturer', 'Manufacturer')}</div>
            <div>{field('model', 'Model')}</div>
            <div>{field('expectedLifespan', 'Expected Lifespan (years)', 'number')}</div>
            <div>{field('msrp', 'MSRP (USD)', 'number')}</div>
            <div style={{ gridColumn: '1 / -1' }}>{field('description', 'Description', 'text', { as: 'textarea' })}</div>
          </div>
          <div className="detail-grid" style={{ marginTop: 4 }}>
            <div className="form-group">
              <label className="form-label">Asset Class</label>
              <input className="form-input" value="Equipment" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <div style={{ fontSize: 11, color: 'var(--theme-color-soft-text)', marginTop: 4 }}>V1 supports Equipment class only</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Technical Specifications</h3>
          <p style={{ fontSize: 12, color: 'var(--theme-color-soft-text)', marginBottom: 16 }}>Optional — add key specifications for this asset type.</p>
          {specs.map((spec, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <input
                className="form-input"
                placeholder="Label (e.g. Flow Rate)"
                value={spec.label}
                onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                style={{ flex: 1 }}
              />
              <input
                className="form-input"
                placeholder="Value (e.g. 10 m³/h)"
                value={spec.value}
                onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                style={{ flex: 1 }}
              />
              {specs.length > 1 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSpecs(s => s.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSpecs(s => [...s, { label: '', value: '' }])}>
            + Add Specification
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/internal/definitions')}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save as Draft</button>
        </div>
      </form>
    </>
  )
}
