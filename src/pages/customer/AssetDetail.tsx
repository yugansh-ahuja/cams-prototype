import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const { assets, definitions, updateAsset, addToast } = useApp()
  const navigate = useNavigate()

  const asset = assets.find(a => a.id === id)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [accepted, setAccepted] = useState(false)

  if (!asset) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-color-soft-text)' }}>
        Asset not found. <span className="link-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/assets')}>Back to Assets</span>
      </div>
    )
  }

  const linkedDef = asset.linkedDefinitionId
    ? definitions.find(d => d.id === asset.linkedDefinitionId)
    : null

  const recommendedDef = !asset.linkedDefinitionId && asset.recommendedDefinitionId
    ? definitions.find(d => d.id === asset.recommendedDefinitionId)
    : null

  const linkStatus = linkedDef ? 'linked' : recommendedDef ? 'recommended' : 'unlinked'

  const handleAccept = () => {
    const defToLink = recommendedDef
    if (!defToLink) return
    updateAsset({ ...asset, linkedDefinitionId: defToLink.id, recommendedDefinitionId: undefined })
    setShowAcceptModal(false)
    setAccepted(true)
    addToast({
      type: 'success',
      title: 'Catalog Linked',
      message: `${asset.name} is now linked to "${defToLink.name}".`,
    })
  }

  const defForModal = recommendedDef

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/customer/assets')}>Assets</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{asset.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{asset.name}</h1>
          <p className="page-subtitle">S/N: {asset.serialNumber} · {asset.location}</p>
        </div>
        <div className="page-actions">
          <span className={`link-status ${linkStatus}`}>
            {linkStatus === 'linked' && '✓ Linked to Catalog'}
            {linkStatus === 'recommended' && '💡 Recommendation Available'}
            {linkStatus === 'unlinked' && '○ Not Linked'}
          </span>
        </div>
      </div>

      {/* Recommendation Banner (HC-6066 / Flow 3) */}
      {recommendedDef && !accepted && (
        <div className="info-box warning" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <strong>Catalog recommendation available</strong>
              <div style={{ fontSize: 13, marginTop: 2 }}>
                A catalog definition matching this asset has been identified: <strong>{recommendedDef.name}</strong> ({recommendedDef.manufacturer} — {recommendedDef.model}).
                Linking will enrich this asset with standardised data.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingLeft: 30 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAcceptModal(true)}>
              Review &amp; Accept
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => addToast({ type: 'info', title: 'Dismissed', message: 'Recommendation dismissed for this session.' })}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Unlinked prompt (HC-6843 flow entry for unlinked) */}
      {linkStatus === 'unlinked' && (
        <div className="info-box info">
          <span>📂</span>
          <div>
            <strong>No catalog definition linked.</strong>
            <span style={{ fontSize: 12, marginLeft: 6 }}>
              Browse the catalog to find a matching definition and enrich this asset with standardised data.
            </span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 12 }}
              onClick={() => navigate('/customer/catalog')}
            >
              Browse Catalog
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Asset Details */}
        <div className="card">
          <h3 className="card-title">Asset Details</h3>
          <div className="detail-grid">
            <div><div className="detail-label">Name</div><div className="detail-value">{asset.name}</div></div>
            <div><div className="detail-label">Serial Number</div><div className="detail-value" style={{ fontFamily: 'monospace' }}>{asset.serialNumber}</div></div>
            <div><div className="detail-label">Category</div><div className="detail-value">{asset.category}</div></div>
            <div><div className="detail-label">Location</div><div className="detail-value">{asset.location}</div></div>
            <div><div className="detail-label">Install Date</div><div className="detail-value">{asset.installDate}</div></div>
            <div><div className="detail-label">Manufacturer</div><div className="detail-value">{asset.manufacturer || '—'}</div></div>
            <div><div className="detail-label">Model</div><div className="detail-value">{asset.model || '—'}</div></div>
            <div><div className="detail-label">Notes</div><div className="detail-value">{asset.notes || '—'}</div></div>
          </div>
        </div>

        {/* Catalog Information */}
        <div className="card">
          <h3 className="card-title">Catalog Information</h3>
          {linkedDef ? (
            <>
              <div className="info-box info" style={{ marginBottom: 16 }}>
                <span>✓</span>
                <span>Linked to <strong>{linkedDef.name}</strong> (v{linkedDef.version})</span>
              </div>
              <div className="detail-grid">
                <div><div className="detail-label">Definition Name</div><div className="detail-value">{linkedDef.name}</div></div>
                <div><div className="detail-label">Manufacturer</div><div className="detail-value">{linkedDef.manufacturer}</div></div>
                <div><div className="detail-label">Model</div><div className="detail-value">{linkedDef.model}</div></div>
                <div><div className="detail-label">Expected Lifespan</div><div className="detail-value">{linkedDef.expectedLifespan} years</div></div>
                <div><div className="detail-label">MSRP</div><div className="detail-value">${linkedDef.msrp?.toLocaleString()}</div></div>
                <div><div className="detail-label">Version</div><div className="detail-value">v{linkedDef.version}</div></div>
              </div>
              {linkedDef.specifications && linkedDef.specifications.length > 0 && (
                <>
                  <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Technical Specifications</div>
                  <table className="data-table" style={{ marginTop: 0 }}>
                    <thead>
                      <tr><th>Specification</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                      {linkedDef.specifications.map(s => (
                        <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--theme-color-soft-text)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
              {recommendedDef
                ? 'A recommendation is available. Accept it above to see catalog details.'
                : 'No catalog definition linked to this asset.'}
            </div>
          )}
        </div>
      </div>

      {/* Acceptance Modal (HC-5635 / HC-6066) */}
      {showAcceptModal && defForModal && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Information available from Catalog</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAcceptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--theme-color-soft-text)', fontSize: 14 }}>
                The following catalog definition matches this asset. Accepting will link the asset and enrich it with standardised data.
              </p>
              <div className="card" style={{ background: 'var(--theme-color-ghost-selected)', marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{defForModal.name}</div>
                <div style={{ color: 'var(--theme-color-soft-text)', fontSize: 13, marginBottom: 12 }}>
                  {defForModal.manufacturer} — {defForModal.model} · v{defForModal.version}
                </div>
                <div className="detail-grid" style={{ gap: '8px 24px' }}>
                  <div>
                    <div className="detail-label">Category</div>
                    <div className="detail-value">{defForModal.category}</div>
                  </div>
                  <div>
                    <div className="detail-label">Expected Lifespan</div>
                    <div className="detail-value">{defForModal.expectedLifespan} years</div>
                  </div>
                  <div>
                    <div className="detail-label">MSRP</div>
                    <div className="detail-value">${defForModal.msrp?.toLocaleString()}</div>
                  </div>
                </div>
                {defForModal.description && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--theme-color-soft-text)' }}>
                    {defForModal.description}
                  </div>
                )}
                {defForModal.specifications && defForModal.specifications.length > 0 && (
                  <>
                    <div style={{ marginTop: 14, marginBottom: 8, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>Specifications</div>
                    {defForModal.specifications.map(s => (
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
              <button className="btn btn-secondary" onClick={() => setShowAcceptModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAccept}>Accept &amp; Link</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
