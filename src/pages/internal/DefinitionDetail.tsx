import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition, type DefinitionState } from '../../data/mockData'

type Modal = null | 'publish' | 'activate' | 'publish-activate' | 'already-published' | 'already-active' | 'confirm-publish' | 'confirm-activate' | 'confirm-publish-activate'

export default function DefinitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { definitions, updateDefinition, addToast } = useApp()
  const [modal, setModal] = useState<Modal>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'lifecycle'>('details')

  const def = definitions.find(d => d.id === id)

  if (!def) {
    return (
      <div className="page-content">
        <div className="info-box error"><span>✕</span><span>Definition not found.</span></div>
        <button className="btn btn-secondary" onClick={() => navigate('/internal/definitions')}>← Back</button>
      </div>
    )
  }

  const handlePublishAndActivate = () => {
    if (def.state === 'Active') {
      setModal('already-active')
    } else if (def.state === 'Published') {
      setModal('already-published')
    } else {
      setModal('confirm-publish-activate')
    }
  }

  const handlePublish = () => {
    if (def.state === 'Published' || def.state === 'Active') {
      setModal('already-published')
    } else {
      setModal('confirm-publish')
    }
  }

  const handleActivate = () => {
    if (def.state === 'Active') {
      setModal('already-active')
    } else if (def.state === 'Draft') {
      // Can't activate a draft directly
      setModal('publish')
    } else {
      setModal('confirm-activate')
    }
  }

  const doPublish = () => {
    const updated: AssetDefinition = {
      ...def,
      state: 'Published',
      publishedDate: new Date().toISOString().split('T')[0],
    }
    updateDefinition(updated)
    setModal(null)
    addToast({ type: 'success', title: 'Definition Published', message: `${def.name} is now published to the catalog.` })
  }

  const doActivate = () => {
    const updated: AssetDefinition = {
      ...def,
      state: 'Active',
      activatedDate: new Date().toISOString().split('T')[0],
    }
    updateDefinition(updated)
    setModal(null)
    addToast({ type: 'success', title: 'Definition Activated', message: `${def.name} is now active and visible to customers.` })
  }

  const doPublishAndActivate = () => {
    const today = new Date().toISOString().split('T')[0]
    const updated: AssetDefinition = {
      ...def,
      state: 'Active',
      publishedDate: today,
      activatedDate: today,
    }
    updateDefinition(updated)
    setModal(null)
    addToast({ type: 'success', title: 'Definition Published & Activated', message: `${def.name} is now live.` })
  }

  const stepState = (step: 1 | 2 | 3) => {
    if (def.state === 'Draft') return step === 1 ? 'current' : 'pending'
    if (def.state === 'Published') return step === 1 ? 'done' : step === 2 ? 'current' : 'pending'
    return 'done'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{def.name}</h1>
            <StateBadge state={def.state} />
            <span style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>v{def.version}</span>
          </div>
          <p className="page-subtitle">{def.manufacturer} · {def.model} · {def.category}</p>
        </div>
        <div className="page-actions">
          {def.state === 'Draft' && (
            <>
              <button className="btn btn-secondary" onClick={handlePublish}>Publish</button>
              <button className="btn btn-primary" onClick={handlePublishAndActivate}>Publish & Activate</button>
            </>
          )}
          {def.state === 'Published' && (
            <>
              <button className="btn btn-secondary" onClick={() => setModal('already-published')} title="Definition is already published">Publish</button>
              <button className="btn btn-primary" onClick={handleActivate}>Activate</button>
              <button className="btn btn-secondary" onClick={handlePublishAndActivate}>Publish & Activate</button>
            </>
          )}
          {def.state === 'Active' && (
            <button className="btn btn-secondary" onClick={() => addToast({ type: 'info', title: 'Already Active', message: 'This definition is already active.' })}>
              ✓ Active
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle stepper */}
      <div className="lifecycle-stepper">
        <div className={`lifecycle-step ${stepState(1)}`}>
          <div className="lifecycle-step-circle">{def.state !== 'Draft' ? '✓' : '1'}</div>
          <div className="lifecycle-step-label">Draft</div>
          {def.createdDate && <div style={{ fontSize: 10, color: 'var(--theme-color-soft-text)' }}>{def.createdDate}</div>}
        </div>
        <div className={`lifecycle-connector ${def.state !== 'Draft' ? 'done' : ''}`} />
        <div className={`lifecycle-step ${stepState(2)}`}>
          <div className="lifecycle-step-circle">{def.state === 'Active' ? '✓' : '2'}</div>
          <div className="lifecycle-step-label">Published</div>
          {def.publishedDate && <div style={{ fontSize: 10, color: 'var(--theme-color-soft-text)' }}>{def.publishedDate}</div>}
        </div>
        <div className={`lifecycle-connector ${def.state === 'Active' ? 'done' : ''}`} />
        <div className={`lifecycle-step ${stepState(3)}`}>
          <div className="lifecycle-step-circle">{def.state === 'Active' ? '✓' : '3'}</div>
          <div className="lifecycle-step-label">Active</div>
          {def.activatedDate && <div style={{ fontSize: 10, color: 'var(--theme-color-soft-text)' }}>{def.activatedDate}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['details', 'specs', 'lifecycle'] as const).map(tab => (
          <div
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'details' ? 'Details' : tab === 'specs' ? 'Specifications' : 'Lifecycle'}
          </div>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="card">
          <h3 className="card-title">Definition Information</h3>
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{def.name}</span></div>
            <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{def.category}</span></div>
            <div className="detail-row"><span className="detail-label">Manufacturer</span><span className="detail-value">{def.manufacturer}</span></div>
            <div className="detail-row"><span className="detail-label">Model</span><span className="detail-value">{def.model}</span></div>
            <div className="detail-row"><span className="detail-label">Expected Lifespan</span><span className="detail-value">{def.expectedLifespan} years</span></div>
            <div className="detail-row"><span className="detail-label">MSRP</span><span className="detail-value">${def.msrp.toLocaleString()}</span></div>
            <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
              <span className="detail-label">Description</span>
              <span className="detail-value">{def.description}</span>
            </div>
          </div>
        </div>
      )}

      {/* Specs tab */}
      {activeTab === 'specs' && (
        <div className="card">
          <h3 className="card-title">Technical Specifications</h3>
          {def.specifications.length === 0 ? (
            <div style={{ color: 'var(--theme-color-soft-text)', fontSize: 13 }}>No specifications added yet.</div>
          ) : (
            <table className="spec-table">
              <tbody>
                {def.specifications.map((s, i) => (
                  <tr key={i}>
                    <td>{s.label}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Lifecycle tab */}
      {activeTab === 'lifecycle' && (
        <div className="card">
          <h3 className="card-title">Lifecycle History</h3>
          <table className="data-table">
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
                <td><span className="state-badge draft">Draft</span></td>
              </tr>
              {def.publishedDate && (
                <tr>
                  <td>Published to Catalog</td>
                  <td>{def.publishedDate}</td>
                  <td><span className="state-badge published">Published</span></td>
                </tr>
              )}
              {def.activatedDate && (
                <tr>
                  <td>Activated</td>
                  <td>{def.activatedDate}</td>
                  <td><span className="state-badge active">Active</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Confirm Publish & Activate (from Draft) */}
      {modal === 'confirm-publish-activate' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Publish & Activate Definition</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box info">
              <span>ℹ</span>
              <div>
                <strong>This action will publish and activate <em>{def.name}</em> in one step.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>The definition will be immediately visible to Customer Admins and available to link to assets.</p>
              </div>
            </div>
            <div className="detail-grid" style={{ marginTop: 12 }}>
              <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{def.name}</span></div>
              <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{def.category}</span></div>
              <div className="detail-row"><span className="detail-label">Manufacturer</span><span className="detail-value">{def.manufacturer}</span></div>
              <div className="detail-row"><span className="detail-label">Version</span><span className="detail-value">v{def.version}</span></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={doPublishAndActivate}>Confirm: Publish & Activate</button>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Publish only */}
      {modal === 'confirm-publish' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Publish Definition</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box info">
              <span>ℹ</span>
              <div>
                <strong>This will publish <em>{def.name}</em> to the catalog.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>The definition will be in Published state. A separate Activation step is required before customers can link assets to it.</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={doPublish}>Confirm: Publish</button>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Activate only (from Published) */}
      {modal === 'confirm-activate' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Activate Definition</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box success">
              <span>✓</span>
              <div>
                <strong>Ready to activate <em>{def.name}</em>.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>This definition is already published. Activating will make it immediately available to Customer Admins.</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={doActivate}>Confirm: Activate</button>
          </div>
        </ModalOverlay>
      )}

      {/* Validation: Already Published (tried Publish or Publish & Activate on an already-published definition) */}
      {modal === 'already-published' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Cannot Publish</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box warning">
              <span>⚠</span>
              <div>
                <strong>This asset definition is already published. Activation required.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                  The definition <em>{def.name}</em> is in <strong>Published</strong> state and does not need to be published again.
                  Use the <strong>Activate</strong> button to make it live.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setModal(null); handleActivate() }}>Go to Activate</button>
          </div>
        </ModalOverlay>
      )}

      {/* Validation: Already Active */}
      {modal === 'already-active' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Already Active</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box success">
              <span>✓</span>
              <div>
                <strong>This asset definition is already published and active.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>No further action is required. The definition is live in the catalog.</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => setModal(null)}>OK</button>
          </div>
        </ModalOverlay>
      )}

      {/* Info: can't activate a Draft */}
      {modal === 'publish' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Publish Required First</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-box warning">
              <span>⚠</span>
              <div>
                <strong>This definition must be published before it can be activated.</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>Use <strong>Publish</strong> or <strong>Publish & Activate</strong> to proceed.</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setModal('confirm-publish-activate') }}>Publish & Activate</button>
          </div>
        </ModalOverlay>
      )}
    </>
  )
}

function StateBadge({ state }: { state: DefinitionState }) {
  return (
    <span className={`state-badge ${state.toLowerCase()}`}>
      {state === 'Active' && '● '}
      {state === 'Published' && '◉ '}
      {state === 'Draft' && '○ '}
      {state}
    </span>
  )
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {children}
      </div>
    </div>
  )
}
