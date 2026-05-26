import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { workOrders, assets, definitions, addToast } = useApp()
  const navigate = useNavigate()

  const wo = workOrders.find(w => w.id === id)

  if (!wo) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-color-soft-text)' }}>
        Work order not found.{' '}
        <span className="link-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/technician/workorders')}>
          Back to Work Orders
        </span>
      </div>
    )
  }

  const asset = assets.find(a => a.id === wo.assetId)
  const linkedDef = asset?.linkedDefinitionId
    ? definitions.find(d => d.id === asset.linkedDefinitionId)
    : null
  const recommendedDef = asset && !asset.linkedDefinitionId && asset.recommendedDefinitionId
    ? definitions.find(d => d.id === asset.recommendedDefinitionId)
    : null

  const isOverdue = wo.dueDate < new Date().toISOString().split('T')[0]

  const priorityColor: Record<string, string> = {
    High: '#dc2626',
    Medium: '#f97316',
    Low: '#6b7280',
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/technician/workorders')}>Work Orders</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{wo.id}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{wo.title}</h1>
          <p className="page-subtitle">
            {wo.id} · Assigned to {wo.assignee}
          </p>
        </div>
        <div className="page-actions">
          <span className={`priority-badge ${wo.priority.toLowerCase()}`}>{wo.priority}</span>
          <span className={`state-badge ${wo.status.toLowerCase().replace(' ', '-')}`} style={{ marginLeft: 8 }}>
            {wo.status === 'Open' && '○ '}
            {wo.status === 'In Progress' && '◉ '}
            {wo.status === 'Completed' && '● '}
            {wo.status}
          </span>
        </div>
      </div>

      {isOverdue && (
        <div className="info-box warning">
          <span>⚠</span>
          <strong>This work order is overdue.</strong>
          <span style={{ fontSize: 12, marginLeft: 4 }}>Due date: {wo.dueDate}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Work Order Details */}
        <div className="card">
          <h3 className="card-title">Work Order Details</h3>
          <div className="detail-grid">
            <div>
              <div className="detail-label">WO Number</div>
              <div className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{wo.id}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">
                <span className={`state-badge ${wo.status.toLowerCase().replace(' ', '-')}`}>
                  {wo.status === 'Open' && '○ '}
                  {wo.status === 'In Progress' && '◉ '}
                  {wo.status === 'Completed' && '● '}
                  {wo.status}
                </span>
              </div>
            </div>
            <div>
              <div className="detail-label">Priority</div>
              <div className="detail-value">
                <span style={{ color: priorityColor[wo.priority] ?? '#6b7280', fontWeight: 600 }}>{wo.priority}</span>
              </div>
            </div>
            <div>
              <div className="detail-label">Due Date</div>
              <div className="detail-value" style={{ color: isOverdue ? '#dc2626' : undefined }}>
                {wo.dueDate}{isOverdue ? ' ⚠ Overdue' : ''}
              </div>
            </div>
            <div>
              <div className="detail-label">Assignee</div>
              <div className="detail-value">{wo.assignee}</div>
            </div>
          </div>
        </div>

        {/* Asset Information — HC-6049 */}
        <div className="card">
          <h3 className="card-title">Asset Information</h3>
          {asset ? (
            <>
              <div className="detail-grid">
                <div><div className="detail-label">Asset Name</div><div className="detail-value">{asset.name}</div></div>
                <div><div className="detail-label">Serial Number</div><div className="detail-value" style={{ fontFamily: 'monospace' }}>{asset.serialNumber}</div></div>
                <div><div className="detail-label">Category</div><div className="detail-value">{asset.category}</div></div>
                <div><div className="detail-label">Location</div><div className="detail-value">{asset.location}</div></div>
                <div><div className="detail-label">Manufacturer</div><div className="detail-value">{asset.manufacturer || '—'}</div></div>
                <div><div className="detail-label">Model</div><div className="detail-value">{asset.model || '—'}</div></div>
                <div><div className="detail-label">Install Date</div><div className="detail-value">{asset.installDate}</div></div>
                <div>
                  <div className="detail-label">Catalog Status</div>
                  <div className="detail-value">
                    {linkedDef && <span className="link-status linked">✓ Linked</span>}
                    {recommendedDef && <span className="link-status recommended">💡 Recommended</span>}
                    {!linkedDef && !recommendedDef && <span className="link-status unlinked">○ Unlinked</span>}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--theme-color-soft-text)', fontSize: 14 }}>Asset not found (ID: {wo.assetId})</div>
          )}
        </div>
      </div>

      {/* Catalog Definition Panel — shown when asset is linked (HC-6049) */}
      {linkedDef && (
        <div className="card">
          <h3 className="card-title">Catalog Definition — Reference Data</h3>
          <div className="info-box info" style={{ marginBottom: 16 }}>
            <span>📋</span>
            <span>This asset is linked to catalog definition <strong>{linkedDef.name}</strong> (v{linkedDef.version}). Use this data for reference during maintenance.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px', marginBottom: 16 }}>
            <div><div className="detail-label">Manufacturer</div><div className="detail-value">{linkedDef.manufacturer}</div></div>
            <div><div className="detail-label">Model</div><div className="detail-value">{linkedDef.model}</div></div>
            <div><div className="detail-label">Expected Lifespan</div><div className="detail-value">{linkedDef.expectedLifespan} years</div></div>
            <div><div className="detail-label">MSRP</div><div className="detail-value">${linkedDef.msrp?.toLocaleString()}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><div className="detail-label">Description</div><div className="detail-value">{linkedDef.description}</div></div>
          </div>
          {linkedDef.specifications && linkedDef.specifications.length > 0 && (
            <>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Technical Specifications</div>
              <table className="data-table" style={{ marginTop: 0 }}>
                <thead><tr><th>Specification</th><th>Value</th></tr></thead>
                <tbody>
                  {linkedDef.specifications.map(s => (
                    <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Recommendation note for technicians */}
      {recommendedDef && (
        <div className="info-box warning">
          <span>💡</span>
          <div>
            <strong>Catalog recommendation available for this asset.</strong>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              A matching definition has been identified: <strong>{recommendedDef.name}</strong>. Ask your Customer Admin to accept the recommendation for enriched asset data.
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/technician/workorders')}>Back</button>
        {wo.status !== 'Completed' && (
          <button
            className="btn btn-primary"
            onClick={() => addToast({ type: 'info', title: 'Action Required', message: 'Status update is handled by your work order management system.' })}
          >
            {wo.status === 'Open' ? 'Start Work' : 'Mark Complete'}
          </button>
        )}
      </div>
    </>
  )
}
