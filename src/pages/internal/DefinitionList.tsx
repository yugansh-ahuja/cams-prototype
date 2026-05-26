import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type DefinitionState } from '../../data/mockData'

export default function DefinitionList() {
  const { definitions } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState<string>('all')

  const filtered = definitions.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    const matchState = filterState === 'all' || d.state.toLowerCase() === filterState
    return matchSearch && matchState
  })

  const counts = {
    all: definitions.length,
    draft: definitions.filter(d => d.state === 'Draft').length,
    published: definitions.filter(d => d.state === 'Published').length,
    active: definitions.filter(d => d.state === 'Active').length,
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Definitions</h1>
          <p className="page-subtitle">Manage standardised asset definitions for the catalog</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/internal/definitions/new')}>
            + New Definition
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', count: counts.all, color: '#6b7280' },
          { label: 'Draft', count: counts.draft, color: '#6b7280' },
          { label: 'Published', count: counts.published, color: '#1a8fff' },
          { label: 'Active', count: counts.active, color: '#16a34a' },
        ].map(tile => (
          <div key={tile.label} className="card" style={{ padding: '12px 20px', margin: 0, flex: 1, minWidth: 80 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: tile.color }}>{tile.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search definitions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="all">All States</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Manufacturer / Model</th>
            <th>State</th>
            <th>Version</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-color-soft-text)' }}>
                No definitions found
              </td>
            </tr>
          )}
          {filtered.map(def => (
            <tr
              key={def.id}
              className="clickable"
              onClick={() => navigate(`/internal/definitions/${def.id}`)}
            >
              <td className="link-cell">{def.name}</td>
              <td>{def.category}</td>
              <td>{def.manufacturer} — {def.model}</td>
              <td>
                <StateBadge state={def.state} />
              </td>
              <td>v{def.version}</td>
              <td>{def.createdDate}</td>
              <td onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/internal/definitions/${def.id}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
