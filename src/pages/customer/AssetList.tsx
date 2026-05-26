import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function AssetList() {
  const { assets, definitions } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const getLinkStatus = (asset: typeof assets[0]) => {
    if (asset.linkedDefinitionId) return 'linked'
    if (asset.recommendedDefinitionId) return 'recommended'
    return 'unlinked'
  }

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase())
    const status = getLinkStatus(a)
    const matchStatus = filterStatus === 'all' || status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: assets.length,
    linked: assets.filter(a => a.linkedDefinitionId).length,
    recommended: assets.filter(a => !a.linkedDefinitionId && a.recommendedDefinitionId).length,
    unlinked: assets.filter(a => !a.linkedDefinitionId && !a.recommendedDefinitionId).length,
  }

  const getLinkedName = (asset: typeof assets[0]) => {
    const defId = asset.linkedDefinitionId || asset.recommendedDefinitionId
    if (!defId) return '—'
    const def = definitions.find(d => d.id === defId)
    return def ? def.name : defId
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-subtitle">View and manage your facility assets. Link assets to catalog definitions for enriched data.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/customer/assets/new')}>
            + Add Asset
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Assets', count: counts.all, color: '#6b7280' },
          { label: 'Linked', count: counts.linked, color: '#16a34a' },
          { label: 'Recommended', count: counts.recommended, color: '#f97316' },
          { label: 'Unlinked', count: counts.unlinked, color: '#6b7280' },
        ].map(tile => (
          <div key={tile.label} className="card" style={{ padding: '12px 20px', margin: 0, flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: tile.color }}>{tile.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Info about recommendations */}
      {counts.recommended > 0 && (
        <div className="info-box warning">
          <span>💡</span>
          <div>
            <strong>{counts.recommended} asset{counts.recommended > 1 ? 's have' : ' has'} a catalog recommendation available.</strong>
            <span style={{ fontSize: 12, marginLeft: 4 }}>Open the asset to review and accept the catalog information.</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search assets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="linked">Linked</option>
          <option value="recommended">Recommended</option>
          <option value="unlinked">Unlinked</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Serial No.</th>
            <th>Location</th>
            <th>Category</th>
            <th>Catalog Link</th>
            <th>Definition</th>
            <th>Install Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--theme-color-soft-text)' }}>No assets found</td>
            </tr>
          )}
          {filtered.map(asset => {
            const status = getLinkStatus(asset)
            return (
              <tr key={asset.id} className="clickable" onClick={() => navigate(`/customer/assets/${asset.id}`)}>
                <td className="link-cell">{asset.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{asset.serialNumber}</td>
                <td>{asset.location}</td>
                <td>{asset.category}</td>
                <td>
                  <span className={`link-status ${status}`}>
                    {status === 'linked' && '✓ Linked'}
                    {status === 'recommended' && '💡 Recommended'}
                    {status === 'unlinked' && '○ Unlinked'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>{getLinkedName(asset)}</td>
                <td>{asset.installDate}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
