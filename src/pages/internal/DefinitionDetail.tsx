import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition, type DefinitionSource } from '../../data/mockData'

// ── Source chip (mirrors DefinitionList) ──────────────────────────────────────
function SourceChip({ source }: { source: DefinitionSource }) {
  const cfg: Record<DefinitionSource, { label: string; color: string }> = {
    manual:                { label: 'Manual',       color: '#6366f1' },
    'csv-import':          { label: 'CSV Import',   color: '#0891b2' },
    'api-ingestion':       { label: 'API Ingest',   color: '#7c3aed' },
    'manufacturer-portal': { label: 'Manufacturer', color: '#059669' },
  }
  const { label, color } = cfg[source]
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      background: `${color}18`, color, border: `1px solid ${color}40`,
      fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

const CATEGORIES = ['Pumps', 'Security', 'Life Safety', 'Electrical', 'HVAC', 'Mechanical', 'Plumbing', 'IT Infrastructure', 'Other']

type Modal = null | 'confirm-publish' | 'confirm-archive' | 'confirm-restore' | 'confirm-new-version'

export default function DefinitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { definitions, assets, updateDefinition, publishDefinition, createNewVersion, archiveDefinition, addToast } = useApp()

  // Edit mode (Draft only — HC-6345)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<AssetDefinition>>({})
  const [editSpecs, setEditSpecs] = useState<{ label: string; value: string }[]>([])

  // Modal & publish-validation
  const [modal, setModal] = useState<Modal>(null)
  const [publishErrors, setPublishErrors] = useState<string[]>([])

  const def = definitions.find(d => d.id === id)

  if (!def) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-color-soft-text)' }}>
        Definition not found.{' '}
        <span className="link-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/internal/definitions')}>
          Back to Definitions
        </span>
      </div>
    )
  }

  const linkedAssetCount = assets.filter(a => a.linkedDefinitionId === def.id).length

  // Family: all versions sharing the same baseDefinitionId
  const familyId = def.baseDefinitionId ?? def.id
  const familyVersions = definitions
    .filter(d => (d.baseDefinitionId ?? d.id) === familyId)
    .sort((a, b) => b.version - a.version)

  // The currently Active sibling (for messaging during publish)
  const activeVersion = definitions.find(
    d => d.id !== def.id &&
         (d.baseDefinitionId ?? d.id) === familyId &&
         d.state === 'Published' &&
         d.versionState === 'Active'
  )

  // ── Edit mode (HC-6345) ───────────────────────────────────────────────────────

  const startEdit = () => {
    setEditForm({
      name: def.name,
      category: def.category,
      manufacturer: def.manufacturer,
      model: def.model,
      description: def.description,
      expectedLifespan: def.expectedLifespan,
      msrp: def.msrp,
    })
    setEditSpecs(def.specifications.map(s => ({ ...s })))
    setPublishErrors([])
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
    setEditSpecs([])
  }

  const saveEdit = () => {
    const updated: AssetDefinition = {
      ...def,
      name: String(editForm.name ?? def.name).trim() || def.name,
      category: String(editForm.category ?? def.category) || def.category,
      manufacturer: String(editForm.manufacturer ?? def.manufacturer).trim() || def.manufacturer,
      model: String(editForm.model ?? def.model).trim() || def.model,
      description: String(editForm.description ?? def.description).trim() || def.description,
      expectedLifespan: Number(editForm.expectedLifespan) || def.expectedLifespan,
      msrp: Number(editForm.msrp) || def.msrp,
      specifications: editSpecs.filter(s => s.label.trim() && s.value.trim()),
    }
    updateDefinition(updated)
    addToast({ type: 'success', title: 'Draft Saved', message: `${updated.name} has been updated.` })
    setIsEditing(false)
    setEditForm({})
    setEditSpecs([])
  }

  // ── Lifecycle actions ─────────────────────────────────────────────────────────

  // HC-6844: validate required fields before opening publish modal
  const tryPublish = () => {
    const errors: string[] = []
    if (!def.manufacturer.trim()) errors.push('Manufacturer is required')
    if (!def.model.trim()) errors.push('Model is required')
    if (!def.category) errors.push('Category is required')
    if (!def.description.trim()) errors.push('Description is required')
    if (errors.length > 0) {
      setPublishErrors(errors)
      return
    }
    setPublishErrors([])
    setModal('confirm-publish')
  }

  // HC-6478: atomic publish — deactivates current Active sibling, activates this definition
  const doPublish = () => {
    publishDefinition(def.id)
    setModal(null)
    if (activeVersion) {
      addToast({
        type: 'success',
        title: 'Definition Published',
        message: `v${def.version} is now Active. v${activeVersion.version} has been set to Inactive.`,
      })
    } else {
      addToast({ type: 'success', title: 'Definition Published', message: `${def.name} v${def.version} is now live and active in the catalog.` })
    }
  }

  const doArchive = () => {
    archiveDefinition(def.id)
    setModal(null)
    addToast({ type: 'info', title: 'Definition Archived', message: `${def.name} has been archived. Existing asset links are preserved.` })
  }

  // HC-6845: Restore archived definition back to Published + Active
  const doRestore = () => {
    publishDefinition(def.id)
    setModal(null)
    addToast({ type: 'success', title: 'Definition Restored', message: `${def.name} has been restored and is now active in the catalog.` })
  }

  // HC-6057 / HC-7259: Create new Draft version at N+1
  const doCreateNewVersion = () => {
    const newId = createNewVersion(def.id)
    setModal(null)
    addToast({ type: 'info', title: 'New Version Created', message: `v${def.version + 1} Draft has been created. Edit and publish when ready.` })
    navigate(`/internal/definitions/${newId}`)
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  const editField = (
    key: keyof typeof editForm,
    label: string,
    type: string = 'text',
    opts?: { as?: 'textarea' | 'select' }
  ) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {opts?.as === 'textarea' ? (
        <textarea
          className="form-textarea"
          value={String(editForm[key] ?? '')}
          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
        />
      ) : opts?.as === 'select' ? (
        <select
          className="form-select"
          value={String(editForm[key] ?? '')}
          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
        >
          <option value="">Select category...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input
          className="form-input"
          type={type}
          value={String(editForm[key] ?? '')}
          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  )

  // State badge — shows combined state + versionState for Published
  const stateBadge = () => {
    if (def.state === 'Published' && def.versionState === 'Active') {
      return (
        <>
          <span className="state-badge published">● Published</span>
          <span className="state-badge active" style={{ marginLeft: 6 }}>◉ Active</span>
        </>
      )
    }
    if (def.state === 'Published' && def.versionState === 'Inactive') {
      return (
        <>
          <span className="state-badge published">● Published</span>
          <span className="state-badge inactive" style={{ marginLeft: 6 }}>○ Inactive</span>
        </>
      )
    }
    if (def.state === 'Archived') return <span className="state-badge archived">◎ Archived</span>
    return <span className="state-badge draft">○ Draft</span>
  }

  const versionStateBadge = (d: AssetDefinition) => {
    if (d.state === 'Draft') return <span className="state-badge draft">○ Draft</span>
    if (d.state === 'Archived') return <span className="state-badge archived">◎ Archived</span>
    if (d.versionState === 'Active') return <span className="state-badge active">◉ Active</span>
    return <span className="state-badge inactive">○ Inactive</span>
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/internal/definitions')}>Asset Definitions</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{def.name}</span>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{def.name}</h1>
          <p className="page-subtitle">
            {def.manufacturer} — {def.model} · v{def.version} · {def.category}
          </p>
        </div>
        <div className="page-actions" style={{ alignItems: 'center' }}>
          {stateBadge()}

          {/* Draft actions */}
          {def.state === 'Draft' && !isEditing && (
            <>
              <button className="btn btn-secondary" onClick={startEdit} style={{ marginLeft: 10 }}>
                Edit Draft
              </button>
              <button className="btn btn-primary" onClick={tryPublish} style={{ marginLeft: 6 }}>
                Publish
              </button>
            </>
          )}
          {def.state === 'Draft' && isEditing && (
            <>
              <button className="btn btn-secondary" onClick={cancelEdit} style={{ marginLeft: 10 }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit} style={{ marginLeft: 6 }}>
                Save Changes
              </button>
            </>
          )}

          {/* Published + Active actions — HC-6057: Create New Version */}
          {def.state === 'Published' && def.versionState === 'Active' && (
            <>
              <button className="btn btn-secondary" onClick={() => setModal('confirm-new-version')} style={{ marginLeft: 10 }}>
                Create New Version
              </button>
              <button className="btn btn-secondary" onClick={() => setModal('confirm-archive')} style={{ marginLeft: 6 }}>
                Archive
              </button>
            </>
          )}

          {/* Published + Inactive: archive only */}
          {def.state === 'Published' && def.versionState === 'Inactive' && (
            <button className="btn btn-secondary" onClick={() => setModal('confirm-archive')} style={{ marginLeft: 10 }}>
              Archive
            </button>
          )}

          {/* Archived actions — HC-6845 */}
          {def.state === 'Archived' && (
            <button className="btn btn-primary" onClick={() => setModal('confirm-restore')} style={{ marginLeft: 10 }}>
              Restore to Catalog
            </button>
          )}
        </div>
      </div>

      {/* Publish validation errors (HC-6844) */}
      {publishErrors.length > 0 && (
        <div className="info-box warning">
          <span>⚠</span>
          <div>
            <strong>Cannot publish — the following fields are required:</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: 20, fontSize: 13 }}>
              {publishErrors.map(e => <li key={e}>{e}</li>)}
            </ul>
            <div style={{ fontSize: 12, marginTop: 4 }}>Edit this draft to fill in the missing information, then try publishing again.</div>
          </div>
        </div>
      )}

      {/* State-contextual info-boxes */}
      {def.state === 'Draft' && !isEditing && (
        <div className="info-box info">
          <span>✎</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>
              This definition is a <strong>Draft</strong> ingested via{' '}
              <SourceChip source={def.source} />.{' '}
              Click <strong>Edit Draft</strong> to update its information, or <strong>Publish</strong> to make it available in the customer catalog.
            </span>
            <span style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>
              Drafts are only visible to internal catalog admins. Customers see only Published + Active versions.
            </span>
          </div>
        </div>
      )}
      {def.state === 'Draft' && isEditing && (
        <div className="info-box info">
          <span>✎</span>
          <span>You are editing this draft. Make your changes below, then click <strong>Save Changes</strong> to apply them.</span>
        </div>
      )}
      {def.state === 'Published' && def.versionState === 'Active' && (
        <div className="info-box" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-bdr)', color: 'var(--success)' }}>
          <span>✓</span>
          <span>This is the <strong>Active</strong> version in the customer catalog. Customers can browse and commission assets from it. To update specifications, click <strong>Create New Version</strong> to start a new Draft at v{def.version + 1}.</span>
        </div>
      )}
      {def.state === 'Published' && def.versionState === 'Inactive' && (
        <div className="info-box" style={{ background: 'var(--theme-color-ghost-selected)', borderColor: 'var(--theme-color-soft-bdr)' }}>
          <span>○</span>
          <span>This version has been <strong>superseded</strong> by a newer Active version in the same family. It is no longer shown in the customer catalog and is read-only. Existing asset links are preserved.</span>
        </div>
      )}
      {def.state === 'Archived' && (
        <div className="info-box warning">
          <span>◎</span>
          <span>This definition is <strong>Archived</strong>. It is no longer shown in the customer catalog. Existing asset links are preserved. Click <strong>Restore to Catalog</strong> to make it active again.</span>
        </div>
      )}

      {/* ── Edit mode form (Draft only — HC-6345) ──────────────────────────────── */}
      {isEditing ? (
        <>
          <div className="card">
            <h3 className="card-title">Edit Basic Information</h3>
            <div className="detail-grid">
              <div>{editField('name', 'Definition Name')}</div>
              <div>{editField('category', 'Category', 'text', { as: 'select' })}</div>
              <div>{editField('manufacturer', 'Manufacturer')}</div>
              <div>{editField('model', 'Model')}</div>
              <div>{editField('expectedLifespan', 'Expected Lifespan (years)', 'number')}</div>
              <div>{editField('msrp', 'MSRP (USD)', 'number')}</div>
              <div style={{ gridColumn: '1 / -1' }}>{editField('description', 'Description', 'text', { as: 'textarea' })}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Technical Specifications</h3>
            <p style={{ fontSize: 12, color: 'var(--theme-color-soft-text)', marginBottom: 16 }}>
              Optional — add key specifications for this asset type.
            </p>
            {editSpecs.map((spec, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <input
                  className="form-input"
                  placeholder="Label (e.g. Flow Rate)"
                  value={spec.label}
                  onChange={e => setEditSpecs(s => s.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  style={{ flex: 1 }}
                />
                <input
                  className="form-input"
                  placeholder="Value (e.g. 10 m³/h)"
                  value={spec.value}
                  onChange={e => setEditSpecs(s => s.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                  style={{ flex: 1 }}
                />
                {editSpecs.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditSpecs(s => s.filter((_, j) => j !== i))}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditSpecs(s => [...s, { label: '', value: '' }])}>
              + Add Specification
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
          </div>
        </>
      ) : (
        /* ── Read-only view ────────────────────────────────────────────────────── */
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Basic info */}
            <div className="card">
              <h3 className="card-title">Basic Information</h3>
              <div className="detail-grid">
                <div>
                  <div className="detail-label">Definition Name</div>
                  <div className="detail-value">{def.name}</div>
                </div>
                <div>
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{def.category}</div>
                </div>
                <div>
                  <div className="detail-label">Manufacturer</div>
                  <div className="detail-value">{def.manufacturer || <span style={{ color: 'var(--theme-color-soft-text)' }}>—</span>}</div>
                </div>
                <div>
                  <div className="detail-label">Model</div>
                  <div className="detail-value">{def.model || <span style={{ color: 'var(--theme-color-soft-text)' }}>—</span>}</div>
                </div>
                <div>
                  <div className="detail-label">Asset Class</div>
                  <div className="detail-value">{def.assetClass}</div>
                </div>
                <div>
                  <div className="detail-label">Version</div>
                  <div className="detail-value">v{def.version}</div>
                </div>
                <div>
                  <div className="detail-label">Source Channel</div>
                  <div className="detail-value"><SourceChip source={def.source} /></div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Description</div>
                  <div className="detail-value">
                    {def.description || <span style={{ color: 'var(--theme-color-soft-text)', fontStyle: 'italic' }}>No description provided.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Lifecycle & commercial */}
            <div className="card">
              <h3 className="card-title">Lifecycle &amp; Commercial</h3>
              <div className="detail-grid">
                <div>
                  <div className="detail-label">Expected Lifespan</div>
                  <div className="detail-value">{def.expectedLifespan} years</div>
                </div>
                <div>
                  <div className="detail-label">MSRP</div>
                  <div className="detail-value">${def.msrp?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="detail-label">Created</div>
                  <div className="detail-value">{def.createdDate}</div>
                </div>
                <div>
                  <div className="detail-label">Published</div>
                  <div className="detail-value">{def.publishedDate ?? '—'}</div>
                </div>
                {def.archivedDate && (
                  <div>
                    <div className="detail-label">Archived</div>
                    <div className="detail-value">{def.archivedDate}</div>
                  </div>
                )}
                <div>
                  <div className="detail-label">Commissioned Assets</div>
                  <div className="detail-value">{linkedAssetCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical specifications */}
          {def.specifications && def.specifications.length > 0 && (
            <div className="card">
              <h3 className="card-title">Technical Specifications</h3>
              <table className="data-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Specification</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {def.specifications.map(s => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Commissioned assets panel */}
          {linkedAssetCount > 0 && (
            <div className="card">
              <h3 className="card-title">Commissioned Assets</h3>
              <table className="data-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Serial Number</th>
                    <th>Location</th>
                    <th>Install Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assets
                    .filter(a => a.linkedDefinitionId === def.id)
                    .map(a => (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{a.serialNumber}</td>
                        <td>{a.location}</td>
                        <td>{a.installDate}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Version History panel (HC-6120) ─────────────────────────────────── */}
          {familyVersions.length > 1 && (
            <div className="card">
              <h3 className="card-title">Version History</h3>
              <p style={{ fontSize: 12, color: 'var(--theme-color-soft-text)', marginBottom: 12 }}>
                All versions of the <strong>{def.name}</strong> definition family. Only the Active version is visible in the customer catalog.
              </p>
              <table className="data-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>State</th>
                    <th>Source</th>
                    <th>MSRP</th>
                    <th>Created</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {familyVersions.map(v => (
                    <tr
                      key={v.id}
                      style={v.id === def.id ? { background: 'var(--theme-color-ghost-selected)', fontWeight: 500 } : {}}
                    >
                      <td>
                        v{v.version}
                        {v.id === def.id && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--theme-color-soft-text)', fontWeight: 400 }}>(this version)</span>
                        )}
                      </td>
                      <td>{versionStateBadge(v)}</td>
                      <td><SourceChip source={v.source} /></td>
                      <td>${v.msrp?.toLocaleString()}</td>
                      <td>{v.createdDate}</td>
                      <td>{v.publishedDate ?? '—'}</td>
                      <td>
                        {v.id !== def.id ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/internal/definitions/${v.id}`)}
                          >
                            {v.state === 'Draft' ? 'Review' : 'View'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Lifecycle history */}
          <div className="card">
            <h3 className="card-title">Lifecycle History</h3>
            <table className="data-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Definition Created</td>
                  <td>{def.createdDate}</td>
                  <td><span className="state-badge draft">○ Draft</span></td>
                </tr>
                {def.publishedDate && (
                  <tr>
                    <td>Published to Catalog</td>
                    <td>{def.publishedDate}</td>
                    <td><span className="state-badge published">● Published</span></td>
                  </tr>
                )}
                {def.archivedDate && (
                  <tr>
                    <td>Archived</td>
                    <td>{def.archivedDate}</td>
                    <td><span className="state-badge archived">◎ Archived</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Confirm Publish modal ─────────────────────────────────────────────── */}
      {modal === 'confirm-publish' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Publish Definition</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box info">
                <span>ℹ</span>
                <div>
                  <strong>Publish "{def.name}" v{def.version} to the catalog?</strong>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    This version will become <strong>Active</strong> in the customer catalog immediately.
                    {activeVersion && (
                      <> v{activeVersion.version} (currently Active) will automatically be set to <strong>Inactive</strong>.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="detail-grid" style={{ marginTop: 12 }}>
                <div><div className="detail-label">Name</div><div className="detail-value">{def.name}</div></div>
                <div><div className="detail-label">Category</div><div className="detail-value">{def.category}</div></div>
                <div><div className="detail-label">Manufacturer</div><div className="detail-value">{def.manufacturer}</div></div>
                <div><div className="detail-label">Version</div><div className="detail-value">v{def.version}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doPublish}>Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm New Version modal (HC-6057) ──────────────────────────────── */}
      {modal === 'confirm-new-version' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Version</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box info">
                <span>ℹ</span>
                <div>
                  <strong>Create v{def.version + 1} of "{def.name}"?</strong>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    A new <strong>Draft</strong> will be created at v{def.version + 1}, pre-populated with the current specifications.
                    The current <strong>Active</strong> version (v{def.version}) will remain live until you publish the new version.
                    This is the recommended way to update a published definition.
                  </p>
                </div>
              </div>
              <div className="detail-grid" style={{ marginTop: 12 }}>
                <div><div className="detail-label">Current Version</div><div className="detail-value">v{def.version} (Active)</div></div>
                <div><div className="detail-label">New Version</div><div className="detail-value">v{def.version + 1} (Draft)</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doCreateNewVersion}>Create v{def.version + 1} Draft</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Archive modal ─────────────────────────────────────────────── */}
      {modal === 'confirm-archive' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Archive Definition</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box warning">
                <span>⚠</span>
                <div>
                  <strong>Archive "{def.name}" v{def.version}?</strong>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    This definition will be removed from the customer catalog. <strong>Existing commissioned asset links are preserved</strong> and will continue to reference this definition.
                    You can <strong>restore</strong> this definition later to make it active again.
                  </p>
                </div>
              </div>
              {linkedAssetCount > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--theme-color-ghost-selected)', borderRadius: 6, fontSize: 13 }}>
                  <strong>{linkedAssetCount}</strong> asset{linkedAssetCount !== 1 ? 's are' : ' is'} currently linked to this definition and will retain their link after archiving.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={doArchive}>Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Restore modal (HC-6845) ──────────────────────────────────── */}
      {modal === 'confirm-restore' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Restore Definition</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box info">
                <span>ℹ</span>
                <div>
                  <strong>Restore "{def.name}" to the catalog?</strong>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    This definition will be set back to <strong>Published &amp; Active</strong> and will reappear in the customer catalog immediately.
                    {activeVersion && (
                      <> v{activeVersion.version} (currently Active) will automatically be set to <strong>Inactive</strong>.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doRestore}>Restore to Catalog</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
